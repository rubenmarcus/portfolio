---
title: "Keeping an autonomous research agent honest"
description: "Autoresearcher runs benchmark-driven research loops: one agent step, one benchmark command, one number, keep or reject. The part that makes it work isn't the agent. It's that the loop is deliberately simple, fail-closed, and leaves a full audit trail in git and JSONL."
date: 2026-07-08
readTime: "13 min"
cover: "/art/blog/autoresearcher-pareto-frontier.png"
tags: ["ai", "agents", "evaluation", "benchmarks", "open-source"]
---

[Autoresearcher](https://autoresearcher.org) is an open-source CLI I built for one job: point a coding agent at a benchmark and let it grind. Propose, implement, measure, keep or kill, for as long as the loop stays honest. It's the harness behind two results I'm proud of: **#1 on the QEC Decoder Optimization Arena** (a quantum error-correction decoder at 2,642 errors per million) and **#1 on ECDSA.fail** (the cheapest secp256k1 point-addition circuit, which [I wrote about separately](/blog/the-agent-swarm-that-took-1-on-ecdsa-fail)).

Neither result came from a smarter model. They came from a loop designed to distrust its own output. This post is about that design, and it starts with a confession: people assume there is a clever selection algorithm inside Autoresearcher. There isn't. The selection logic is six lines long. That is the point.

## The loop, concretely

The whole CLI is three commands: `autoresearcher init`, `autoresearcher wizard`, and `autoresearcher run --iterations 20`. Config lives in `.autoresearcher/config.json`. One iteration of `run` does this, in `src/run-loop.js`:

1. Record the current git commit.
2. Run one agent step.
3. Run your benchmark command.
4. Parse one number out of the output with your regex.
5. Keep the iteration only if the number improved.

The keep/reject decision, trimmed but real:

```js
// src/run-loop.js
const benchmarkResult = await runCommand(merged.benchmarkCommand, { cwd });
const benchmarkOutput = `${benchmarkResult.stdout}\n${benchmarkResult.stderr}`;
const metric = parseMetric(benchmarkOutput, merged.metricRegex);

if (benchmarkResult.code !== 0 || metric == null) {
  // status: benchmark_failed. The feedback tells the agent to fix
  // the harness before optimizing anything else.
  continue;
}

const improved = isBetter(metric, bestMetric, direction);

if (improved) {
  bestMetric = metric;
  bestIteration = i;
  console.log('Result: improved -> keep');
  if (merged.autoCommit === true && (await hasGitChanges(cwd))) {
    await runCommand('git add -A', { cwd });
    await runCommand(`git commit -m "${commitMessage}"`, { cwd });
  }
  if (merged.onKeepCommand) {
    await runCommand(merged.onKeepCommand, { cwd, stream: true });
  }
} else {
  console.log('Result: not improved -> reject');
  if (merged.onRejectCommand) {
    await runCommand(merged.onRejectCommand, { cwd, stream: true });
  }
}
```

And here is the entire selection algorithm, verbatim:

```js
// src/run-loop.js
function parseMetric(output, metricRegex) {
  const regex = new RegExp(metricRegex, 'm');
  const match = output.match(regex);
  if (!match || !match[1]) return null;
  const metric = Number(match[1]);
  return Number.isFinite(metric) ? metric : null;
}

function isBetter(metric, best, direction) {
  if (best == null) return true;
  return direction === 'min' ? metric < best : metric > best;
}
```

That is not a simplification for the blog post. That is the shipped code. Strict comparison against the best metric seen so far, direction `min` or `max`, binary outcome. No scores blended, no rankings, no maybe pile.

## The benchmark is the oracle

The design line runs through the config: Autoresearcher never interprets your domain. It runs a shell command you wrote and believes one capture group:

```json
{
  "agentMode": "internal",
  "agentPromptFile": "program.md",
  "benchmarkCommand": "./scripts/benchmark.sh",
  "metricRegex": "score=([0-9.]+)",
  "direction": "min",
  "iterations": 40,
  "autoCommit": true,
  "onRejectCommand": "git checkout -- .",
  "commitMessageTemplate": "research: improved metric to {metric} (iter {iteration})"
}
```

Everything that makes a measurement trustworthy lives on your side of that contract. Held-out seeds, runtime limits, file size limits, statistical significance, sandboxing. All of it belongs in `benchmark.sh`, where it is versioned, reviewable, and runs identically for every iteration. The QEC arena has a 2.5-second runtime limit and its own scoring rules. The loop does not need to know that. The benchmark script enforces it, prints one number, and a disqualified candidate simply produces a worse number or no number at all.

This is the part people get backwards when they build research tooling. They put the evaluation logic in the orchestrator, where it rots into a pile of flags. Autoresearcher goes the other way: the orchestrator is dumb and small, the benchmark is sovereign. When the metric lies, you fix one script, not a framework.

## Fail closed, then tell the agent why

Two failure behaviors matter more than the happy path.

**Agent failure stops the run.** With `stopOnAgentFailure: true` (the default), a non-zero exit from the agent step ends the loop instead of benchmarking a half-mutated tree and calling the result data. A number produced by a broken iteration is worse than no number, because it enters the log looking like evidence.

**Benchmark failure is a first-class outcome.** If the benchmark exits non-zero or the regex finds nothing, the iteration is logged as `benchmark_failed`, and the loop composes feedback for the next agent step. The feedback mechanism is real and simple: the result of iteration N is prepended to the prompt of iteration N+1.

```js
// src/run-loop.js
const iterationAgentPrompt = benchmarkFeedback
  ? `${resolvedPrompt.prompt}\n\n## Benchmark Feedback From Previous Iteration\n${benchmarkFeedback}`
  : resolvedPrompt.prompt;
```

The feedback text is blunt. On failure: "Before optimizing further, make sure benchmark execution and metric extraction are stable." On a reject: "Try a different approach and avoid repeating the same change pattern." On a keep: "Continue in the same direction with another focused optimization." The agent always knows what the last attempt scored and which direction is better. Nothing else carries over.

## Git is the memory

There is no database of candidates. The audit trail is git plus append-only logs.

Every iteration records `beforeCommit` and `afterCommit` (from `git rev-parse --short HEAD`) into a JSONL run log at `.autoresearcher/runs/<run_id>.jsonl`. With `autoCommit: true`, every keep becomes a commit with the metric in the message, so `git log` is the research lineage. Rejects are your call: wire `onRejectCommand` to `git checkout -- .` and the tree resets to the last kept state, or leave it empty and let changes accumulate if you prefer the agent to build on its own debris.

One honest consequence: the agent works in your working tree, not in a sandbox it manages for you. Isolation is your responsibility, the same way evaluation is. Run it in a dedicated clone. The tool's job is to make every state transition explicit and replayable, not to hide the machinery.

When the run ends, you get three artifacts: the JSONL log, a final report (`final-report-<run_id>.md`) with keep and reject counts, metric delta from baseline, and whether the trend was monotonic, and a synthesized `RESEARCH.md` that ends in a machine-readable decision like `improved_with_stable_execution` or `no_material_improvement`. The report does not editorialize. It counts.

## The agent step is one headless shot

In the default `internal` mode, each iteration shells out to a headless coding agent through [ralph-starter](https://www.npmjs.com/package/ralph-starter): one prompt, one shot, `backendMaxIterations: 1`. The wizard lets you pick the backend (amp, claude-code, codex, cursor, opencode, openclaw) and pin a model, and the objective comes from `program.md`, a plain markdown file you edit like a spec. If you'd rather drive your own tooling, `agentMode: "command"` swaps the internal backend for any `agentCommand` shell script. The loop does not care what produced the diff. It only cares what the benchmark said about it.

That indifference is a feature. Models are interchangeable and improving monthly. In the time Autoresearcher existed, I have swapped backends without touching the loop, because the loop's only interface to intelligence is a prompt in and a working tree out.

## What the loop earns you

The numbers from the QEC run: roughly 40 submissions went through the loop, and about 80% of iterations were null results. That ratio is not a failure of the agent. It is the expected shape of research, and it is exactly why the loop is built the way it is. When four out of five attempts go nowhere, the cost structure that matters is: each null must be cheap, final, and informative. Cheap, because a reject is one benchmark run and a git revert. Final, because `isBetter` has no maybe branch. Informative, because the rejection reason goes back into the next prompt and the null is in the JSONL log forever.

The 2,642 errors-per-million result that took #1 survived the strictest version of this arrangement: the benchmark decided, the loop kept only strict improvements, and every kept step is a commit you can check out and re-measure today.

## What I'd tell anyone building this

1. **The evaluation is the product, and it lives in the benchmark.** Write the harshest benchmark you can, with held-out data and hard constraints, then let the loop be six lines. Cleverness in the orchestrator is where subtle bugs and Goodhart gradients breed.
2. **Reject loudly, reject cheaply.** Binary keep/reject, logged, per iteration. A loop that tolerates marginal candidates drowns in its own maybes.
3. **Fail closed on both sides.** A crashed agent and a crashed benchmark are both non-events, not data points. The run stops or the iteration is marked failed, but nothing silently becomes a keep.
4. **Make the trail replayable.** If you cannot check out the commit behind any kept metric and reproduce the number, your research log is fiction. Git plus JSONL is boring infrastructure. Boring is the compliment.

Autoresearcher is open source at [autoresearcher.org](https://autoresearcher.org). The agents will keep getting smarter on their own. The interesting engineering is in everything around them that keeps them honest, and most of that engineering is deciding what not to build.

*If you're building evaluation infrastructure or agent orchestration and want to compare scars, my inbox is open.*
