---
title: "Building a browser FPS with AI agents"
description: "CS Brasil is a satirical browser FPS — 5 factions, 44 characters, 26 weapons, 5 maps, zero-build Three.js — built almost entirely by AI agents running a named adversarial loop: the Gauntlet. Critics grade, builders edit the same 6,543-line file in parallel, and the loop never ends itself."
date: 2026-07-24
updated: 2026-08-07
readTime: "10 min"
cover: "/art/blog/shipping-a-browser-fps.png"
tags: ["gamedev", "ai-agents", "webgl", "javascript", "threejs"]
---

CS Brasil is a satirical browser FPS built around fictional Brazilian politics. You open a URL and you're in a match. No launcher, no install, no account wall. It's at `v2.0.0-alpha.29`, and it's bigger than the joke that started it: **5 factions, 44 characters, 26 weapons, 5 maps, 526 versioned animation clips**, plus a Supabase-backed ranking that has recorded matches from 474 cities across 27 countries.

The stack is aggressively unfancy: vanilla JS plus a vendored Three.js, zero build step, everything served as plain modules. And here's the part that still feels strange to type: I did not write most of it. AI agents did, and they keep writing it, inside a system I built to keep them honest. This post is about that system. The measurement engine underneath it gets [its own post](/blog/cs-brasil-ai-harness).

## The loop has a name

The orchestration is a named system: the **Gauntlet Loop**, versioned in the repo at `.claude/skills/gauntlet-fps/SKILL.md`. It's one of 32 skills the project loads: 2 written by me, 30 third-party ones pinned by SHA-256 in `skills-lock.json`, because supply-chain hygiene applies to prompts too.

The Gauntlet is not a swarm and not a DAG. It's a role-based adversarial loop, and it exists because of one observation, kept in the skill file in Portuguese: *"Um agente sozinho produz um resultado decente e para. Ele para porque ele mesmo é quem julga."* A solo agent produces one decent result and stops, because it's grading its own homework, and it knows the reasoning behind every decision it made, which makes it excellent at explaining why its own work is acceptable.

## How a round works

A Gauntlet round has six moves, and the order is the design.

**1. The ruler exists before any edit.** `tools/eval/BAR.md` is a visual rubric with 25 criteria, each measurable in a single frame: lighting, silhouettes, HUD contrast, weapon framing. No edit starts until there's a way to lose.

**2. A measured baseline.** `tools/eval/gl-shots.mjs` captures headless screenshots of every map, at two aspect ratios, from four angles, plus the menu screens. Without a baseline there's no A/B, and without A/B the loop is opinion.

**3. Adversarial critics, in parallel, with clean context.** One per front: graphics, maps, weapons-visual, weapons-feel, UI-menu, UI-HUD, gameplay. Each critic gets the screenshots and the code, and *never* sees the builder's report, only the pixels. Each must return a 0-10 score plus gaps ordered by impact divided by cost, every gap with a `file:line` and a numeric fix. The skill states it literally: "improve the lighting" is an invalid answer. "22.7% of the pixels in this frame are near-black and the cause is `bloom.js:18`, `power=1.25`" is a valid one.

**4. Parallel builders, editing the same file.** Here's the scary part: `game.js` is 6,543 lines, about 26% of the codebase, and every front needs it. So the builders edit it simultaneously, partitioned by symbol through a generated conflict table: `tools/gen-arch.mjs` produces `tools/eval/ARCH.md`, an index of who may touch which line ranges. `constructor()`, `update()`, and `_dom()` are append-only red zones. The measured result: three agents editing disjoint ranges of the same file at once, zero content conflicts.

**5. Exactly one agent runs a browser.** Two heavy headless captures in parallel crash the game's boot and produce fake bugs: a "frozen countdown" that is actually just load. One browser, one agent, every time.

**6. A/B verification plus a regression hunter.** Two fresh critics with clean context: one re-runs the rubric on before/after frames and says which criteria moved from FAIL to PASS; the other has a single mission: find what got *worse*. It gets an explicit instruction: if there's no regression, say so. An agent asked to find problems will find problems; you have to permit it to find none.

Then a human reads the verdicts, puts regressions first in the next round (regressions don't get to sleep) and the loop runs again. The loop never self-terminates. The human stops it.

## Three laws

The whole thing rests on three rules that are worth more than any style guide: **the ruler is non-negotiable**; **quem constrói nunca dá a nota** (who builds never grades); **the loop never ends itself**. And the money quote, straight from the skill file: *"O que faz a diferença não é o número de agentes, é que cada afirmação carregue um número e um arquivo:linha."* What makes the difference isn't the number of agents. It's that every claim carries a number and a file:line.

## War stories

**The 13-regression round.** I once parallelized the weapon + hand + ADS system (ADS is aim-down-sights, the gun raised to your eye). One round later: thirteen regressions. The three systems share too much state to be partitioned safely, so that front is now one agent, sequential. Parallelism has a blast radius, and some systems are one brain.

**The wall you could feel.** The collision ruler went green on a map, but playing it, I kept hitting an invisible wall. The collision box was 0.68 meters off. *Meio passo se sente*: you feel half a step. The ruler measured that a collision existed; it didn't measure where. Filed under: the player is also an instrument.

**The gate that lied.** The verification gate once measured yesterday's viewmodel and confidently reported red: the capture had run against a stale build. A gate can lie, and there's now a meta-invariant whose only job is catching it.

## What I kept for myself

The division of labor from the first version of this game still holds. Agents get volume: code, maps, weapons, animation retargeting, the endless polish rounds. I keep taste and gates: the satire guardrails (exaggerated fictional archetypes, never real people, no gore), the renames, the deploys, and the stop button, because the loop doesn't have one.

The result is a game I could not have built alone, at a pace I would not have believed, with a paper trail of numbers behind every claim of "better." 26 weapons that feel distinct, 5 maps that each got their own criticism front, a HUD that survived the rubric, and an alpha that keeps absorbing players while the loop runs.

*If you're running adversarial loops on your own projects, or you think a 0-10 score from a language model is astrology with extra steps, my inbox is open.*
