---
title: "The AI harness behind the CS Brasil game"
description: "The machine that builds CS Brasil is no longer a folder of markdown. It is a measurement engine: the real game booted in pure Node, 61 invariants with mutation tests, generated docs that fail CI on drift, and four laws learned the expensive way."
date: 2026-08-04
updated: 2026-08-07
readTime: "9 min"
tags: ["ai", "agents", "gamedev", "harness"]
cover: "/art/blog/cs-brasil-ai-harness.png"
---

I already wrote the [build-side retrospective for CS Brasil](/blog/shipping-a-browser-fps): the Gauntlet loop, the adversarial critics, the parallel builders. That post is about how the game gets changed. This one is about how a change gets *believed*: the measurement engine underneath the loop. The repo is public, so everything here is a path you can open.

The previous version of this post described a folder of markdown. That was true at the time and isn't anymore. Since then the harness grew a spine: `tools/eval/` now holds 154 scripts, with 43 more pipeline scripts in `tools/`, all reachable through 41 npm scripts. Markdown still matters. It just no longer decides anything alone. Numbers do.

## The game boots without a browser

The most valuable file in the harness is `tools/eval/harness.mjs`. It boots the real, production `Game` class (the same code players run) inside plain Node, with the DOM and canvas stubbed out. No browser, no GPU, no rendering at all. This is only possible because the game is zero-build vanilla JS: plain modules you can `import` anywhere, no bundler in the way.

On top of that sits `botsim.mjs`, which plays full bot matches deterministically: 60 seconds, across all five maps, with fixed random seeds. Same seed, same match, every time. That one property turned game testing from archaeology into science. The old Playwright path cost about ten minutes per map at 0.3 FPS under software rendering, and two captures in parallel crashed the boot and manufactured bugs that were actually load. The Node harness answers in seconds, and its answers are reproducible.

## The gate is a list of invariants

`tools/eval/invariants.mjs` declares 61 invariant IDs (executable statements about what must always be true) and exits with code 1 if any critical one fails, which makes it a CI gate. It currently sits at 39 of 52 critical checks passing, and the reds are tracked in the open, not hidden.

The header of that file is the best documentation I've ever written, because it's a list of my own bug reports translated into physics. "The hands are floating" becomes a ceiling on hand-to-grip distance. "The gun points at the floor" becomes a maximum barrel angle. "Sniper without zoom" becomes: scoped field of view must be smaller than hip field of view. And the file carries the rule that keeps it honest: every new bug I report becomes an invariant. That is how a bug never comes back.

My favorite is AUD1, a meta-invariant: it checks that the ruler agrees with the game. It exists because the gate once measured a stale snapshot of the viewmodel and confidently reported red on code that was fine: the gate was lying, and now there's an invariant whose only job is catching the gate lying.

## Every ruler ships with a mutant

Mutation testing, for the uninitiated: you deliberately break the code (that's the mutant) and check that your tests catch it. If nothing goes red, your tests are decoration. The harness applies this to the rulers themselves: every invariant must ship with a mutation that turns it red.

The rule exists because of a humiliating result. A mutant that removed a real fix passed 20 of 22 checks GREEN. The invariant was reading the constant's *declaration* (still sitting pretty in the file) instead of its *use*. The fix was gone, the number was still there, and the ruler applauded. As the repo puts it: *uma régua que não reprova a versão anterior do próprio arquivo não é régua, é decoração*. A ruler that can't fail the previous version of its own file is decoration.

## The docs are generated, and CI checks

Every number in the README, the agent instructions, and the docs lives inside a generated block, delimited by `BEGIN:GERADO` markers and written by `tools/gen-docs.mjs`. `npm run docs:check` regenerates all of it and fails CI on any drift.

This was born from a real incident: a skill file claimed `game.js` had 3,234 lines while the file had quietly doubled in size. No rule watched that number, so it kept lying, politely, in the exact document every agent reads first. The rule that came out of it: **a number derivable from code is never written by hand.**

## Four laws, paid in full

The measurement engine runs on four laws, each with an incident receipt:

1. **Goodhart is undefeated.** An agent once raised the gate score from 16/21 to 19/21, and silently zeroed `VM_OFF`, the constant that positioned the entire viewmodel, destroying the look we had deliberately chosen. The agent didn't cheat. As the incident note says: *o agente não trapaceou, ele otimizou honestamente a única coisa que estava medida.* It honestly optimized the only thing being measured. The fix was VM12, an invariant that encodes intent, not just numbers.
2. **A ceiling without provenance is an opinion.** I spent three days fixing weapon framing against asserted numbers ("the muzzle sits at 0.66 of screen height") that nobody had ever measured in any pixel. The round only ended when we measured actual Counter-Strike 1.6 frames and replaced every asserted number with a measured one, plus the script that reproduces it. *Teto sem procedência é opinião.*
3. **Mutations or decoration.** Covered above.
4. **Generate the figure and LOOK at it.** Numbers without images fooled this project four separate times. A metric can go green while the frame is garbage. A loop that doesn't end with a human looking at a picture ends as a cautionary blog post. Like this one.

## Then and now

The delta since the last version of this post: eval scripts 106 → 154. Invariants 24 → 61. The invariant gate wasn't in CI at all; it now runs on every PR. `ARCH.md`, the line-level index of the 6,543-line `game.js`, was hand-written and wrong; it's now generated by `tools/gen-arch.mjs` with an `arch:check` gate. The 84KB append-only handoff log was replaced by a `STATUS.md` capped at 100 lines.

## What gets automated next

The harness is now big enough to need its own harness. The roadmap is a real file in the repo, and everything in it is developer-experience work. None of it touches game code:

- **A full mutation catalog.** Today every mutation is run by hand, one at a time, which means the gate can rot without anyone noticing. The plan is `tools/eval/mutate.mjs`: a declarative catalog mapping each invariant to the patch that should turn it red. Apply, run, restore, report. A mutant that kills its ruler is the normal case. A mutant that survives means a blind invariant, and that is the finding. The acceptance test is that it catches the holes we already know about.
- **A lessons file.** Every production bug becomes one written line in `docs/LICOES.md`, with the real case that generated it, read at the start of every agent session. Today that memory lives in my head and in scattered comments, and every new agent rediscovers the same traps at full price.
- **Cost accounting per front.** Tokens, tool calls, and gate delta logged per work front, in a plain JSONL file. A front that burns 300K tokens without moving the gate becomes visible as what it is: a front that produced text.
- **Hash verification for the pinned skills.** `skills-lock.json` pins SHA-256 hashes for 30 third-party skills, and nothing verifies them. A lock nobody checks is documentation, not a guarantee. One `skills:check` script fixes that, and it goes into the fast gate.
- **Subagents as configs, not prompts.** The critic, the builders, and the regression hunter currently exist as paragraphs of prompt text. They become real config files with their own tool restrictions (the critic gets no Write), their own worktree isolation, and their own models, because mechanical work doesn't need a frontier model.
- **Stop hooks.** A hook that blocks the end of the turn until `invariants.mjs` exits 0. The loop checks itself before the human even looks.

The pattern across all six: the instrumentation is becoming a product of its own, and it gets the same treatment as the game. Rulers with mutations, generated docs, gates in CI. The DX of the AI team gets the same rigor as the DX of the game, because the AI team is where the bugs are born now.

The lesson is short. Any check that depends on a human remembering to run it is already broken. You just haven't noticed yet.

*If you've ever watched a metric go green while the product got worse, my inbox is open.*
