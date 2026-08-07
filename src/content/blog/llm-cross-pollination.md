---
title: "Cross-pollinating LLMs: peer review for machines"
description: "I built a research pipeline where frontier models from different providers generate, adversarially review, and merge each other's work. The only thing shared between them is the previous phase's text. It turns out peer review compiles into prompt choreography surprisingly well."
date: 2026-07-11
readTime: "9 min"
tags: ["ai", "llm", "agents", "research", "openrouter"]
cover: "/art/blog/llm-cross-pollination.png"
---

I run a research pipeline where several frontier models, from *different* providers, routed through OpenRouter, iteratively generate, critique, and merge each other's work. Nobody shares a vector store. Nobody shares memory. The only thing that ever crosses the boundary between models is the previous phase's text, pasted into the next prompt.

That constraint sounds like a limitation. It is the design. What I accidentally built is peer review, compiled into prompt choreography. This post is how it works and why the specific choices matter.

## Why one model was not enough

Single-model research has a failure mode nobody likes to talk about: the model grades its own homework. Ask it to research a topic and then "check its work," and it checks the way you check your own email for typos: it sees what it meant to write. Worse, every provider's model carries the same blind spots across every run, because the blind spots are baked into the weights. Ask the same model twice and you get the same confident omission twice, which feels like corroboration and is not.

The fix is the one science already figured out: independent workers, adversarial review, and a synthesis step that nobody involved in the writing controls. I just had to implement it with API calls.

## Phase -1: the prompt gets peer reviewed first

Before any research happens, the pipeline optimizes the research prompt itself. Model A drafts an improved version of the prompt. Model B critiques that draft and merges its critique back in. Model C freezes the final version.

This phase exists because I kept noticing that output quality tracked prompt quality more than model quality, and the prompt was the one artifact in the system that got zero scrutiny. Three models arguing about the prompt costs a few cents and, anecdotally, catches vague success criteria that would have poisoned every downstream phase. Garbage in, gospel out.

## Phase 0: independent research, provider diversity as decorrelation

Three to four models, each from a different provider, research the frozen prompt independently. Each runs with its own timeout and per-token cost accounting, so a slow or verbose model degrades gracefully instead of blocking the pipeline or eating the budget.

The provider diversity is not a hedge against one API being down. It is decorrelation. Models from the same provider share training data, alignment recipes, and stylistic tics, so their errors are correlated and their agreement means little. Models from different providers fail in different directions, which makes their *agreement* informative and their *disagreement* diagnostic. This is the same reason you do not run a clinical trial with four copies of the same researcher.

## Phase 1: reciprocal adversarial review

This is the phase that earns the title of the post. The models are paired up, and each reviews its partner's research with instructions to be adversarial, literally "rank each section 1-10" and justify the score. Then each model merges three documents: its own original research, its own critique of its partner, and its partner's critique of it.

The merge step is where self-review gets structurally excluded. A model cannot just wave away criticism, because the criticism is already written down and the merge prompt requires it to address each point. It can rebut, but it has to rebut on the record.

Then a judge, from a *third* provider, one that neither writer belongs to, scores the merged result as structured JSON across completeness, accuracy, balance, and actionability. The judge has no dog in the fight. It never wrote a word of the research, so it has nothing to defend. That turns out to matter as much for machines as it does for tenure committees.

## Phase 2: the super-merge, with order shuffling

Up to three fresh models each independently merge all the phase-1 documents into one synthesis. Here is the detail I am proudest of, because it is cheap and weird: each merging model receives the documents in a *different order*.

Language models have primacy bias. The document they read first anchors the merge. If every merger sees the documents in the same order, the "consensus" of the mergers is partly an artifact of document one. Shuffle the order and whatever survives across all three merges is much more likely to be signal than sequence.

On top of that, an explicit consensus calculus is written into the prompts:

- **4/4 agreement** across the source documents = high confidence.
- **3/4** = majority position, noted as such.
- **Unique coverage** (a point only one document makes) is flagged as valuable, not suspicious.

That last rule is the anti-groupthink clause. The naive version of multi-model synthesis treats dissent as noise and averages it away. But a point only one model surfaced is often the most interesting thing in the pile: either a hallucination to kill or a genuine find the others missed. The pipeline's job is to surface it for judgment, not to launder it into the median.

## Phase 3: the arbiter, and the honest flag

A final arbiter takes the three super-merges and produces the deliverable by majority-vote synthesis. Sections where the mergers fundamentally disagree (not stylistically, but on substance) are not resolved by the arbiter smoothing them over. They are flagged **NEEDS HUMAN REVIEW** in the output.

This is my favorite feature and it cost one line of prompt. A system that always produces a confident-sounding answer is a liability. A system that says "the machines deadlocked here, a person should look at this specific paragraph" is a tool.

## Why it works

The whole thing is structured epistemics with an API bill:

- **Provider diversity** decorrelates the errors, so agreement carries information.
- **Reciprocal review** replaces self-review, because no model grades its own homework.
- **Order shuffling** counters primacy bias in the merge step.
- **Explicit consensus rules** prevent dissent from being silently averaged out.
- **A human-review flag** keeps the pipeline honest at the boundary of its own competence.

None of this required fine-tuning, RAG infrastructure, or shared memory. It is text in, text out, with the choreography doing the work. Peer review took academia a few centuries to formalize. It took me a weekend to compile it into prompts. The machines seem to find the process fair, or at least none of them have complained in a way that survived the merge.
