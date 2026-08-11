---
title: "My AI harness for frontend: from prompt to pull request"
description: "The system I use to turn an idea into verifiable frontend: specs, skills, model selection, Ralph Starter, worktrees, browsers, screenshots, tests, GitHub, and telemetry. The model writes code. The harness decides what to trust."
date: 2026-08-11
readTime: "11 min"
tags: ["ai", "agents", "frontend", "harness", "ralph-starter"]
cover: "/art/blog/frontend-ai-harness-prompt-to-pull-request.png"
---

My portfolio build was green. At 390px, the email address escaped its own card. After the first fix it fit, but a single "m" wrapped onto the next line. It took three screenshot cycles to get one string right.

That detail separates an agent that writes frontend from a system that delivers frontend. TypeScript did not know the contact page had failed at the most basic job of a contact page. The browser knew. The image knew. The harness had to look at all three.

I use Claude, Codex, Amp, Kimi, and GLM depending on availability and the kind of work. None of them is the harness. Models are workers inside a larger circuit that includes specs, skills, git, browsers, tests, critics, and stopping conditions.

This is the full circuit I use today, from request to pull request.

## First: what I mean by harness

A harness is the execution and measurement environment around an agent.

The prompt says what to do now. The harness decides which files the agent reads, which tools it may use, where it writes, what it must measure, how a failure returns, and which evidence allows the work to stop.

My flow fits in this map:

```text
idea, issue, or bug
→ research and spec
→ role, model, and skill selection
→ isolated worktree
→ implementation
→ test, lint, and build
→ browser, screenshots, and evals
→ adversarial critic
→ pull request
→ telemetry and new issues
```

Not every task crosses every stage. A copy change does not need a swarm. A new navigation experience needs the browser. A shader experiment needs screenshots and GPU measurements. The harness routes by risk, not excitement.

## 1. Input needs to be better than "make a screen"

The first artifact is a short spec. It describes behavior, constraints, and proof of completion.

For a frontend feature, I want at least:

- the affected route or surface;
- normal, loading, empty, error, and success states;
- relevant breakpoints;
- the source and shape of data;
- keyboard and focus interactions;
- a performance budget when it matters;
- validation commands;
- screenshots or visual references;
- what is explicitly out of scope.

A spec does not need to predict every Tailwind class. It needs to stop the agent from inventing the definition of done.

The clearest case came from Ralph Starter. An issue named "Improve performance" went through three loops without verifiable progress. On each round the agent chose a different optimization because nobody had specified a route, device, baseline, or target. The circuit breaker stopped the work correctly.

After that, "improve performance" stopped being a task. "Reduce LCP on `/catalog` mobile from 3.1s to under 2.5s in scenario X" is a task.

## 2. Skills carry method, the spec carries intent

I separate reusable knowledge from the current request.

The spec says: implement this catalog filter. A skill says: when working on this project's frontend, inspect existing components, preserve tokens, verify 390px and desktop, test the keyboard, capture screenshots, and run the gates.

Without that separation, every issue repeats an operating manual. Worse, two issues end up with different versions of the manual.

Useful skills in a frontend project include:

- the React, Next.js, or Svelte patterns used by the repo;
- the visual system and Tailwind conventions;
- accessibility and keyboard navigation;
- screenshot capture and comparison;
- content writing and translation;
- dependency policy;
- observability and product events;
- release and rollback.

On this portfolio, editorial voice was already a skill. The bilingual publishing flow and cover visual system are now versioned skills too. The next agent does not have to reconstruct those decisions from an old conversation.

## 3. I do not use a magic router between models

Model routing works better as a role table than as an abstract election for "best AI."

My table changes with the project and availability, but the criteria are stable:

| Role | What I look for |
|---|---|
| research scout | long context, search, good synthesis, and verifiable links |
| spec writer | decomposition, constraints, and edge cases |
| builder | reliable tool use and precise repository edits |
| visual critic | screenshot reading and concrete defect reports |
| regression hunter | patience to compare before and after without inventing findings |
| reviewer | diff, risk, and test coverage analysis |

Claude may own spec and build on one task. Codex may review and resolve issues in sequence. Kimi may research references. GLM may execute well-scoped work at volume. This is not a law about the models. It is an operational choice I can replace without redesigning the pipeline.

For expensive work, routing also considers context limits, rate limits, cost, and availability. The [ECDSA.fail harness I built](/blog/openrouter-routing) makes this explicit with role-to-model tables and fail-closed adapters. For a small frontend, a table in the instruction file is enough.

## 4. Ralph Starter runs the mechanical loop

[Ralph Starter](https://github.com/rubenmarcus/ralph-starter) is the part that turns a spec into a repeatable execution.

A minimal command is:

```bash
ralph-starter run "add an accessible search field to /catalog" --commit --pr
```

It can fetch the task from GitHub, Linear, Notion, a local file, or a URL. Then it:

1. creates a branch;
2. runs the selected agent;
3. runs test, lint, and build;
4. injects raw failure output into the next iteration;
5. repeats until passing or reaching a stopping condition;
6. commits, pushes, and opens the PR when authorized.

For multiple issues, every execution can use its own worktree:

```bash
ralph-starter auto \
  --source github \
  --project owner/repo \
  --label auto-ready \
  --parallel \
  --concurrency 3
```

Ralph does not replace the full harness. It is the implementation-loop executor. It does not decide whether a feature should exist, does not know by itself whether the layout looks right, and should not promote a change just because the build passed.

There is a practical reason to include it here. Many people try to begin agentic engineering with a swarm. A loop with one spec, one agent, and three gates already handles a large share of the work. Parallelism comes after individual execution is trustworthy.

## 5. Worktrees stop speed from becoming contamination

When two agents edit the same checkout, the result can look like collaboration. In practice, one changes the floor while the other measures it.

I use one git worktree per workstream. Every agent gets its own branch, directory, and diff. That lets me:

- attribute each result to one attempt;
- kill one route without undoing another;
- compare approaches side by side;
- run validations without another worker's uncommitted files;
- choose a winner before merge.

In Ralph Starter's swarm mode, the `race`, `consensus`, and `pipeline` strategies use that isolation differently. `race` accepts the first successful loop. `consensus` waits for all runs and compares valid executions. `pipeline` passes the same work through sequential stages.

I use `race` carefully for frontend. The first green build is not necessarily the best interface. When visual judgment matters, I prefer to finish the candidates, capture the same routes, and compare images against the same rubric.

## 6. Framework changes the gate, not the loop architecture

React, Next.js, Svelte, and Tailwind require different checks.

In React, I look for duplicated state, effects that should be derived, and components that render more than needed. In Next.js, I add server and client component boundaries, caching, serialization, dynamic routes, and the risk of shipping a secret to the client bundle. In Svelte, I check the reactivity model used by the project and whether the agent mixed conventions from different versions. In Tailwind, I look for duplicated class piles, magic values, and components that ignore existing tokens.

The build finds some of this. Tests find another part. The browser finds the rest.

That is why a frontend skill should begin by reading the repository. "Use Next.js best practices" can make an agent apply the right practice for a version, router, or architecture the project does not use. Generic instruction loses to local evidence.

## 7. The browser is a test tool

After three portfolio versions reached production without anyone rendering every page, I built a visual gauntlet.

The command captures each route at 1600x1000 and 390x844. A written rubric scores 15 criteria from 0 to 2, with a maximum of 30 per screenshot. The cycle is:

```text
build
→ open in a real browser
→ capture desktop and mobile
→ score against the rubric
→ fix
→ capture again
```

The rig itself needed repairs. Headless Chrome with software rendering broke WebGL and produced fake bugs. Compositor animations were captured at `opacity: 0`. The Astro toolbar appeared in the images. Before the gauntlet could judge the site, I had to calibrate the camera.

The cycles reached averages of 29.4, 29.75, and 29.83 out of 30. The last real defect was the email address. Green build, broken page. That is why a screenshot is not PR decoration. It is test output.

## 8. A critic needs permission to fail the work

Builder and reviewer should not share the same objective.

The builder wants to finish the feature. The critic wants to find the concrete reason it should not merge yet. I give the critic the diff, screenshots, spec, and validation logs. I do not give it the builder's conclusion as truth.

A useful report answers:

```text
DECISION:
WHY:
EVIDENCE:
MISSING:
NEXT COMMAND:
STOP RULE:
```

I also separate confirmed, inferred, and unverified claims. "The test passed" and "the test should pass" cannot occupy the same category.

On frontend, the critic looks for visual regression, lost focus, overflow, missing state, console errors, duplicate requests, layout shifts, and paths that only work with a mouse. If it finds nothing, it may say so. A critic forced to discover a bug starts manufacturing bugs.

## 9. GitHub is the queue, not the entire memory

Errors reported by CS Brasil players can already become GitHub issues automatically. The next step is agent-based classification, reproduction, and fix preparation. That automation only works if the issue carries enough evidence: route or map, version, message, stack, relevant state, and known reproduction steps.

GitHub organizes work and review. Operational memory stays in the repository: instructions, skills, specs, decisions, invariants, and eval results. A private model conversation is a poor place to store why a rule exists.

In the other direction, an agent can fetch a ready issue and send it to Ralph Starter. That closes a useful circuit:

```text
telemetry or error
→ structured issue
→ triage
→ approved spec
→ implementation loop
→ PR
→ deploy
→ new telemetry
```

I still keep human approval between triage and execution for changes that affect product, security, cost, or architecture. Automation should remove mechanical relay, not hide decisions.

## 10. Telemetry closes the loop a PR cannot

Tests tell me whether a change respects a known contract. Telemetry tells me what happened to real people.

For a game, I observe time per map, character, round duration, score, and abandonment. For a web product, the signals might be funnel events, errors by route, Core Web Vitals, usage by breakpoint, and network failures. The signals depend on the product. The rule is the same: a feature without post-deploy observation ends at merge, not learning.

Telemetry also creates better specs. If a route has concentrated mobile errors, the next issue begins with a scenario and measurement. The harness improves because the product returns real cases.

## The minimum version I would build today

For someone starting, I would not recommend five models or a swarm.

I would build this:

1. `AGENTS.md` with architecture, commands, and boundaries.
2. One repository-specific frontend skill.
3. Issues with observable acceptance criteria.
4. One reliable coding agent.
5. Ralph Starter or an equivalent loop.
6. Mandatory test, lint, and build.
7. Two screenshots per critical route: desktop and mobile.
8. A separate reviewer looking at the diff and images.
9. A stopping condition and iteration limit.

I would add parallel worktrees, model routing, mutation testing, automatic telemetry, and triage bots later, as the failure modes appeared.

The newest model may improve the first attempt. It does not repair a vague spec, a lying camera, or a ruler that rewards the wrong thing.

The lesson is operational: start with the feedback that can fail the agent. Then choose who writes the code.

If the terms still feel mixed together, first read [From prompt to product: five ways to build with AI](/blog/from-prompt-to-product-five-ways-to-build-with-ai).
