---
title: "Evals are the product"
description: "What an eval actually is, learned the expensive way: a browser FPS gated by 61 invariants that must each ship with a failing mutation, and a quantum decoder benchmark won with one scalar and a five-step loop. The model changes every few months. The ruler survives."
date: 2026-07-02
readTime: "10 min"
tags: ["ai", "evals", "agents", "testing", "llm"]
cover: "/art/blog/evals-are-the-product.png"
---

On April 16 I submitted my last run to the QEC Decoder Optimization Arena, a public quantum error correction benchmark, and my decoder sat at rank 1: 2,642 errors per million, ahead of entries from people who do this for a living. I build React apps for a living. The thing that won was not a better model, and it was not a better idea. It was a better ruler.

That ruler has a name in AI work: an eval. This post is what I've learned about evals from two projects that have nothing in common except the method: the quantum decoder, and a browser FPS built almost entirely by AI agents.

## What an eval is, plainly

If you already know what an eval is, skip this section. For everyone else, the version as I understand it.

An eval is a ruler that answers one question: did it get better? With a number, not an opinion. "The code looks cleaner" is an opinion. "Errors per million went from 2,688 to 2,642" is a ruler. "The agent seems smarter with this prompt" is an opinion. "The gate went from 16/21 to 19/21" is a ruler.

This sounds obvious. It is not the default. The default way people work with AI is vibes: you change a prompt, eyeball three outputs, and declare improvement. Vibes have a known failure mode, which is that you see what you want to see. An eval is the thing you build so that the model's opinion of itself stops mattering. Including yours.

## The game gate: 61 rulers, each with a proof

My browser FPS, CS Brasil, is built mostly by agents. The gate that decides whether a change ships is `tools/eval/invariants.mjs`: 61 invariants, executable statements about what must always be true in the game. "The hands are floating" became a ceiling on hand-to-grip distance. "Sniper without zoom" became: scoped field of view must be smaller than hip field of view. Any critical failure exits with code 1, which makes it a CI gate.

The rule that keeps the file honest: every invariant must ship with a mutation that turns it red. Mutation testing, for the uninitiated, is breaking the code on purpose and checking that your tests catch it. If nothing goes red, your tests are decoration.

The rule exists because of a humiliating result. A mutant that removed an entire fix passed 20 of 22 checks GREEN. The invariant was reading the constant's declaration, still sitting in the file, instead of its use. The fix was gone, the number was still there, and the ruler applauded. As the repo puts it: a ruler that cannot fail the previous version of the file is decoration, not a ruler.

Then the Goodhart incident. An agent raised the gate from 16/21 to 19/21 and, in the same diff, silently zeroed `VM_OFF`, the constant that positioned the entire weapon viewmodel, destroying the look we had deliberately chosen. The agent didn't cheat. It honestly optimized the only thing being measured. That is Goodhart's law with a receipt: the moment a measure becomes a target, an optimizer hits the target and misses the point. The fix was an invariant that encodes the intent, not just the number.

And the third state nobody warns you about. An invariant can be green, red, or SKIPPED: the check never ran because its data source was missing. Blind invariants sat SKIPPED in my gate for months, green by absence of data. A gate that silently skips checks is worse than no gate, because it prints confidence it did not earn. Now a skip is reported as loudly as a failure.

## The decoder arena: one scalar, five steps

The quantum benchmark reduced everything to a single scalar: errors per million, across 24 noise scenarios. Lower wins. One file, 200KB max, numpy and scipy only, every decode under 2.5 seconds.

Every experiment ran through the same five steps. Write the hypothesis in plain English. Ship the smallest possible test script. Measure on a held-out seed, never the training one. Run a Z-score on a binomial test and require at least 2.0 to ship. Then kill or keep, and if we killed it, document why, so the idea never gets retested a week later by an agent that wasn't there.

I ran roughly 40 submissions in a week. Over 25 approaches were implemented and tested. Four shipped. That ratio is the real story. The eval's job was not to find the four winners. It was to kill the 21 losers fast, cheaply, and permanently. Killing an idea in one afternoon instead of one week is what the ruler is for.

## Why this beats chasing better models

The model changes every few months. The ruler survives. My decoder, my game gate, my held-out seeds: none of them care which model produced the work. When I switch models, the evals are the only thing that tells me whether the new one is actually better at my work or just newer.

Evals are also how a solo engineer compounds. Every bug I report in the game becomes an invariant, so it can never come back. Every null result in the arena became a documented kill, so it never gets retried. The knowledge stops living in my head and starts living in the repo, where the next agent session reads it for free. People ask which model wrote the game. The durable part of the answer is the measurement system, because it is the only part that survives the next model.

## The recipe

If you take one thing from this post, take the order of operations:

1. Pick one scalar. One. Errors per million, gate score, p95 latency. If your ruler has twelve numbers, you have no ruler.
2. Write the ruler before the fix. If you write it after, you will write a ruler that passes.
3. Prove the ruler with a mutation. Break the code on purpose and watch it go red. A ruler that cannot fail the previous version of the file is decoration.
4. Wire it into CI. A ruler you run when you remember is a ruler that rots.
5. Log cost against gate delta. A change that burns 300K tokens without moving the number produced text, not progress.

The lesson is the one I paid for twice: write the ruler first, and prove it can fail. Everything else, the models, the prompts, the agents, is replaceable. The ruler is the product.
