---
title: "I rebuilt my agent loop in Mastra. Here's what my runtime gets right."
description: "I ran hand-rolled agent loops in production on a web3 agent platform (2.85M+ messages) and in ralph-starter. I spent a week rebuilding the same loop in Mastra to see what a framework buys. Head-to-head notes: what Mastra makes easy, what my runtime does that it can't, and who should pick which."
date: 2026-07-18
readTime: "9 min"
cover: "/art/blog/mastra-field-notes.png"
tags: ["ai", "agents", "mastra", "typescript"]
---

I am the wrong customer for agent frameworks and I know it. I was the top human committer on a production agent runtime at a web3 platform, a hand-rolled streaming agent loop that has processed 2.85M+ messages. ralph-starter is my open-source loop harness. Autoresearcher is my loop for autonomous research. When a framework shows up promising to handle agents, tools, workflows, and memory for me, my first reaction is to list what it will get wrong.

That reaction is also why the evaluation has to be fair. So I spent a week rebuilding a version of my production loop in Mastra and ran it head-to-head against my own code. Same tools, same model, same class of workload. These are the notes.

## The setup: my loop vs. theirs

My runtime loop is a while loop with a model call inside. Around it: OpenAPI-to-tool conversion, step logging, retry policy, abort plumbing, token accounting, and a hard step ceiling. Weeks of work, all mine, all debuggable in one file.

Mastra's version of the same thing is typed building blocks. Agents, tools, workflows, memory, each a plain TypeScript object with a Zod schema on the boundary. The smallest working version of my agent in Mastra:

```ts
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const searchDocs = createTool({
  id: "search-docs",
  description: "Search internal documentation by keyword",
  inputSchema: z.object({
    query: z.string(),
    limit: z.number().default(5),
  }),
  outputSchema: z.object({
    hits: z.array(z.object({ title: z.string(), url: z.string(), snippet: z.string() })),
  }),
  execute: async ({ query, limit }) => {
    const hits = await docsIndex.search(query, limit);
    return { hits };
  },
});

export const researcher = new Agent({
  name: "researcher",
  instructions: "Answer using search-docs first. Cite URLs. Say when you don't know.",
  model: "anthropic/claude-sonnet-4-5",
  tools: { searchDocs },
});
```

First honest point for Mastra. My runtime carries the same information as this block, but smeared across three files and two config layers. Theirs is data. I can diff it, review it in a PR, snapshot it per experiment. And the tool's `execute` is fully typed from the schemas, so the compiler catches a wrong return shape before the model hallucinates one. My converter validates tool outputs at runtime instead. Their way fails earlier. Failing earlier is better.

Calling it is boring in the good way:

```ts
const result = await researcher.generate("How does our retry policy handle 429s?");
console.log(result.text);
```

## What Mastra makes easy that my loop doesn't

**Workflows with suspend and resume.** My production loop was model-directed: the model picks the next tool until it stops. That shape resists frameworks, and I said so going in. But the moment a product needs "pause here for human approval," a hand-rolled loop is a nightmare of persisted state and resume tokens. Mastra workflows handle this as a primitive:

```ts
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

const planStep = createStep({
  id: "plan",
  inputSchema: z.object({ question: z.string() }),
  outputSchema: z.object({ subquestions: z.array(z.string()) }),
  execute: async ({ inputData }) => {
    const res = await planner.generate(inputData.question, {
      structuredOutput: { schema: z.object({ subquestions: z.array(z.string()) }) },
    });
    return res.object;
  },
});

const answerStep = createStep({
  id: "answer",
  inputSchema: z.object({ subquestions: z.array(z.string()) }),
  outputSchema: z.object({ answer: z.string() }),
  execute: async ({ inputData }) => {
    const notes = await Promise.all(inputData.subquestions.map(lookup));
    return { answer: await synthesize(notes) };
  },
});

export const researchFlow = createWorkflow({
  id: "research-flow",
  inputSchema: z.object({ question: z.string() }),
  outputSchema: z.object({ answer: z.string() }),
})
  .then(planStep)
  .then(answerStep)
  .commit();
```

Step-level retries with per-step policy, typed boundaries, and every step is a natural trace span. I built the tracing part of that by hand. It took longer than I want to admit.

**Memory with a schema.** My runtime's memory is thread-scoped storage I manage myself. Mastra's is the same idea, plus working memory where you declare the shape of what the agent should remember and the framework keeps that structured blob in context. I have built this by hand. It is fiddly. Declared-schema memory is strictly better than my approach for product agents.

**Evals in the same surface.** Mastra lets you attach scorers to an agent and run them against a dataset without a separate toolchain. Half the evals I have seen in the wild fail to exist because they required separate infrastructure. Boring integration beats a better tool nobody wired up.

## What my loop does that Mastra can't

Now the other column, and it is not short.

**The gate is the product.** In Autoresearcher, the evaluation gate decides keep or reject with statistical tests on held-out data. In that production runtime, the step ceiling, abort semantics around signed transactions, and per-step logging are load-bearing correctness. No framework ships your gate for you, and I want zero abstraction over mine. When verification can't run, nothing ships. That sentence is easier to enforce in a loop you own end to end.

**Model-directed control flow.** When the model reads results and picks its own next action, the loop is a while loop. Forcing that into a static graph adds a translation layer between you and the actual behavior. Mastra supports agent-driven flows, but the moment I wanted a custom stop condition checked twice per stream, I was reading their source to find which hook fires when. In my runtime that is five lines in a file I wrote.

**Streaming internals.** My runtime's keepalive frames, typed error frames, and offset-based reconnects [I wrote about separately](/blog/vercel-ai-sdk-streaming) exist because 2.85M messages found every gap. Framework defaults would not have survived that traffic unchanged. The seams exist in Mastra, but you trade "I control everything" for "I must learn where the seam is."

## What felt rough, honestly

A week is enough to hit edges. Docs and shipped types disagreed twice. Fine for a young framework, annoying mid-evaluation. Bundle weight is noticeable if you are deploying to serverless. And the abstraction tax is real: everything I wanted off the happy path cost source-reading time. None of this is disqualifying. All of it is the price of renting decisions instead of making them.

## The verdict, for someone choosing today

Adopt Mastra if you are a TypeScript team building product agents: typed tools, durable workflows, human-in-the-loop pauses, memory with a schema, evals in the same surface. You will ship in days what took me weeks, and most teams do not have a resident agent-loop obsessive. The boring 80% is done and tested by someone else. That is the actual case for any framework, and Mastra makes it well.

Keep your own loop if the loop itself is the product. Evaluation gates, money-adjacent abort semantics, control flow the model decides mid-flight. If those sentences describe your system, a framework's remaining 20% will cost you more than its 80% saves. Steal the idioms instead: typed tool schemas, step boundaries as trace spans, memory as a declared object. They port into a hand-rolled loop in an afternoon.

Did the rebuild beat my runtime? No. Did it beat what most teams would write instead of my runtime? Clearly. That is the honest bar for a framework, and Mastra clears it.

*If you're choosing between a framework and a hand-rolled loop and want to compare scars, my inbox is open.*
