---
title: "From prompt to product: five ways to build with AI"
description: "Prompt engineering, vibe coding, agentic engineering, product engineering, and research engineering sound like names for the same thing. They are not. The difference is what you control, what feedback you trust, and who decides the work is done."
date: 2026-08-11
readTime: "10 min"
tags: ["ai", "agents", "product-engineering", "research"]
cover: "/art/blog/from-prompt-to-product-five-ways-to-build-with-ai.png"
---

A GitHub issue became a landing page in 8 minutes and 19 seconds. It took two iterations, 47,000 tokens, and $0.696. The agent wrote the React components, applied Tailwind, ran the validations, and stopped with a green build. I never opened the editor.

I covered that run in my article about [Ralph Starter](/blog/automating-entire-workflows-with-ralph-starter), the CLI I built to run coding agents in loops. The most common response was to call it vibe coding.

That was not entirely wrong. It also did not describe what happened.

A prompt did not fetch the issue, create a branch, select an agent, track eight tasks, run the build and linter, return the first failure, and decide to stop after the second iteration. The model wrote the code. The system around it turned a response into a delivery.

We now use the same term for five different activities: prompt engineering, vibe coding, agentic engineering, product engineering, and research engineering. They can happen in the same afternoon and even in the same terminal. The difference is the object you control and the proof you accept as completion.

## 1. Prompt engineering controls an interaction

Prompt engineering is the work of improving an instruction so a model returns a more useful response.

The normal scope is one conversation or API call. You provide context, define a format, add examples, impose constraints, and inspect the output. If the response is wrong, you change the instruction.

It is the right tool for bounded tasks:

- explain a piece of code;
- generate test cases for a function;
- convert a React component to Svelte;
- propose names for an API;
- review a query;
- create a first pass at a Tailwind component.

The human still holds the loop. They copy the context, read the response, choose the next step, and move the result into the real environment.

A good prompt reduces ambiguity. By itself, it does not create persistent memory, repository access, branch isolation, a browser, validation, or a stopping condition. Adding 2,000 more words to a prompt does not turn a conversation into a system.

I still use prompt engineering every day. I just do not expect it to solve an infrastructure problem.

## 2. Vibe coding controls direction

Vibe coding works best when I do not yet know exactly what the product should be.

I want to feel an animation. Compare three compositions. Find out whether a dashboard should feel dense or quiet. Test a navigation pattern before investing in architecture. In those situations, specifying everything too early freezes an idea that still needs to move.

The loop is fast:

```text
describe an intention
→ generate something visible
→ react to the result
→ keep, delete, or change direction
```

That is how I arrived at the 3D hero on this portfolio. The first generations tried to fit video, glyphs, floating snippets, and a 3D figure on the same stage. A lot was happening technically. Visually, it was a Frankenstein. The instruction that fixed it was to delete almost everything and keep one subject in a clean scene.

That was not a spec waiting to be executed. I was discovering the brief through the result.

Vibe coding is useful for exploration because feedback is cheap and human. The screen appears and I can tell whether the direction has a future. It becomes dangerous when that visual reaction is the only definition of done for authentication, payments, accessibility, data migration, or anything expected to survive past the demo.

A page can look right while failing at a 390px viewport, losing state on refresh, or sending private data to the client. The vibe found the direction. Another mode of work must now turn the direction into software.

## 3. Agentic engineering controls the environment

Agentic engineering begins when I stop asking only, "What prompt should I write?" and start designing the world in which the agent works.

That world includes:

- instruction files;
- specialized skills;
- allowed tools;
- recoverable context;
- isolated worktrees or branches;
- tests, lint, builds, and evals;
- iteration and cost limits;
- a verifiable completion signal.

[Ralph Starter](https://github.com/rubenmarcus/ralph-starter) is a small implementation of that idea. It accepts an inline spec, a GitHub issue, a Linear ticket, or a Notion page. It then runs this circuit:

```text
fetch the spec
→ create a branch
→ run the agent
→ run test, lint, and build
→ return the failure to the agent
→ repeat or open the pull request
```

The agent can be Claude Code, Codex, Cursor, OpenCode, OpenClaw, or Amp. The loop does not depend on a model's personality. Validation is the contract.

The incident that best explains this was an issue named only "Improve performance." With no metric, scenario, or budget, the agent tried a different optimization on every iteration. After three loops without proof of progress, the circuit breaker stopped the run. The problem was not a lack of intelligence. The system had no measurable definition of improvement.

Agentic engineering does not replace prompt engineering. It puts prompts inside a circuit with state, tools, and external feedback. It does not replace vibe coding either. I can explore an interface by vibe and, once the direction stabilizes, hand implementation to an agentic loop with screenshots, tests, and gates.

## 4. Product engineering controls the decision

An agent can deliver the wrong feature exactly as requested.

Product engineering decides which problem deserves to be solved, for whom, at what priority, and under which trade-offs. Code is one part of that decision. It is not always the expensive part.

When I build frontend with AI, there are questions no build can answer:

- Does the user understand the next step?
- Does this information deserve the first viewport?
- Does the feature reduce abandonment or only add surface area?
- Is the maintenance cost proportional to the expected value?
- Should we build, buy, simplify, or do nothing?

In CS Brasil, agents can create characters, maps, weapons, and dashboards. That does not mean the game improves with every new item. Telemetry needs to show where players stay, how long they spend on each map, when they abandon a match, and which systems almost nobody uses. Product work starts after deployment, when real behavior contradicts the prompt's intention.

There is also Goodhart's problem: once a measure becomes a target, the system learns to improve the number, including ways that damage the product. A CS Brasil agent once raised a gate score from 16/21 to 19/21 by zeroing a constant that positioned the viewmodel. The score improved. The framing we had chosen on purpose was destroyed.

The fix was not to ask the model to be more careful. We added an invariant that encoded the visual intention. Product engineering chose what had to be preserved. Agentic engineering turned that choice into a gate.

## 5. Research engineering controls evidence

In research, there is often no known feature waiting to be implemented. There is a hypothesis.

Research engineering organizes the search for an answer that may be negative. That changes the loop:

```text
form a hypothesis
→ implement the smallest experiment
→ measure against a benchmark
→ try to falsify the result
→ keep, kill, or refine the hypothesis
```

I used this mode in quantum-circuit and decoder-optimization challenges. Multiple agents explored routes in separate worktrees. Every candidate had to survive independent validation. Dead routes entered a graveyard with the exact reason for rejection, because three models rediscovering the same dead end is an expensive form of parallelism.

The difference from product engineering is the kind of truth being sought. Product asks whether something creates value under real constraints. Research asks whether a claim about the world or a system survives the experiment.

A broken prototype can be a good research result if it kills a hypothesis early. The same prototype would be a bad product delivery. The stopping condition changes everything.

## The same frontend in five modes

Imagine one task: build search for a catalog in Next.js.

**Prompt engineering:** ask for a debounce function or an accessible input component.

**Vibe coding:** generate three search experiences, trying filters, motion, and density until one interaction feels right.

**Agentic engineering:** put the spec in an isolated branch. The agent implements it, opens the browser, runs tests, measures performance, and prepares the PR.

**Product engineering:** decide whether search is actually the bottleneck, which events to measure, and whether the user needs free text, filters, or recommendations.

**Research engineering:** compare lexical, semantic, and hybrid ranking on a set of relevance-labeled queries.

React, Next.js, Svelte, and Tailwind do not determine the mode. They change the technical constraints. The work is still defined by the feedback that closes the loop.

## How I choose

I use this mental table:

| If the main uncertainty is... | Start with... | Proof of progress is... |
|---|---|---|
| how to ask | prompt engineering | a usable response |
| what I want to build | vibe coding | a direction worth keeping |
| how to execute safely | agentic engineering | external gates passing |
| what creates value | product engineering | user behavior and outcomes |
| what is true | research engineering | reproducible evidence |

In practice, a product moves through all five. I may research a technology, explore the experience by vibe, use prompts for local tasks, execute implementation with agents, and make product decisions from telemetry.

The mistake is using one mode's stopping condition in another. "It looks good" does not close production engineering. "The build passed" does not prove product value. "The agent agreed" is not research evidence.

The rule I apply now is simple: before choosing a model or writing a prompt, write down what observation would make you stop. The answer reveals what kind of work you are actually doing.

In the next article, I open the implementation: [my AI harness for frontend, from prompt to pull request](/blog/frontend-ai-harness-prompt-to-pull-request).
