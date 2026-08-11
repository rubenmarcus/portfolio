---
name: blog-voice
description: Ruben's writing voice for rubenmarcus.dev — blog posts, about, ai and agents pages. Use whenever writing or editing prose for this site. Enforced by scripts/text-gate.mjs (pnpm text:gate).
---

# Blog voice — how Ruben writes

Reference corpus: his LinkedIn articles (`~/Downloads/Basic_LinkedInDataExport_08-02-2026.zip`) and medium.com/@rubenmarcus. Read a real post before writing a new one. The site's posts are AI-assisted but must read as human, organic, written by the engineer who actually did the work.

## The five rules

### 1. Open with a concrete moment, not a framing

Real openings by Ruben:

> "Hoje mandei minha última submissão no leaderboard da Optimization Arena e meu nome estava no primeiro lugar."

> "No dia 11 de maio de 2026, uma nova onda do Mini Shai-Hulud comprometeu pacotes npm e PyPI em um ataque de supply chain."

> "No ano passado, tive minha fase 'degen' — foram três meses olhando gráficos..."

Banned openings: "In the world of...", "AI is changing...", "I planned to write about X", "Have you ever wondered...", any rhetorical wind-up. Start with what happened, when, and the number.

### 2. Depth means implementation detail and scars

Every technical claim must carry at least one of: a real number, a `file:line`/path, a command, a constraint, or a failure story. Explain *how the author thought*: what was tried first, what broke, what the measurement said, what got killed. A post without at least one "this failed and here's why" is superficial.

Good: "One file, 200KB max. Only numpy, scipy, pymatching, and stim. Every decode finishes in 2.5 seconds or you get disqualified."
Bad: "The constraints were challenging but we persevered."

### 3. Conclusions are lessons, not summaries

Real closings:

> "A lição aqui é bem direta: dependência não é só 'biblioteca'. É código de terceiro rodando dentro da sua máquina."

End with what the reader should do differently, or what the author does differently now. Banned: restating the post, "the future is...", "and that's why X matters", any paragraph that starts by summarizing ("So,", "In the end,", "At the end of the day,").

### 4. Sentence rhythm: short, declarative, no em-dashes

- **Never use "—" (em-dash) or "–" (en-dash) as punctuation.** It is the single most recognizable AI tell. Use a period, a colon, or parentheses. (Travessão for dialogue in PT is fine but avoid it anyway.)
- Short sentences. One idea per sentence. Contrast is allowed when grounded: "This isn't a physics story. It's an engineering one."
- Self-deprecation is honest, not performative: "Eu sou um fullstack engineer que entrega apps em React." Never "I reread my own code and felt dumb" theater.
- Talk about problems and defeats, but keep them technical or professional: failed generations, wrong thresholds, burned credits, dead ends. Never personal life: no layoffs, money, health, family. If a draft needs the personal story to make sense, find a different frame.
- Explain jargon inline, casually: "a versão simples do jeito que eu entendi", "se você já sabe o que é X, pode pular essa seção". Apologize to experts playfully when simplifying: "Desculpa de antemão aos físicos de verdade."
- Dry humor is fine when it's a fact, not a quip: "Um bom decoder é a diferença entre um computador quântico que funciona e um aquecedor caro."

### 5. Banned phrases and patterns (the gate enforces these)

- "—" / "–" anywhere in prose (frontmatter included)
- "the wrong question", "wrong question" framing
- "But here's the thing", "Here's the kicker", "Plot twist"
- "In conclusion", "In summary", "At the end of the day", "So there you have it"
- "It's not X, it's Y" more than once per post
- "game-changer", "delve", "landscape" (as metaphor), "supercharge", "unlock"
- "Boring was the feature"-style aphorisms about the post itself
- Version-number jokes, self-congratulation about honesty ("let me be honest", "full disclosure")
- Exclamation marks in technical prose
- Starting consecutive paragraphs with the same word

## PT-BR specifics

- Natural Brazilian informal-professional. Loanwords stay when a dev would use them: leaderboard, submissions, score, hard cap, pipeline, runner, shippar, deploy, gate, harness, agents, evals.
- Don't translate what no Brazilian dev translates; don't keep in English what everybody translates ("medidas", "erros", "cenários").
- PT is not a literal translation of the EN post. Same structure, same facts, re-thought in PT.

## Structure that works

1. Cold open: what happened, with the number.
2. Context section: explain the thing plainly ("Ok, primeiro: o que é isso?").
3. Why it's harder than it looks: the constraints, enumerated.
4. The approach: how the author thought, step by step, with tools and commands.
5. What broke / what surprised: the scars.
6. The lesson: direct, actionable, short.

## The gate

`pnpm text:gate` (scripts/text-gate.mjs) scans `src/content/blog/`, `src/content/blog-pt/`, `src/pages/about.astro`, `src/pages/pt/about.astro`, `src/pages/ai.astro`, `src/pages/pt/ai.astro`, `src/pages/agents.astro`, `src/pages/pt/agents.astro` for the banned patterns above and fails with file:line. Run it before considering any prose change done.
