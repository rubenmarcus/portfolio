---
title: "Git worktrees are my agent orchestrator"
description: "ralph-starter runs coding agents in Ralph Wiggum loops, and swarm mode coordinates them with git worktrees, Promise.allSettled, and a strategy switch. Three strategies with real tradeoffs, and why a DAG executor would reject this design at startup."
date: 2026-06-25
readTime: "9 min"
cover: "/art/blog/dag-agent-orchestration.png"
tags: ["ai", "agents", "orchestration", "typescript"]
---

Earlier this year I pointed [ralph-starter](https://github.com/rubenmarcus/ralph-starter) at 10 labeled GitHub issues and got back 8 pull requests for $1.84. A side-by-side on 12 sprint tasks put my attention cost at 12 minutes per task, against 45 minutes coding by hand. The part that surprises people: no orchestration framework was involved. The coordination layer was git, the isolation layer was `git worktree add`, and the whole swarm fit in one 480-line file.

ralph-starter is my open-source npm CLI. It implements the Ralph Wiggum loop: fetch a spec, run a coding agent against it, run tests/lint/build, feed the raw errors back into the next prompt, repeat until green, then commit, push, and open the PR. Specs come from GitHub issues, Linear tickets, Notion pages, Figma, a URL, or a file. The agents are the ones you already have installed: Claude Code, Codex, Cursor, Amp, OpenCode. I build React apps for a living. I wrote this because I was tired of being the human clipboard between my terminal and my chat window.

This post is the internals: how swarm mode coordinates multiple agents, and why the coordination primitive is a 20-year-old git feature.

## The loop is the unit, not the node

Graph orchestrators model work as typed nodes with dependency edges: planner feeds coder, coder feeds reviewer. That model breaks on coding loops for a structural reason. Inside a loop, the dependencies are cyclic. The reviewer of iteration 3's code is iteration 4 of the same agent reading the test output. Draw that as a graph and you get a cycle, and any DAG executor with cycle detection rejects your design at startup.

So the unit of orchestration here is the whole loop. `runLoop`, about 1,800 lines in `src/loop/executor.ts`, is the only executor in the codebase. Swarm mode never orchestrates steps. It runs complete loops, one per agent, and coordinates the results. Every strategy in `src/loop/swarm.ts` is a different answer to two questions: how many worktrees, and how you pick the winner.

## Isolation is `git worktree add`

Agents that share a filesystem produce results you cannot attribute to anyone. Every parallel agent gets its own worktree under `.ralph/worktrees/` inside the repo:

```ts
// src/automation/worktree.ts
export async function createWorktree(
  repoDir: string,
  branchName: string,
  baseBranch?: string
): Promise<string> {
  const worktreeDir = join(repoDir, '.ralph', 'worktrees', branchName);
  await execa('git', ['worktree', 'add', '-b', branchName, worktreeDir, baseBranch], {
    cwd: repoDir,
  });
  return worktreeDir;
}
```

One agent, one branch, one diff. Every run starts with `cleanupAllWorktrees`, which recovers from crashes that left stale worktrees behind. When the swarm finishes, every losing worktree is deleted. The winner's worktree survives only if a PR was opened from it, because that branch is what the PR points at. The PR body is a generated markdown table listing every agent, its status, its iteration count, and its cost. The receipt is part of the feature.

This is why I call git the orchestrator. Branches give isolation. Commits give state. The diff gives the audit trail. Most agent frameworks rebuild all three, badly, on top of a database.

## Race: first success wins, losers keep running

Race fans the same task out to every detected agent, each in its own worktree, and waits with `Promise.allSettled`. The winner is the first loop that resolves with a success.

Two tradeoffs, stated plainly. The winner is the first successful result, not the best one. And the losers are deliberately not cancelled. Cancelling a coding agent mid-write leaves a corrupt worktree and a half-spent rate limit window, so `allSettled` waits for everyone and a race costs the sum of all agents, not the fastest. I chose predictable cost over optimal cost. What race buys is selection across models on the same task, not wall-clock speed.

## Consensus: fewest iterations wins

Consensus runs every agent to completion in its own worktree, then picks the successful result with the fewest loop iterations. There is no LLM judge.

The reasoning: iterations are the one signal I already trust. Each iteration means the agent failed validation, got the raw errors fed back, and tried again. Fewer iterations means the validation gauntlet passed sooner, with less thrash. It is a proxy metric and I know its failure mode: a sloppy agent that stops early and a genuinely good agent both finish fast. But an LLM judge adds cost plus one more component that can fail, and so far the proxy has not picked badly enough to pay for one.

## Pipeline: git is the state machine

Pipeline is the sequential strategy. Agents run one after another in a single shared worktree, and the handoff between stages is a git commit plus a rewritten prompt. Before each stage starts, the previous stage's uncommitted work gets committed as `chore: pipeline stage N`, so every stage begins from a clean tree. The first agent is told it is the FIRST agent in a pipeline and should implement the task. Middle agents are told to continue the previous agent's implementation. The last one reviews and polishes. The iteration budget is split evenly: 3 agents with a budget of 15 get 5 each.

There are no typed inputs and outputs between stages. The commit message plus the diff has been enough context so far. Pipeline is the one strategy where a real DAG would earn its keep, because stages have genuine data dependencies. The day the diff stops being enough context is the day I write one.

## The machinery that keeps loops cheap

The strategies stay thin because the loop underneath is thick. The piece worth stealing is the circuit breaker. Defaults: 3 consecutive failures, or 5 repeats of the same error, trips it and stops the spend. "Same error" survives log noise because the message is normalized before hashing:

```ts
// src/loop/circuit-breaker.ts
private hashError(error: string): string {
  const normalized = error
    .replace(/0x[a-fA-F0-9]+/g, 'HEX') // hex addresses
    .replace(/at\s+\S+\s+\(\S+:\d+:\d+\)/g, 'STACK') // stack frames
    .replace(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/g, 'TIMESTAMP') // before :line:col
    .replace(/:\d+:\d+/g, ':N:N') // file:line:col
    .toLowerCase()
    .trim()
    .slice(0, 500);
  return crypto.createHash('md5').update(normalized).digest('hex').slice(0, 8);
}
```

The order matters: timestamps get normalized before `file:line:col`, otherwise the `14:07:39` inside a timestamp matches the wrong rule and gets mangled first. After a trip there is a 30-second cooldown that allows exactly one retry before the loop gives up for good.

Around the breaker sit a rate limiter, which backs off instead of burning the provider window, and a cost ceiling, which kills the loop at a dollar figure you set. The full list of exit reasons reads like a postmortem vocabulary: `completed`, `file_signal`, `circuit_breaker`, `rate_limit`, `cost_ceiling`, `blocked`, `max_iterations`.

One more detail I would not skip. Failure does not travel back through a graph edge. It travels through a string. The raw test, lint, and build output goes into the next prompt as-is. The agent does not get a summary of the failure. It gets the failure.

## What to take from this

If you are orchestrating coding agents, check what git already gives you before installing a framework: isolation (worktrees), state (commits), an audit trail (diffs), and crash recovery (reflog). Add the graph when a stage genuinely needs typed outputs from another stage, and not before. A `for` loop and `git worktree add` have been outshipping my graph designs for a year, and I can still read my whole orchestrator in one sitting.

*ralph-starter is open source, MIT licensed. If you think the consensus winner heuristic is too naive, you are probably right, and the issue tracker is open.*
