---
title: "Inside the Gauntlet loop"
description: "The techniques inside the adversarial agent loop that builds CS Brasil: a 25-criterion visual rubric written so a language model can grade a PNG, critic prompts that ban vague answers by name, a generated symbol-level conflict table for a 6,543-line file, and a regression hunter with permission to find nothing."
date: 2026-08-07
readTime: "11 min"
cover: "/art/blog/inside-the-gauntlet-loop.png"
tags: ["ai", "agents", "gamedev", "orchestration"]
---

One Gauntlet round turned the brightest map in CS Brasil into the darkest. A capture agent was told to normalize exposure across the five maps, and it anchored on the darkest frame in the set. The Piscinão, a beach pool map in Rio de Janeiro, came out darker than the night scenes. The fix is now one line in the skill file: calibrate against the mean of the 8 frames, never the darkest one.

I already wrote about this loop twice. [The first post](/blog/shipping-a-browser-fps) covers the shape of a round: six moves, adversarial critics, parallel builders, the three laws. [The second](/blog/cs-brasil-ai-harness) covers the measurement engine underneath: the Node harness, the 61 invariants, the mutation tests. The loop spec itself is public at [somethingbig.ai/gauntlet-loop](https://somethingbig.ai/gauntlet-loop). This one is the layer in between, the part people actually ask me about: the exact techniques. The rubric text, the prompt contracts, the generated conflict table, the capture battery. Everything below is a file you can open in the repo.

## A rubric a language model can grade

`tools/eval/BAR.md` is 905 lines for 25 criteria, labeled A1 through D4, each one PASS/FAIL against a single PNG. The length is the point: a criterion is not a criterion until a model can decide it without taste.

Look at the anatomy of one. A1, ambient occlusion at the wall-floor junction: sample a perpendicular profile across the junction, PASS if luminance drops monotonically by ΔL* ≥ 8 in the final ~15 cm before the edge, FAIL if luminance stays constant up to the corner. Or A3, no structural clipping: under 1.0% of pixels with L* below 3, under 0.5% with L* above 97, sky and emissives excluded. Or C2, desaturated scene: mean HSV saturation of the scenery between 0.10 and 0.30, at most 5% of pixels above S 0.55, and those saturated pixels must belong to something functional or to an orientation landmark. No decorative red competing with a functional red.

Two structural decisions make this work. First, the exclusion preamble: before any measurement, convert the frame to CIE L*a*b*, remove the HUD, crosshair, and viewmodel, and remove the sky, with the sky itself defined numerically (above the horizon line, luminance over 80, saturation under 0.25). Without this, every critic measures a different image. Second, the rubric splits into two independent axes: axis A asks "does this look like a modern FPS" against CS2 and Valorant references, axis B asks "does this look like the real Brazil" against the actual place the map cites. A map can pass A and fail B (pretty and generic) or the reverse (recognizable and ugly). Collapsing those into one score would hide both failure modes.

The reporting protocol bans taste verdicts. The critic reports a count, like 18/25 PASS, and lists each FAIL with the measured value against the target. The file states it plainly: the rubric already is the verdict.

## The critic prompt is a contract

The prompt skeletons live in `.claude/skills/gauntlet-fps/references/prompts.md`. Every agent in the loop, critic or builder, opens with the same block of hard rules: read BAR.md and ARCH.md first, never open Chrome or Playwright (one dedicated agent owns the browser), npm install is blocked, in `game.js` use only the Edit tool because other agents are editing it right now, every risky change gets a kill-switch querystring, and `node --check` on every edited file before returning.

The critic's deliverable is specified like an API response: a 0-10 score with a three-line justification, then the N decisive gaps ordered by impact divided by cost, each gap with three fields. What you see in the frame that exposes it, citing the screenshot file. The probable cause at file:line, located through ARCH.md. The concrete fix with numeric values. The prompt then bans its own most likely failure mode with a literal example pair. "Improve the lighting" is an invalid answer. "SSAO half-res with 8 samples in the bloom.js composite, radius 0.6m, and the floor 8 L* points darker than the walls" is a valid one.

Two smaller decisions matter as much. Critics are explicitly allowed to write Python (PIL is installed) to measure L*, saturation, contrast, and flat-block percentage, because measuring is cheap and turns criticism into something the next round can verify. And the builder receives the critic's text truncated to 7k-11k characters: enough for direction, not enough to drown the context. Prompt design is API design, down to the payload size limit.

## The conflict table is solved, not written

`game.js` is 6,543 lines and every front needs it, so parallel builders partition it through `tools/eval/ARCH.md`, which is generated by `tools/gen-arch.mjs` and gated in CI by `npm run arch:check`.

The generator's comment header explains the one idea that makes it work. The hand-written ARCH.md declared front to line, mixing two things with very different shelf lives. Front to symbol is human knowledge and stable: the weapons front owns `_buildViewModels`, `_switchWeapon`, `_fireHitscan` and fifteen siblings. Symbol to line is volatile: it changes with every commit, so the script resolves it fresh each run with three regexes. Class methods are exactly two spaces of indentation with the brace on the same line. Arrow methods assigned at runtime (`this._vmFrame = (force) => {`) needed their own pattern: version 1 of the script did not see them, and `_vmFrame`, roughly 100 lines, was invisible in the index. Top-level const, let, function, and class round out the index.

The output is not just a table. It merges contiguous ranges (gap of 12 lines or less) so the table stays legible. It marks the red zones, `update()`, `_dom()`, `constructor()`, as append-only because any front can legitimately need them and editing their core is the fastest way for two agents to collide. It builds a line-to-fronts map and emits a "fronts claiming the SAME lines" section when ownership overlaps, because a conflict table that contradicts itself is worse than none. It prints coverage: how many of the 6,543 lines have a declared owner, with the rest labeled neutral territory. It even validates the hand-written prose outside the generated block, flagging any file:line pointer that points past the end of the real file. And symbols declared in the fronts map that vanish from the code produce a loud warning, because a rename that nobody propagated is exactly how partitions silently rot.

The measured result, already mentioned in the first post: three agents editing disjoint ranges of the same file at once, zero content conflicts. What I did not say there is why it keeps working: the partition is re-derived from the code before every round, so it cannot drift. A generated table is a contract that renews itself.

## The regression hunter has permission to find nothing

The regression hunter is the most valuable agent in the loop, and its prompt is the strangest. It gets two screenshot directories and a diff (`git diff --stat`, then `git diff -- public/js public/style.css src | head -3000`), a checklist of what "worse" looks like, and one explicit instruction: if there is no regression, say so, do not invent. An agent asked to find problems will find problems. Permitting an empty report is what makes a non-empty one believable.

The checklist is specific: scene too dark or blown out, z-fighting, missing texture, vanished geometry, weapon invisible or out of frame, broken HUD, crosshair without contrast, and any change that multiplies draw calls or adds an expensive pass without a quality gate or a kill-switch. It reads like a bug tracker because it is one, compressed into a prompt.

The best trick in the whole loop lives here too. Isolating the weapon viewmodel in a screenshot normally requires a manual mask. The hunter does it with zero annotation: take the pixels that are invariant across the 4 yaw angles of the same map and aspect. The scenery rotates, the gun does not. From that mask you get the left edge, the right edge, and the screen area of the viewmodel at subpixel precision, which is how a claim like "the gun moved 3% left" becomes measurable instead of arguable.

The hunter's verdicts go first in the next round. Regressions do not get to sleep.

## Capture is slow, stateful, and easy to fake

`tools/eval/gl-shots.mjs` is the battery: 5 maps times 2 aspects times 4 angles, plus the menu screens navigated through the DOM. The aspects are 1600x900 and 1500x1000, and the second one exists because I play in 3:2. Validating weapon framing only in 16:9 once cost an entire round.

Every capture waits for `window.__game.state === 'live'` with a 900-second timeout, then waits 30 seconds of gameplay before reading metrics: `renderer.info` (calls, triangles, textures, programs, geometries) and `usedJSHeapSize`. Under SwiftShader software rendering the game runs at about 0.3 FPS, so one map and aspect takes 4 to 6 minutes and the full battery takes 40 to 60. The capture prompt tells the agent two things that sound like jokes and are not: do not give up before 3600 seconds, and slowness is not a bug.

The statefulness is where the fake bugs breed. Zombie Chrome processes from failed runs eat 200% CPU, so the prompt starts with `pkill -f chrome`. Two heavy headless sessions in parallel crash the boot and manufacture a frozen countdown that is actually just load, which is why exactly one agent in the whole loop is allowed to run a browser. And heap above ~350MB is an alarm: the project already had its OOM crash (the "Aw Snap" from preloading every viewmodel at once, now lazy-loaded), and a fast-rising texture count is the precursor. The metrics table exists so that "the game feels heavier this round" has a number attached before anyone argues about it.

## Prompts are dependencies too

The loop loads 32 skills: 2 written by me, 30 third-party ones pinned in `skills-lock.json`. The file format is a package-lock for prompts: each entry carries the source repo, the path to the SKILL.md inside it, and a `computedHash` SHA-256 of the content.

The threat model is the same as npm's. A skill is instructions executed by an agent with tools, and an upstream edit silently changes the behavior of every agent in the loop. One reworded sentence in a critic skill and your gap reports change shape without a single commit in your repo. Pinning the hash is how a prompt becomes a reviewed dependency instead of a live wire into someone else's main branch.

## The expensive traps, so you skip them

The skill file ends with a table of traps that each cost real time. Four are worth stealing directly:

- **Calibrate by the mean, never the extreme.** The Piscinão incident from the opening. One round calibrated exposure by the darkest frame and inverted the brightness order of the maps.
- **Bump the `?v=` when you touch a `.js`.** The import map in `index.astro` serves the cached module otherwise. This one cost days of fixes that "never arrived" because the browser was running yesterday's code.
- **`//` is not a CSS comment.** The parser swallows the next block. It killed an entire `@keyframes` animation before anyone thought to look at the stylesheet.
- **Function over identity, by the numbers.** A builder once rotated the weapon model to "expose its identity" on screen and produced the classic bug where the crosshair points one place and the gun another. The ruling, validated by me playing: functional beats identity, yaw at most 0.09 radians.

## The lesson

Every prompt in this loop contains its own most likely failure mode, pre-rejected in writing. The rubric names the verdict it refuses. The hunter is told that "no regression" is a complete report. The capture agent is told that 0.3 FPS is normal. The builders are told which edit tool is forbidden and which file regions are red zones.

That is the technique worth copying, and it costs nothing: when you write a prompt for an agent, add the wrong answer and ban it. Not in a style guide the agent never reads, but inline, next to the deliverable, with a literal example. Agents do not read your mind. They read your prompt. Make the wrong answer illegal in the text they actually see.

*If your agents grade their own homework and you suspect the grades, my inbox is open.*
