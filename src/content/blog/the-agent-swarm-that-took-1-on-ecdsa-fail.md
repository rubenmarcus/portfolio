---
title: "The swarm that took #1 on ECDSA.fail"
description: "How I built an autonomous multi-agent research harness — 9 specialist LLM roles across 7+ providers, fail-closed adapters, lane-isolated dispatch, and a falsifier queue — that produced the top-ranked quantum circuit on ECDSA.fail."
date: 2026-06-18
readTime: "12 min"
cover: "/art/blog/the-agent-swarm-that-took-1-on-ecdsa-fail.png"
tags: ["ai", "agents", "orchestration", "benchmarks", "quantum-computing"]
---

## The problem with letting agents run loose

ECDSA.fail is a public optimization challenge: build the cheapest reversible quantum circuit for one secp256k1 elliptic-curve point addition, the primitive that dominates Shor's-algorithm resource estimates against Bitcoin and Ethereum's curve. Score = Toffoli count × peak qubits, with a statistical correctness gate you cannot game.

This is a perfect problem for LLM agents: huge search space, objective scoring, fast validation. It's also a perfect trap. Give a coding agent an open-ended optimization task and it will happily hallucinate a "2x improvement" that doesn't survive contact with the evaluator. One agent, one prompt, no discipline: that's how you get plausible garbage.

So I built a harness that treats agent output as adversarial until proven otherwise. It took the #1 spot. Here's how it works.

## Roles, not prompts

The fleet is nine specialist roles, each with a written contract (`agents/*.md`): what you're allowed to do, what you're forbidden from doing, and a mandatory output format (`DECISION / WHY / EVIDENCE`). Circuit-engineer proposes optimizations. Research-scout hunts papers and prior art. Density-analyst profiles gate counts. The orchestrator-reviewer audits everyone else's work. The falsifier's only job is to kill candidates.

Role specialization matters more than model choice. A model that's a brilliant circuit-engineer is often a terrible falsifier: optimism is a feature in one role and a bug in the other.

## The adapter layer: fail-closed or nothing

Each role maps to an ordered preference list of adapters: CLI agents (Codex, Amp, Claude Code, Kimi) and raw HTTP adapters (OpenRouter as a gateway, direct Kimi API). A router health-probes adapters and walks the fallback chain when one is down, rate-limited, or degraded.

The rule I never broke: **fail-closed**. No credentials or unhealthy adapter → typed failure report, never a broken request that silently produces nonsense. The same principle applies at the submit gate: if validation can't run, submission doesn't happen. Every failure mode defaults to "stop", never "try anyway".

## Dispatch without collisions

Nine autonomous agents sharing a filesystem is a race-condition generator. Dispatch is file-based: a task queue with per-role PID locks and **lane classes**: `exclusive` (only this role may write these paths), `readonly`, `control`. Before and after every task, the dispatcher snapshots git status. If an agent touched files outside its lane, the result is discarded. Tamper detection beats trust.

Every worker returns a strict JSON envelope that's schema-validated. Malformed envelope → rejected, not "parsed loosely". The parser also detects template answers, the generic "I analyzed the circuit and recommend further research" shape that means the agent did nothing.

## Memory without RAG

No vector store, no embeddings. Cross-agent memory is a curated, compressed knowledge digest (`AUTO_LEARNING_STATE.md`) plus a circuit graph that agents must consult before proposing anything. Deliberate context compression beat retrieval for this workload: the state is small, every agent reads all of it, and nothing important is ever out of context.

## The falsification engine

The leaderboard metric is public, but the edge came from the middle layer: every candidate goes through a falsifier queue before reaching the frontier. Propose, then try to kill. A candidate only advances if it survives an agent whose incentive is to destroy it. The public dashboard tracked it all in near-real-time: per-provider token spend, the multi-objective frontier, the falsifier queue, agent-by-agent activity, sanitized through a schema before anything left the harness, because candidate routes were the competitive asset.

A 30-minute launchd loop ran the whole factory: discover → validate → submit, with hard human gates on GPU spend and a $200 budget cap in the control plane.

## What I'd tell anyone building agent fleets

1. **Verification-first beats generation-quality.** The models were interchangeable; the gates weren't. Zero errors across all benchmark cases came from fail-closed validation, not from picking the perfect model.
2. **Roles are prompts with teeth.** Allowed/forbidden actions plus a schema-validated output format will do more for you than any prompt-engineering trick.
3. **Make agents kill each other's work.** The falsifier queue found more real improvements than the proposers did, because it forced the proposers to pre-defend their claims.
4. **Budgets and gates are features.** The GPU approval gate and spend cap didn't slow the work. They forced the fleet to be selective about which experiments deserved to run.

The result: #1 on ECDSA.fail, and a research publication where I'm a contributor. The harness is the part I'm proud of. The circuit math belongs to a long line of researchers; the discipline that produced it reliably is mine.

*If you're working on agent orchestration, evaluation infrastructure, or just want to argue about fail-closed design, my inbox is open.*
