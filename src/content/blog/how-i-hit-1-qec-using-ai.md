---
title: "How I Hit #1 on a Quantum Error Correction Challenge using AI"
description: "I topped the QEC Decoder Optimization Arena leaderboard at 2,642 errors per million — not with physics credentials, but with a tight experimental loop: held-out validation, statistical gating, and a swarm of agents in isolated git worktrees."
date: 2026-04-16
readTime: "7 min"
cover: "/art/blog/how-i-hit-1-qec-using-ai.png"
tags: ["quantum-computing", "ai", "agents", "benchmarks", "optimization"]
canonical: "https://www.linkedin.com/pulse/how-i-hit-1-quantum-error-correction-challenge-using-ruben-marcus-xvfae/"
---

Today I submitted my last attempt on the [QEC Decoder Optimization Arena](https://www.optimizationarena.com/qec) leaderboard and [my submission](https://www.optimizationarena.com/qec/submissions/ab2806d6-792c-40a8-b1c3-e4078748a50d) was sitting at rank 1.

Score: 2,642 errors per million. The entries below mine had names like "My QEC Decoder" and "quant", from people who actually work in this field. I build React apps for a living.

This isn't a physics story. It's an engineering one.

## What the benchmark actually is

Quantum computers rely on qubits, which are extremely fragile. They flip and drift constantly.

Error correction uses many physical qubits to encode one stable logical qubit, and the job of a decoder is to look at measurement signals called syndromes and guess what went wrong, so the system can undo it. Good decoders are what make quantum computing viable at scale. Research groups spend years on them.

The QEC Decoder Optimization Arena is a public benchmark. You submit a single Python file and it gets scored across 24 different noise scenarios. Lower errors per million wins.

## The constraints

The arena deliberately strips away every shortcut.

One file, 200KB max. Only numpy, scipy, pymatching, and stim. No PyTorch, no JAX, no C extensions. Every decode finishes in 2.5 seconds or you get disqualified. There's a ten-minute cooldown between submissions. The sandbox blocks os, subprocess, socket, open, exec, eval. No downloaded weights, no external calls, no tricks.

Whatever math you ship has to fit inside that box.

## The approach

I treated it as a pure optimization problem. Errors per million is a single scalar. Everything else is engineering discipline.

The tool I leaned on is one I actually build at my job: [autoresearcher](https://autoresearcher.org/), a benchmark-driven autonomous research loop. Claude Opus 4.6 was the coding agent. I was the human in the loop, approving direction changes and vetoing nulls.

Every experiment went through five steps.

Write the hypothesis in plain English. Ship the smallest possible test script. Measure on a held-out seed, never the training one. Run a Z-score on a binomial test and require at least 2.0 to ship. Kill or keep, and if we killed it, document why so we wouldn't retest it.

I ran roughly forty submissions over one week.

## The swarm

One piece worth calling out. I wasn't running a single agent at a time. I was running several in parallel, each one in its own isolated git worktree so they couldn't step on each other's files.

At peak I had 15 going. Each branch testing its own decoder variation or its own null.

The swarm did two things. It scaled the loop, letting me test 15 ideas in the time it takes to test one, which matters when there's a ten-minute submission cooldown. And it surfaced contradictions, because when two agents working independently reached incompatible conclusions from the same diagnostic, that was usually the signal the diagnostic itself was flawed.

Most of the swarm's output was still nulls. But it let me burn through them faster, and the survivors were validated in isolation before being merged back to main.

## The part that actually matters

Around 80% of experiments were null results. Dead ends. Ideas that looked clever and did nothing. The research involved reading 11 papers in depth and investigating 18 open-source repositories before concluding that nobody had a silver bullet we were missing.

The graveyard includes Bayes lookup tables, minimum-weight matching ensembles, forward+reverse HMM voting (0% disagreement, mathematically redundant, should have caught that in ten minutes), 2-row block HMMs, column-scan decoders voting with row-scan decoders (99.85% agreement, useless ensemble), and within-row next-nearest-neighbor couplings that refused to improve anything.

I tried Belief Propagation with ordered statistics decoding, which came in 4.3 times worse than plain minimum-weight matching because surface codes have short cycles that make BP oscillate. I tried a neural MLP decoder in pure numpy, which matched the HMM at best and didn't generalize.

25+ approaches implemented and tested. Four ideas shipped. That ratio is the real story.

## What made it to production

The final submission does four things.

A row-scan Hidden Markov Model per parameter point, modeling correlated noise as a pairwise Ising system. The HMM uses bond dimension 32 for L=5 and 128 for L=7, which makes it equivalent to the Bravyi-Suchara-Vargo tensor network maximum likelihood decoder. CMA-ES tuning of its four coupling parameters per point, a gradient-free black-box optimization doing what my intuition couldn't.

Syndrome-hash patch mining that empirically finds every pattern the HMM systematically misses over millions of shots and hardcodes an override, only accepted if it also wins on thirty million held-out shots with Z of at least 1.65.

Runtime calibration of boundary edge weights at decode time.

None of that was obvious up front. It's the residue after burning through the nulls.

## The insight that actually won it

Around experiment thirty, after a long run of nulls, I ran a diagnostic instead of a new idea.

I measured, per syndrome hash, how often the HMM's prediction matched empirical ground truth across fifty million shots. It matched almost every time. A separate agent mining 500 million samples confirmed that 95.6% of the remaining gap between our decoder and the Bayes-optimal floor lives in syndromes that appear fewer than 10 times in 100 million shots. Fundamentally unpatchable.

Translation: the HMM was already near-optimal given its structural assumptions. Every architectural tweak I was trying was doomed from the start, because the ceiling wasn't the decoder's architecture. It was the long tail of rare syndromes where the decoder systematically bet wrong.

That pivot produced the last thirty errors-per-million of improvement. Not from a better idea, but from accepting that my current idea had a ceiling and adapting to it.

This is the most underrated engineering skill in the AI-agent era. Not having brilliant ideas. Knowing when your current one is finished, and reading diagnostics that tell you so.

## The takeaway for engineers

A lot of software engineers look at specialist benchmarks and assume they can't compete. The leaderboard I topped has actual quantum researchers on it. But modern AI coding agents are now competent enough at implementing specialist knowledge that the bottleneck has shifted.

The new bottleneck is whether you can run a tight experimental loop.

Hypotheses written before tests. Held-out validation always, training seed never. Nulls killed fast and documented. No falling in love with an idea because it was hard to implement. Diagnostics read instead of more experiments run, when you've clearly saturated a design.

None of that requires a PhD. It requires engineering discipline and a decent nose for statistics.

## The stack

Claude Opus 4.6 as the coding agent.

[autoresearcher](https://autoresearcher.org/) as the orchestrator. numpy, scipy, pymatching, stim in a Linux sandbox.

CMA-ES via the cmaes package for hyperparameter tuning.

One engineer, one laptop, zero GPUs, forty-odd submissions over one week.

*Ruben Marcus. Senior AI Fullstack Engineer at MultiVm Labs. Builder of autoresearcher, ralph-starter, AEO.js.*
