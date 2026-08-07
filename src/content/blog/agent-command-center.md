---
title: "A command center for agent swarms, in markdown"
description: "I run a swarm of coding agents — Codex, Claude, Amp, Kimi — plus humans, coordinated entirely through markdown files. No database, no dashboard-as-source-of-truth, chat history explicitly banned. Here is the shared brain: control room, task queue, candidate cemetery, and fail-closed automation."
date: 2026-08-02
readTime: "10 min"
tags: ["ai", "agents", "orchestration", "tooling"]
cover: "/art/blog/agent-command-center.png"
---

For a while now I have been running a competitive optimization challenge (the kind where you throw compute and ingenuity at a hard target and the leaderboard keeps score) using a swarm of coding agents. Codex, Claude, Amp, Kimi, plus the occasional human who wandered in. The agents come and go, hit rate limits, lose their context windows, and forget everything between sessions.

So the coordination layer cannot live in any of them. It lives in files. Markdown is the database, and chat history is explicitly, deliberately *not* the source of truth. If an agent discovers something and does not write it down, it did not happen. This post is the anatomy of that shared brain.

## Why not a database

Because agents already read and write markdown natively, git diffs are the audit log for free, and I can inspect the entire system state with `cat`. Every fancier option (a SQLite store, a task API, a web dashboard) adds a layer the agents have to be taught to use and I have to maintain. A directory of markdown files has zero onboarding cost: point any agent at it and it already knows the interface.

## control-room/: the shared brain

The `control-room/` directory is the state of the whole operation:

- **CURRENT_CONTEXT.md**: what is happening right now, rewritten whenever it changes. Any agent or human reads this first and is oriented in thirty seconds.
- **ROUTES.md**: the queue of active attack routes, each with a verdict. This is the work board.
- **LEDGER.md**: append-only. Every run, every result, every cost, one line each, never edited. The ledger is the memory that survives every context wipe.
- **CONTROL.md**: the submit gate. Nothing goes out without passing through it.
- **A compact learning digest**: auto-generated from the ledger, so a fresh agent does not spend paid tokens rediscovering dead routes the hard way. This one file pays for itself daily: without it, every new session is a goldfish with a credit card.

## swarm/: the task queue

The `swarm/` directory is the machinery: task JSONs sit in `queue/`, prompt snapshots in `outbox/`, and results land in `results/`. A Python dispatcher with a CLI adapter per agent (each of these tools has a different personality and a different flag syntax; the adapters absorb that) pops tasks and runs them. A launchd scheduler queues exactly one bounded task per 30-minute cycle.

One task per cycle is a deliberate governor, not a limitation. It caps the blast radius of any confused agent, spreads cost predictably, and gives me a natural checkpoint to read results. An unbounded queue with autonomous agents is just a very efficient way to convert money into regressions.

Every task is bounded before it starts: a falsifier (what result would prove this route wrong), a validator command, a max cost, a wall-clock limit, and a kill condition. If a task cannot state its falsifier, it is not a task, it is a vibe, and vibes do not get queued.

## agents/: role prompts

Agents get role prompts the way employees get job descriptions. There is a **dissector** (tear apart the problem and existing attempts), an **engineer** (implement the route), an **analyst** (read results and extract lessons), a **scout** (explore untested levers), and an **orchestrator** (decide what gets queued next). Same underlying models, different jobs. A generalist prompt produces generalist wandering; a role prompt produces a deliverable.

## skills/: the output format police

One skills file enforces a rigid output format on every agent report:

```
DECISION:
WHY:
EVIDENCE:
MISSING:
NEXT COMMAND:
STOP RULE:
```

Evidence must be labeled CONFIRMED, INFERRED, or UNKNOWN. This is the single highest-leverage file in the whole system. Before it, agent reports were confident prose where "the test passed" and "I assume the test would pass" looked identical. After it, an agent has to commit, in writing, to what it actually observed. Hallucinations do not disappear, but they get a lot harder to launder into CONFIRMED.

## intelligence/: the map of the maze

The `intelligence/` directory holds the branch library and the lever taxonomy, every known way to attack the problem, each in one of three states: `untested`, `pending`, or `killed`. Killed is a first-class state, and that is the point: a dead route written down is worth more than a live one, because the most expensive outcome in a multi-agent system is three different agents rediscovering the same dead end across three different sessions.

Which brings me to my favorite directory: the **candidate cemetery**. Every dead candidate gets a headstone: what it was, the verdict that killed it, and the exact conditions under which it may be reopened. The cemetery is what stops the swarm from re-litigating settled history. It is a graveyard as an optimization.

## Worktrees and fail-closed automation

Execution hygiene: one git worktree per route, so routes never contaminate each other and every result is attributable to a diff.

And the automation is fail-closed. Automation may *prepare* (queue tasks, draft prompts, aggregate results) but it may never improvise spend. There are hard stops wired in: a `GPU_APPROVAL_NEEDED` gate for anything that costs real compute, and a plain `STOP` file that halts the scheduler dead. The STOP file is deliberately stupid: no conditionals, no parsing, if it exists nothing runs. When the thing supervising your agents is also software, the emergency brake should be the dumbest possible object in the repo.

## The dashboard observes, it does not decide

There is an internal observability dashboard: a context-pressure proxy (how close each agent is to the top of its window), prompt history, and a findings log of death-loops and hallucinations the system has caught. But the dashboard is a read-only view over the markdown. The files are the truth; the dashboard is the instrument panel. The moment a dashboard becomes the source of truth, you are debugging your dashboard.

## What I actually learned

Multi-agent systems do not fail because the agents are dumb. They fail because the coordination is vibes. Agents forget, hallucinate, duplicate work, and confidently report things they did not check, and every one of those failure modes is survivable if the state of the world lives in boring, inspectable, append-only files that no single agent owns.

The whole command center is a directory of markdown, a Python dispatcher, a scheduler, and a graveyard. It has survived every model swap I have thrown at it, because it does not depend on any model. Markdown outlives context windows. That is the entire trick.
