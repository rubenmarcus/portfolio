---
title: "How RAG works inside Mirofi.sh"
description: "Mirofi.sh is a hosted multi-agent social-simulation platform built on an open-source engine, GraphRAG, and Zep. This is the retrieval story: what agent memory stores, how it feeds each turn, and where the graph earned its complexity."
date: 2026-05-28
readTime: "9 min"
tags: ["ai", "rag", "llm", "production"]
cover: "/art/blog/rag-in-production.png"
---

## What Mirofi.sh is

Mirofi.sh is a hosted platform for multi-agent social simulation. It productizes an open-source simulation engine, OASIS, into a SaaS: you define a scenario, we spin up hundreds of LLM agents with personas, drop them into a simulated social network, and let them post, reply, argue, and form opinions over thousands of ticks. Researchers use it to study how narratives spread. Teams use it to stress-test messaging before it goes public.

The engine gives you the agents and the world. What it does not give you, out of the box, is memory that survives contact with scale. An agent that forgets everything every turn is not a simulated person. It is a Markov chain with a vocabulary. So the core of what I built on top is a retrieval system: GraphRAG with Zep underneath, plus a lot of unglamorous plumbing. This post is how that retrieval works, what broke, and what I would redo.

## What the memory actually stores

There are three kinds of memory in the system, and confusing them was my first mistake.

- **Episodes.** Raw events. "Agent 14 replied to agent 7's post about the water tariff at tick 1,203." Small, immutable, timestamped. This is the write-ahead log of the simulation.
- **Distilled facts.** What the system believes is true about the world and its people. "Agent 7 opposes the tariff." "Agent 14 and agent 7 interact frequently and disagree." These live in the graph as nodes and edges, extracted from episodes.
- **Persona state.** A short per-agent summary of current mood, goals, and stance. A few hundred tokens, regenerated periodically. This is the highest-value text in the whole system per token.

Episodes are the source of truth. Facts are derived and can be wrong. Persona state is derived twice over and is definitely wrong in small ways at all times. Keeping that hierarchy straight saved me later, because when retrieval returned something suspicious I could always walk it back to the raw episodes.

## How a turn works

Every agent turn is a context assembly problem. The agent gets its persona state, the recent events in its feed, and retrieved memory relevant to what it is about to do. That last part is the RAG. The retrieval query is not the user's question, because there is no user. The query is the situation: the post the agent is about to reply to, plus the agent's own identity.

The retrieval path in `packages/memory/graph.ts` is hybrid by necessity:

```typescript
// packages/memory/graph.ts
export async function retrieveForTurn(input: TurnInput): Promise<MemoryBlock> {
  const { agentId, situation, tick } = input;

  const [episodes, relations] = await Promise.all([
    // vector search over episode summaries, scoped and time-weighted
    searchEpisodes({
      query: situation.text,
      filter: { simulationId: input.simulationId },
      limit: 8,
      timeDecay: { halfLifeTicks: 500, now: tick },
    }),
    // graph traversal: who is involved and what do I know about them
    graph.neighborhood({
      entities: extractEntities(situation.text).concat(agentId),
      maxHops: 2,
      asOfTick: tick,
    }),
  ]);

  return {
    relations: relations.edges.map(formatRelation),   // "agent 7 opposes the tariff"
    episodes: episodes.map(formatEpisode),            // "at tick 1,203 you replied..."
    tokenBudget: MEMORY_TOKEN_BUDGET,                 // hard cap, enforced downstream
  };
}
```

Two things worth noting. First, `timeDecay`: in a simulation, a recent event is almost always more relevant than an old one with a slightly better embedding score. Vector similarity alone kept surfacing ancient history because old episodes about the same topic were semantically closer. Recency weighting fixed what better embeddings did not. Second, the graph query and the vector query run in parallel and answer different questions. More on that below.

## Indexing choices for a simulation

Standard RAG advice says chunk every 500 tokens with overlap. That advice assumes documents. A simulation does not produce documents. It produces events, and events are already small. Chunking them further would shred the only context they have.

So the indexing unit is the episode, and the work goes into metadata and what gets embedded. The ingester in `packages/memory/ingest.ts`:

```typescript
// packages/memory/ingest.ts
export async function indexEpisode(event: SimEvent): Promise<void> {
  const episode: Episode = {
    id: event.id,
    simulationId: event.simulationId,
    tick: event.tick,
    actorIds: event.participants,
    type: event.type, // post | reply | repost | follow | reaction
    // embed a natural-language rendering, never the raw event JSON
    summary: renderEpisode(event),
  };

  await episodes.insert(episode, { embed: "summary" });

  // entity extraction is batched, not per event; see below
  extractionQueue.push(episode);
}
```

The decision that mattered: embed a rendered sentence, not the event payload. Early on I embedded the raw JSON event and retrieval was garbage, because embeddings of `{"type":"reply","parent_id":"p_8812"}` cluster by field names, not meaning. Rendering "Agent 14 disagreed with agent 7's post about the water tariff" before embedding made the vector index actually useful. This sounds obvious now. It was a week of bad retrievals then.

The other decision: entity and relationship extraction does not run per event. It runs in batches every N ticks over the extraction queue. Running an LLM extraction call on every one of the tens of thousands of events in a simulation would have made the platform unprofitable per run. Batching cut extraction cost by roughly 80 percent and the quality difference was unmeasurable.

## Where vectors were enough and where the graph earned it

Vanilla vector search over episode summaries handles the majority of retrieval needs: "what have I seen about topic X". For a single agent recalling its own feed, vectors plus recency is genuinely all you need, and for the first prototype that is all there was.

The failure mode appeared when agents needed social knowledge. "What does agent 14 think of agent 7" is not answered by any episode. It is answered by aggregating thirty interactions. "Who influenced the tariff debate" is worse: multi-hop, traversing replies to replies. Flat retrieval returned whichever single episode embedded closest, and agents formed opinions of each other based on one randomly selected argument.

That is what the graph is for. Relationships are first-class edges with sentiment and timestamps, so `neighborhood()` returns "agent 14 disagrees with agent 7 about the tariff, repeatedly, recently" instead of a pile of raw events the agent must re-derive it from on every turn. I verified the split with a small eval set: 40 situation queries, half topical, half relational, judged on whether retrieval contained the right material. Vector-only passed most topical queries and failed most relational ones. That eval, not a vendor blog post, is why the graph stayed.

## Freshness when hundreds of agents never stop writing

A simulation with 300 agents produces new memories continuously, and opinions change. Agent 7 can support the tariff at tick 200 and oppose it at tick 1,500. If both facts live in the graph with equal weight, retrieval returns a contradiction and the agent does what LLMs do with contradictions: picks one, confidently, at random.

The fix was to treat facts as superseding, not accumulating. A new relationship edge about the same pair and topic marks the old one superseded rather than deleting it, and retrieval reads `asOfTick`. This is just event sourcing applied to opinions. The bug that taught me this: an agent publicly "reversed" a position mid-simulation for no narrative reason, and a researcher flagged the run as unrealistic. The cause was retrieval returning a stale stance edge with equal rank to the current one. Deletion would also have worked, but keeping superseded edges lets us explain every agent belief after the fact, which turns out to be the feature researchers ask for most.

## What I would redo

Two things. First, I would not start with the graph. I would ship vectors plus recency, build the eval set on day one, and add GraphRAG exactly when the relational failure rate justified it. The graph costs extraction calls, ingestion latency, and a debugging experience that is strictly worse than reading a list. It earns that on Mirofi.sh because social reasoning is the product. It would not earn it on a docs chatbot.

Second, I would budget tokens per memory type from the start. Persona state, relations, and episodes now have hard caps and fight for a fixed memory budget per turn. Adding that after the fact meant re-tuning prompts that had silently grown dependent on unlimited context. Retrieval is not the hard part of RAG in a system like this. Deciding what not to retrieve is.
