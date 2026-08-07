---
title: "Routing 9 agent roles across 7 providers: the ECDSA.fail harness"
description: "I led AI engineering on the multi-agent research harness that took #1 on ECDSA.fail. The routing layer is the part worth stealing: role to model tables, fail-closed adapters, and a spend gate that aborts the run before the bill does."
date: 2026-07-15
readTime: "9 min"
cover: "/art/blog/openrouter-routing.png"
tags: ["ai", "llm", "openrouter", "tooling"]
---

## The project

ECDSA.fail is a public optimization challenge: build the cheapest reversible quantum circuit for one secp256k1 point addition, scored on Toffoli count times peak qubits, with a statistical correctness gate you cannot game. I led AI engineering on the multi-agent research harness that took the #1 spot. [I wrote about the evaluation design separately](/blog/the-agent-swarm-that-took-1-on-ecdsa-fail). This post is about a different layer: how 9 specialist LLM roles got routed across 7+ providers without the fleet bankrupting itself or silently degrading.

OpenRouter was the substrate. One API key, one request shape, a few hundred models. That part takes an afternoon. The subject of this post is the policy on top, because that is where production actually lives.

A quick sketch of the fleet so the routing makes sense. Nine roles, each with a written contract (`agents/*.md`): allowed actions, forbidden actions, and a mandatory output format (`DECISION / WHY / EVIDENCE`). Circuit-engineer proposes optimizations. Research-scout hunts papers and prior art. Density-analyst profiles gate counts. The falsifier's only job is to kill candidates. The orchestrator-reviewer audits everyone else. Every worker returns a schema-validated JSON envelope, and malformed envelopes get rejected, not parsed loosely. Role specialization mattered more than model choice throughout. A model that is a brilliant engineer is often a terrible falsifier. Optimism is a feature in one role and a bug in the other.

## Roles own models, not the other way around

The first router version picked a model per call based on a vague sense of "hard task, strong model". That does not survive contact with a real workload. What worked is assigning models to roles, in a table, in version control:

```ts
type Role =
  | "research-scout" | "circuit-engineer" | "density-analyst"
  | "falsifier" | "orchestrator-reviewer";

const ROUTES: Record<Role, string[]> = {
  // Burns the most tokens in the fleet. Cheap and fast wins here.
  "research-scout":       ["google/gemini-2.5-flash", "deepseek/deepseek-chat-v3.1"],
  // Proposes circuit optimizations. Strong model, moderate volume.
  "circuit-engineer":     ["anthropic/claude-sonnet-4.5", "openai/gpt-5.1"],
  // Gate-count profiling. Mechanical work, mid-tier is fine.
  "density-analyst":      ["deepseek/deepseek-chat-v3.1", "google/gemini-2.5-flash"],
  // Kills candidates. Different vendor than the engineer, on purpose.
  "falsifier":            ["openai/o4-mini", "deepseek/deepseek-r1"],
  // Audits everyone. Strongest model, no cost optimization here.
  "orchestrator-reviewer": ["anthropic/claude-opus-4.5"],
};
```

Three decisions in this table carry the weight.

**The hot path gets the cheap model.** The scout and the analyst run constantly and their work is pattern matching over papers and gate counts. Routing that traffic to a frontier model would multiply the bill for no measurable quality gain. I learned the same lesson in ralph-starter: 187 tasks in a month, $22.41 total, about $0.12 per task, because the validation loop ran on cheap cached calls. Pay pattern-matching prices for pattern-matching work.

**Adversarial roles get a different vendor.** The falsifier's only job is to kill the engineer's candidates. If both run the same model family, they share blind spots. Cross-vendor disagreement is signal. When the falsifier and the engineer argue, the argument is the product.

**The final artifact gets the strongest model.** The orchestrator-reviewer audits every decision before anything advances. There is exactly one place in the system where quality dominates cost, and it is that one.

The table also documents intent. Six months from now I will not remember why the falsifier is a different vendor. The table remembers. Changes to it get reviewed like code, because they are code.

## The adapter layer is fail-closed

The harness has two adapter classes: CLI agents (Codex, Amp, Claude Code, Kimi) and raw HTTP through OpenRouter as a gateway, plus one direct provider API. Every role has an ordered fallback chain across both classes. A router health-probes adapters and walks the chain when one is down, rate-limited, or degraded.

The rule I never broke: fail-closed. Retry transient errors, walk the chain, and if the chain is exhausted, throw a typed failure. Never silently degrade below what the role allows. Never invent a response.

```ts
async function callRole(role: Role, req: ChatRequest): Promise<ChatResult> {
  let lastErr: unknown;

  for (const model of ROUTES[role]) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await openrouter.chat({ ...req, model });
        spend.record(role, model, res.usage);
        return res;
      } catch (err) {
        lastErr = err;
        if (!isRetryable(err)) break; // 4xx other than 429 fails immediately
        await sleep(2 ** attempt * 1000 + jitter());
      }
    }
    console.warn(`[router] ${model} exhausted for ${role}, falling back`);
  }

  throw new FailClosedError(role, ROUTES[role], lastErr);
}
```

`isRetryable` is a short list: 429, 500, 502, 503, timeouts. Everything else stops the chain on the spot. A 400 means my request is wrong, and retrying a wrong request against three more models makes three times the garbage.

Mid-loop is the worst place to learn a provider's rate limit. The agent has state, the run is on generation 4 of 6, and a 429 is not an error page. It is a routing event. One thing I got wrong early: I used to let the fallback chain change the role's contract. The engineer fell back to a weaker model and nobody noticed until output quality quietly slid. Now the chain is part of the role definition, and an exhausted chain is a hard stop with a log line I actually read.

## The spend gate

Every call returns usage and cost. All of it goes into a ledger, per role, per model, per run. The public dashboard tracked per-provider token spend in near-real-time, sanitized through a schema, because candidate routes were the competitive asset.

The pattern that matters most is the gate. Before an expensive dispatch, project the cost. After every call, record the actual. Cross the cap and the run aborts, no exceptions:

```ts
class SpendGate {
  private spent = 0;

  constructor(private capUsd: number) {}

  record(role: Role, model: string, u: Usage) {
    this.spent += u.costUsd;
    ledger.append({ ts: Date.now(), role, model, ...u });
    if (this.spent > this.capUsd) {
      throw new SpendCapError(
        `cap hit: $${this.spent.toFixed(2)} > $${this.capUsd}. aborting run.`,
      );
    }
  }

  canAfford(role: Role, estTokens: number): boolean {
    return this.spent + estimateCost(role, estTokens) <= this.capUsd;
  }
}
```

Two details worth stealing.

**Check before and after.** `canAfford` runs before dispatching anything that fans out. `record` runs after every single call. The before-check uses an estimate and is allowed to be wrong. The after-check uses the real number and is never allowed to be wrong.

The estimate is crude on purpose. Role average tokens times current model price, pulled from the ledger itself. A fancy predictor would be wrong in more interesting ways. Crude and conservative is what you want from a gate: it occasionally blocks a run that would have fit, and it never waves through one that won't.

**Abort, do not warn.** A warning in a log is how you spend $60 overnight on a stuck loop. The harness ran on a 30-minute launchd schedule with a $200 budget cap in the control plane, sitting next to the GPU approval gate. The cap did not slow the work. It forced the fleet to be selective about which experiments deserved to run. Budgets are a feature.

The ledger also pays for itself in arguments. When a run looks expensive, I do not guess which role to optimize. I sort the ledger by cost and the answer is on the first line.

## Quirks under one API

Behind one API, the models are still different products. What actually bit me:

- **Rate limits are per provider, not per API.** OpenRouter routes one model id to whichever provider serves it, unless you pin it. Pin the provider for the hot path, or your "one model" has three different rate limits depending on the weather.
- **Context sizes lie by omission.** The catalog says 200k. The provider serving your request tonight may cap at 128k. Check the real limit before stuffing a prompt, not after the truncation error.
- **Tool calling is not portable.** Some models emit strict JSON. Some emit almost-JSON. The harness already schema-validated every worker envelope and rejected malformed output, which turned this from a silent-corruption bug into a loud, retryable failure.
- **Latency is a routing input.** Cheap models are 2 to 5x faster on short calls, which compounds inside a 30-minute dispatch loop.

## What routing bought us

The harness took #1 on ECDSA.fail with zero errors across all benchmark cases. That came from the gates, not from picking the perfect model. The models were interchangeable. The routing layer is what made interchangeability safe: any role could lose a provider mid-run and the fleet kept its contracts, its budget, and its honesty.

Honest footnote: most projects do not need this. If you have one workload and one model you trust, a direct provider SDK with a retry loop is 40 lines and has fewer moving parts. The routing layer earns its complexity when you have roles with different cost and quality needs, unattended loops that must survive provider hiccups, or a spend cap with consequences. The harness had all three.

*If you are wiring up multi-provider routing and want to compare scars, my inbox is open.*
