---
title: "Automating entire workflows with ralph-starter"
description: "ralph-starter runs Ralph Wiggum loops — fetch a spec, run the AI agent, check tests/lint/build, feed errors back, repeat. Here's how it works and why I built it."
date: 2026-02-19
readTime: "9 min"
tags: ["ai", "automation", "ralph-wiggum", "open-source"]
cover: "/art/blog/automating-entire-workflows-with-ralph-starter.png"
canonical: "https://dev.to/rubenmarcus/automating-entire-workflows-with-ralph-starter-43gc"
---

## What is ralph-starter

[ralph-starter](https://github.com/rubenmarcus/ralph-starter) is a CLI that runs AI coding agents in autonomous loops. You give it a task (or a GitHub issue, a Linear ticket, a Notion page), it runs the agent, then checks tests, lint, and build. If something fails it feeds the error back and loops again. When everything passes it commits, pushes, and opens a PR.

It works with the agents you already have installed: Claude Code, Cursor, Codex CLI, OpenCode, OpenClaw, and Amp, plus two SDK-based agents (Anthropic SDK and OpenCode SDK). It auto-detects what is on your machine with `--version` probes and uses the first one that answers.

It is open source, MIT licensed. I built it because I was tired of being the middleman between my terminal and my AI chat window.

## Why I built it

I was using AI coding assistants every day and the workflow was always the same: read a ticket, code, get stuck, paste context into the chat, adapt the suggestion, paste it back, run tests, paste the error, get a fix, paste that back. Lint complains. Another round trip. Then commit, push, open a PR.

That is like 12 steps, 5 to 8 times a day. The AI was doing the hard part (writing the code) and I was the relay moving text between windows. A human clipboard.

So I wrote a script that does the relay. It takes a spec, sends it to the agent, runs my test suite, and sends the error output back when something fails. That script grew into ralph-starter.

## Where it is most useful

ralph-starter works best when you have:

1. **A clear spec.** "Add /health endpoint that returns 200 with JSON body `{ status: 'ok' }`" finishes in 1 loop. "Make the app better" will still run, the agent will analyze your codebase and pick something to improve, but it might take 4 loops and the result might not be what you wanted.
2. **Tests.** The loop needs something to validate against. If you have no tests the agent does not know when it is done.
3. **Routine implementation work.** Endpoints, bug fixes, component updates, config changes. The stuff that fills up a sprint backlog.

Vague specs do not break it, they just cost more. "Refactor the auth system" will make the agent try a different approach each loop until the circuit breaker trips. "Add JWT middleware at src/middleware/auth.ts using bcrypt, httpOnly cookies, add tests for login success and failure" finishes in 2 loops because the agent knows exactly what done looks like. I do the thinking and the spec writing. ralph-starter handles the translation from spec to code.

## Getting started

You can start from an idea and ralph-starter will generate the spec for you, or point it at an existing GitHub issue or Linear ticket and it fetches the spec automatically:

<img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fead0j2uzung6rfeybl55.png" alt="Getting Started" />

```bash
# Install and initialize
npx ralph-starter init
```

`ralph-starter init` sets up the Ralph Playbook files: `AGENTS.md` (agent instructions and validation commands), `PROMPT_plan.md`, `PROMPT_build.md`, `IMPLEMENTATION_PLAN.md`, and a `specs/` folder. If those files already exist, the wizard detects them and offers to continue the build loop instead:

<img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F8k3mcx3537el9afyendf.png" alt="ralph-starter terminal" />

Run your first task with an inline spec:

```bash
ralph-starter run "add a /ping endpoint that returns pong" --commit
```

Or point it at a GitHub issue or a filtered set of Linear tickets. Note that `--issue` is GitHub-only; for Linear you filter by project and label:

```bash
# From GitHub
ralph-starter run --from github --project rubenmarcus/ralph-starter --issue 2

# From Linear
ralph-starter run --from linear --project "Mobile App" --label "sprint-1" --commit --pr
```

<img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fx4a0e5xnan1d1b17ky3n.png" alt="ralph-starter terminal" />

To connect GitHub, Linear, Notion, or Figma as spec sources, use the config commands. Credentials live in `~/.ralph-starter/sources.json`; environment variables (`GITHUB_TOKEN`, `LINEAR_API_KEY`, `NOTION_API_KEY`, `FIGMA_TOKEN`) take precedence:

```bash
ralph-starter config set github.token ghp_xxx
ralph-starter config set linear.apiKey lin_api_xxx
ralph-starter config set notion.token secret_xxx
```

`ralph-starter setup` configures agent preferences, and `ralph-starter integrations test github` verifies connectivity before you burn tokens on a run.

## How the loop works

The loop executor (`runLoop` in `src/loop/executor.ts`) follows this sequence:

```
1. Fetch spec (GitHub issue, Linear ticket, Notion page, inline text, file, URL)
2. Create branch (auto/github-145)
3. Run agent with the spec as prompt
4. Run validations: test → lint → build
5. If any validation fails → feed error output back to agent → go to step 3
6. If all pass → commit, push, open PR
```

There is no config file for validation commands. ralph-starter detects them. It parses your `AGENTS.md` for backticked commands after test/lint/build bullets, and falls back to `package.json` scripts:

```md
<!-- AGENTS.md -->
- **Test**: `pnpm test`
- **Lint**: `pnpm lint`
- **Build**: `pnpm build`
```

When a validation fails, the raw stderr/stdout becomes `lastValidationFeedback` and gets injected into the next iteration's prompt by the context builder, along with the spec summary, the current plan task, and the last few entries of the iteration log. The agent sees `TypeError: Cannot read property 'id' of undefined at src/routes/user.ts:42` and knows exactly what to fix. It does not get a summary of the failure. It gets the failure.

One nuance most people miss: in batch auto mode the loop skips test commands and runs only build and lint. That is deliberate, so a pre-existing failing test does not trap every task in a fix loop for a bug it did not introduce.

The loop has seven exit reasons: `completed`, `file_signal` (a `RALPH_COMPLETE` or `.ralph-done` marker, or every box checked in `IMPLEMENTATION_PLAN.md`), `circuit_breaker`, `rate_limit`, `cost_ceiling`, `blocked`, and `max_iterations`. You always know why a run ended.

## Real example: building a landing page from a GitHub issue

Here is a real run. I pointed ralph-starter at a GitHub issue asking for a landing page for a London pet shop. The spec had 8 tasks (header, hero, services, gallery, testimonials, contact form, footer, polish).

<img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fq3dicjcio7ym0qfrvh78.png" alt="ralph-starter terminal" />

ralph-starter detected 28 installed skills (frontend-design, tailwind, responsive-web-design, etc.) and injected the relevant ones into the prompt, capped at 5 active per iteration so the prompt does not drown in instructions:

<img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fbwp2f2guebyrsywzazc0.png" alt="ralph-starter terminal" />

The loop ran for 2 iterations. First iteration completed 5 out of 8 tasks, second picked up the rest (Testimonials, Contact Form, Footer, Polish). Stall detection watches for iterations with no file changes, no task progress, and no validation activity, and stops after 3 of those in a row (4 for plans with more than 5 tasks).

Final result:

```
Cost Summary:
  Tokens: 47.0K (764 in / 46.2K out)
  Cost: $0.606 ($0.348/iteration avg)

Loop completed!
  Exit reason: completed
  Iterations: 2
  Total duration: 8m 19s
  Total cost: $0.696 (47.0K tokens)
```

8 minutes. 69 cents. A full landing page with React components, Tailwind styling, and responsive layout. I did not open the editor at all.

## Token costs and how to keep them low

Here are my real numbers. I tracked my entire January. 187 tasks completed. $22.41 total. Average of **$0.12 per task**.

The reason it is cheap is prompt caching. With Claude Code, the first loop sends the full context at $3.00 per million input tokens. Loops 2, 3, 4 reuse the cached tokens at $0.30 per million. That is 90% less.

Before each run, ralph-starter shows you an estimate so you know what to expect:

<img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fij14c51g2co4dp4g13c4.png" alt="ralph-starter terminal" />

After each run it shows the actual breakdown: tokens in, tokens out, cost per iteration. For a hard stop, `--max-cost 2` kills the loop at $2 and `--rate-limit 50` caps API calls per hour. Most tasks finish in 2 to 3 loops, and after the first one most of the input is cached. Detailed breakdown with exact numbers [here](https://ralphstarter.ai/blog/prompt-caching-saved-me-47-dollars).

What keeps costs down: good specs (fewer loops), prompt caching (90% off input tokens after loop 1), the circuit breaker (no money burned on unsolvable tasks), and skills (the agent gets things right in fewer iterations).

## Batch mode: 10 issues, 8 PRs

During sprint grooming I label the well defined tickets as "auto-ready". Then I run a single command and go get lunch:

<img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fjtrqvmw3aeklyovjvrzy.png" alt="ralph-starter terminal" />

ralph-starter picks up all matching issues and starts the loop on each:

```bash
# From GitHub
ralph-starter auto --source github --project multivmlabs/ralph-starter --label "auto-ready" --limit 10

# From Linear
ralph-starter auto --source linear --project ENG --label "auto-ready" --limit 10

# Preview without executing, or run tasks in parallel worktrees
ralph-starter auto --source github --project multivmlabs/ralph-starter --dry-run
ralph-starter auto --source github --project multivmlabs/ralph-starter --parallel --concurrency 3
```

Each issue gets its own branch, its own loop, its own PR. Branches follow one convention, `auto/<source>-<id>`:

```
[1/10] Issue #145: Add health check endpoint
  > Branch: auto/github-145
  > 2 loops > Validation: passed
  > PR #151 created

[2/10] Issue #147: Add rate limit headers
  > Branch: auto/github-147
  > 1 loop > Validation: passed
  > PR #152 created

[3/10] Issue #150: Improve performance
  > 3 loops > Circuit breaker tripped. Skipping.

...

Completed: 8/10 | Failed: 2/10
Total cost: $1.84
```

8 out of 10. The 2 failures were vague tickets. "Improve performance" had no metrics or targets, so the agent tried different optimizations each loop with nothing to validate against, and the circuit breaker tripped after 3 loops. The other was a refactoring ticket that referenced a team meeting discussion the agent never saw.

The circuit breaker trips after 3 consecutive failures or 5 repeats of the same error. "Same error" is not a string compare: the message is normalized (line numbers, timestamps, hex addresses, stack frames stripped) and hashed, so `foo.ts:12:4` and `foo.ts:87:21` count as one failure. After a trip there is a 30-second cooldown with one retry allowed, then the loop stops. Tune both with `--circuit-breaker-failures` and `--circuit-breaker-errors`.

## Swarm mode: same task, three agents

One loop is one bet. Swarm mode places several:

```bash
ralph-starter run "rewrite the date parser" --swarm --strategy race
ralph-starter run "rewrite the date parser" --swarm --strategy consensus
ralph-starter run "migrate to ESM" --swarm --strategy pipeline
```

Every agent runs the full loop in its own git worktree under `.ralph/worktrees/`, so nobody clobbers anyone. In `race`, the first successful loop wins. In `consensus`, every agent finishes and the winner is the successful run with the fewest iterations. In `pipeline`, agents run sequentially in one shared worktree, work gets committed between stages, and the last agent reviews and polishes. The winning branch becomes a PR with a per-agent cost and iteration table in the body. I wrote a full internals post about [how the swarm works](/blog/dag-agent-orchestration).

## Picking an agent

You can be explicit about which agent to use:

```bash
ralph-starter run "your task" --agent claude-code
ralph-starter run "your task" --agent codex
ralph-starter run "your task" --agent cursor
```

I use Claude Code daily because prompt caching makes the loops cheaper and stream-json output lets ralph-starter track progress in real time. But the loop executor and validation pipeline are identical for all agents. I ran the same JWT auth task on [4 different agents](https://ralphstarter.ai/blog/five-ai-coding-agents) and they all got there, just with different loop counts and costs.

## Why I keep building it

I did a [side-by-side comparison](https://ralphstarter.ai/blog/ralph-starter-vs-manual) of 12 tasks from the same sprint. 6 manual, 6 with ralph-starter. The ralph-starter tasks averaged 12 minutes of my attention vs 45 minutes coding manually. Code quality was comparable.

Now I spend my time on three things: writing clear specs (the input), reviewing PRs (the output), and architecture decisions (the part the AI cannot do). ralph-starter handles everything in between. Every PR it produces passes tests, lint, and build. When I code manually I sometimes skip tests for small changes. The loop does not let the agent skip anything, and honestly that discipline is better than mine.

## About the name

The name comes from the [Ralph Wiggum technique](https://ghuntley.com/ralph/). You give the AI a task and let it keep going until done. No micro-managing. [Full explanation here](https://ralphstarter.ai/blog/ralph-wiggum-technique).

## Links

ralph-starter is open source, MIT licensed.

- [GitHub](https://github.com/rubenmarcus/ralph-starter)
- [Docs](https://ralphstarter.ai)
- [npm](https://www.npmjs.com/package/ralph-starter)

Related posts:

- [The Ralph Wiggum technique](https://ralphstarter.ai/blog/ralph-wiggum-technique)
- [Specs are the new code](https://ralphstarter.ai/blog/specs-are-the-new-code)
- [I tried 5 AI coding agents on the same task](https://ralphstarter.ai/blog/five-ai-coding-agents)
- [Prompt caching saved me $47](https://ralphstarter.ai/blog/prompt-caching-saved-me-47-dollars)
- [ralph-starter vs doing it manually](https://ralphstarter.ai/blog/ralph-starter-vs-manual)
- [Figma to code in one command](https://ralphstarter.ai/blog/figma-to-code-one-command)
- [ralph-starter with Linear](https://ralphstarter.ai/blog/ralph-starter-with-linear)

If you try it, open an issue or drop a star. All feedback is welcome.
