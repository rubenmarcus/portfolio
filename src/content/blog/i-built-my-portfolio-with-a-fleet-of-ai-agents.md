---
title: "I built my portfolio with a fleet of AI agents"
description: "The making-of of this site: AI-generated 3D models that kept coming out as busts, a shader pipeline that morphs me into wireframe and ASCII, a visual gauntlet that grades every pixel, and what I learned about art-directing machines."
date: 2026-07-30
updated: 2026-08-07
readTime: "9 min"
cover: "/art/blog/i-built-my-portfolio-with-a-fleet-of-ai-agents.png"
tags: ["ai", "agents", "threejs", "webgl", "making-of"]
---

On the third cycle of the visual gauntlet I run against this site, the mean score across 12 screenshots was 29.83 out of 30. The missing fraction was a single email address that refused to fit inside its own card on a 390px viewport. A contact page that can't display the contact is a special kind of broken, and no green CI checkmark was going to catch it.

## The brief I gave myself

My old portfolio was a Next.js page from 2021 with a "new posts coming soon" that had been lying for four years. I build AI tooling for a living, and my own corner of the internet looked abandoned mid-sprint. Every recruiter, client, and collaborator landed there first. So I gave myself a brief: a portfolio that does three jobs: prove I can ship product, prove I can orchestrate AI agents, and be weird enough that people screenshot it.

So of course I built it with agents. What I didn't expect: the hardest part wasn't the code. It was **taste**. Agents will happily ship mediocre work with total confidence. This is the story of rejecting them until they got it right, with receipts: files, commands, and scores.

## Act 1: The bust problem

The hero concept: a stylized 3D me, sitting at a desk, coding, rendered as glowing green contour lines that dissolve into wireframe and ASCII as you scroll. The model would come from an AI 3D generator (Tripo, via an MCP pipeline).

Every generation came back as a bust. A giant floating head. I have a shaved head covered in tattoos, and the generator saw the reference photo and decided the head WAS the product. Three generations, three heads, credits burning. The fix wasn't a better prompt about my face; it was removing the face entirely. A text-only prompt ("engineer sitting at a desk typing, character occupies at most 60% of frame") produced the full scene on the first try.

**Lesson 1: when an AI anchors on the wrong thing, take the anchor away instead of arguing with it.**

## Act 2: "This looks amateur"

First assembled hero: layers on layers. A video background, an ASCII glyph field, floating code snippets, the 3D figure. Technically impressive, visually a mess. I looked at the screenshot and wrote back to the agent: "this is a Frankenstein, kill everything except the figure."

That instruction (one clean stage, one subject, cinematic lighting) is what turned the corner. The agent rewrote the hero around a single contour-shaded figure on a black stage, with fog for depth and a contact glow under the desk. AAA design is mostly deleting.

**Lesson 2: agents add; art direction subtracts. You are the taste layer.**

## Act 3: The typing problem

I wanted the character to actually type. The generated model was a single fused mesh, no bones, no rig. The answer: generate a separate character, auto-rig it (41 joints), and retarget a stock animation onto it. There's no "typing" preset in the library, but there's `play_video_game`, which is hands-forward-fingers-moving, close enough that it reads as typing at hero distance.

Then the real bug: my custom shaders (contour isolines, wireframe glow, point-cloud dissolve) didn't support skinned meshes. The character would T-pose through the animation like a haunted mannequin. The fix was rewriting the shader pipeline to inject the skinning chunks: the character now gets its own skinning-capable green treatment while the desk morphs through the full state machine.

**Lesson 3: "it doesn't support X" is where the actual engineering starts. Agents are great at the happy path; you own the edge cases.**

## Act 4: The gauntlet

Three iterations shipped "blind" before I learned my lesson: agents reporting "done" on work nobody had rendered. So I built a gauntlet. `node scripts/visual-gauntlet.mjs --cycle N` screenshots every page at 1600x1000 and 390x844 in headless Chrome, and a written rubric (`qa/VISUAL_RUBRIC.md`, 15 items scored 0 to 2, max 30 per shot) grades every pixel. Every change goes capture → score → fix → re-capture, keeping only what doesn't regress.

The harness itself needed calibrating before it could judge anything. Headless Chrome with `--disable-gpu` falls back to SwiftShader, and SwiftShader can't render this site: WebGL contexts failed outright (`BindToCurrentSequence failed`), shader derivatives came out mangled (my contour bands rendered as dense mesh), and DOM text layers vanished. The fix was `--use-angle=metal`, which sends shots through the real GPU path. Then a subtler race: compositor-driven CSS animations run on a different clock than `virtual-time-budget 10000`, so entrance animations (`heroRise`, the GSAP reveals) sometimes captured at opacity 0. `--force-prefers-reduced-motion` makes every shot a deterministic settled frame. The vortex intro, which only exists with motion on, gets verified through dedicated unforced shots instead.

Even then, the first runs lied. Astro's dev toolbar pill photobombed every screenshot until I disabled it in `astro.config.mjs`. An "overflow" flagged on the About page turned out to be a 490px harness artifact, not a site bug. A QA rig that cries wolf teaches you to ignore it, so false positives got fixed as aggressively as real defects.

The real numbers: cycle 1 averaged 29.4, cycle 2 averaged 29.75, cycle 3 averaged 29.83. The stubborn remainder was my own email address. It crossed the card border on desktop and clipped mid-string ("@gmai…") on mobile. First fix: `clamp(1.5rem,3vw,2.1rem)` down to `clamp(1.15rem,2.6vw,1.75rem)` plus `overflow-wrap: anywhere`. Cycle 2: contained, but wrapping an orphan "m" onto its own line. Second fix: the floor down to `1rem`. Cycle 3: one line, inside the card, 30 out of 30. One string, three cycles.

The only points still on the table are environmental. Repeated gauntlet runs burn through GitHub's unauthenticated API rate limit, the requests start coming back 403, and the HUD telemetry card degrades to placeholder dashes, exactly as designed. The rubric's console-error item catches it every cycle. Graceful degradation, verified by accident, twelve times per cycle.

**Lesson 4: "the build passes" is not "it looks right". Automate the looking, and calibrate the camera before you trust the photo.**

## Act 5: Linting the AI's prose

The gauntlet covers pixels. The words needed a gate too, because agents write prose the way they write CSS: fluent, confident, full of tells. `scripts/text-gate.mjs` scans 50 files (both blog collections, plus the about, ai, and agents pages in EN and PT) for the patterns that make text read as machine-generated. The banned list is a regex array called RULES, and I can't quote most of it here, because quoting it trips the gate (the linter has no concept of irony). The short version: em-dashes and en-dashes anywhere in prose or frontmatter, the single most recognizable AI tell; the cliché transitions every LLM reaches for; hype verbs that promise without saying what changes; announcing your own honesty; exclamation marks in technical prose. Any violation exits 1 with file:line. The error messages are in Portuguese, because I'm the one reading them.

This post passes the gate, and so does its PT twin. Writing about AI-generated work while an AI-tell linter watches your draft is a decent approximation of pair programming with a very literal colleague.

**Lesson 5: if a tell can be regexed, it can be gated. A style guide that lives in a doc gets ignored; a style guide that exits 1 gets obeyed.**

## Act 6: The site talks to agents directly

If agents are going to research me on behalf of recruiters, the site might as well speak their protocol. `src/pages/api/mcp.ts` is a Model Context Protocol endpoint hand-rolled on a Vercel function: JSON-RPC 2.0 over streamable HTTP, no SDK, no dependencies. It implements `initialize`, `ping`, `tools/list`, and `tools/call`, with proper error codes (-32700 for parse errors, -32601 for unknown methods). Four tools: `get_resume`, `get_services`, `check_availability`, and `book_intro`.

`book_intro` is the interesting one. It lets someone's AI assistant book a project intro on their behalf, relaying the brief to my email through a formsubmit POST. Every field is capped server-side (name 120 chars, contact 160, brief 4000) because an agent will happily paste an entire RFC into a form field. Any MCP client (Claude, ChatGPT, Cursor, Kimi) can add rubenmarcus.dev as a connector and interview the site directly.

There's a quieter easter egg in `src/middleware.ts`, 17 lines: if your user agent matches curl, wget, httpie, or libcurl and you hit a page route, the middleware rewrites you to `/api/resume.txt`. Browsers get the site. Terminals get the resume.

**Lesson 6: agents are users now. Give them an API instead of making them scrape your DOM.**

## Act 7: The player that died silently

The site has a bottom-right audio deck: a YouTube IFrame API player with a fixed playlist, terminal-styled, persisted across page transitions with Astro's `transition:persist`. Except persistence has a trap. Astro moves persisted elements into the new document on navigation, and moving an `<iframe>` in the DOM reloads it. The player died on every page change, and it died silently: no error, no console warning, the UI still said "playing", but the sound was gone.

The fix lives in `src/components/AudioPlayer.svelte`: listen for `astro:after-swap`, rebuild the player from scratch, and restore track, position, and playing state, so the music resumes mid-song like nothing happened. This bug never threw an exception, which means no test suite or console watcher would ever have caught it. Only listening would.

**Lesson 7: "persisted" is a promise the DOM doesn't keep. Assume everything reloads, and make the rebuild cheap.**

## Act 8: One hover standard everywhere

Every cover on the site (blog cards, project cards, the About portrait) obeys one rule: at rest it's an ordered-dither rendering tinted terminal green, and on hover the dither fades away to reveal the full-color image. The implementation is `DitherCover.svelte`: a Bayer 8x8 threshold matrix applied on a canvas, DPR capped at 2, rendered once, no animation loop.

My favorite part is the fallback. If a post has no cover, or the remote image can't be sampled because CORS taints the canvas, the component synthesizes a deterministic geometric pattern from a hash of the post title (mulberry32 over FNV, for the curious). Same title, same pattern, forever. No broken cards, no stock photos, no exceptions to the standard.

**Lesson 8: one weird detail, applied without exceptions, reads as a design system.**

## Act 9: The model paints, it never types

Every page and post gets a 1200x630 OG image, plus LinkedIn (1584x396) and X (1500x500) banners, all from `scripts/gen-og-images.mjs`. The backgrounds are AI-generated particle art, prompted hard against typography ("STRICTLY no text, no letters, no logos"). The titles are composited locally with sharp over SVG, in Menlo, terminal style.

The split is deliberate. Diffusion models are excellent at phosphor-green particle swarms and reliably terrible at spelling. An OG image with a typo in the title is worse than no OG image at all, so the model does the texture and deterministic code does the words. Titles come out typo-free every time, because they were never generated.

**Lesson 9: give the model the job it's good at. Take back the job it fails quietly.**

## The honest metrics fix

Early versions of my resume endpoint claimed "16,703 deployed agents". The number was real: it came from the Bitte Protocol AI runtime in production (2.85M+ messages, 24,164 users). But those were agents deployed by every user of the platform, not by me. True and misleading at the same time, which is worse than false, because it survives fact-checking.

The current claim is 26 agents I built: 13 production agents at Bitte, the command-center roles behind ECDSA.fail, and the gauntlet loop roles that iterate on my browser FPS. They're enumerated one by one in `src/lib/data/aiAgents.ts`, so the number is auditable. The 16,703 figure still exists, quoted with its platform-wide context, in `src/pages/api/mcp.ts`. When your pitch is "I orchestrate agents", precision about which agents you actually orchestrated is the whole game.

## What I actually do all day

People ask what "orchestrating agents" means in practice. This site is the honest answer: I write the brief, I define the architecture and the constraints, I reject work that's below the bar, and I own the 10% that agents can't do: taste, judgment calls, and the weird edge cases. The agents wrote most of the code, generated the models, and ran their own QA loops. The bar they had to meet was mine.

The result is this site: a terminal-green me, typing, dissolving into wireframe and ASCII as you scroll, graded by a gauntlet that won't let 0.17 points slip, linted by a gate that won't let one em-dash slip, and queryable by any agent that speaks MCP. Built in days, by a team of one human and a fleet.

If you're hiring someone to build AI-powered product end-to-end, or you just want to argue about shader pipelines, I'm around.

*P.S. The gauntlet rubric and the text gate are both in the repo. Steal them.*
