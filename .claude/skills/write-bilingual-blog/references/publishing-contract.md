# Publishing contract

## File pairing

- English: `src/content/blog/<translation-key>.md`
- Portuguese: `src/content/blog-pt/<translation-key>.md`
- Use the same ASCII kebab-case filename as the stable translation key and cover identifier.
- Register a natural Portuguese public slug in `PT_BLOG_SLUGS` inside `src/lib/blog-routes.ts`.
- Use the same date, optional updated date, read time, tag semantics, and cover path.
- Localize title, description, prose, and link labels.

## Frontmatter

```yaml
---
title: "Localized title"
description: "Localized description grounded in the article"
date: YYYY-MM-DD
readTime: "N min"
tags: ["ai", "agents"]
cover: "/art/blog/<slug>.png"
---
```

Keep descriptions specific. Include the concrete system, decision, number, or failure that makes the article different from a generic explainer.

## Pairing checks

- Verify both files exist with the same basename and that `PT_BLOG_SLUGS` contains the pair.
- Compare headings and code blocks for factual drift.
- Verify numbers, commands, paths, product names, and links in both versions.
- Resolve internal links through `getBlogSlug`/`getBlogPaths`; do not assume EN and PT public slugs match.
- Do not translate code, CLI flags, filenames, framework names, or terms Brazilian developers normally keep in English.

## Repository checks

Run in this order:

```bash
pnpm text:gate
pnpm check
pnpm build
```

The text gate bans em dashes, en dashes, exclamation marks, and common machine-written filler outside code fences.

## Existing deep dives

Before repeating background, link to the relevant post:

- `automating-entire-workflows-with-ralph-starter`
- `cs-brasil-ai-harness`
- `inside-the-gauntlet-loop`
- `openrouter-routing`
- `agent-command-center`
- `dag-agent-orchestration`
- `evals-are-the-product`
- `i-built-my-portfolio-with-a-fleet-of-ai-agents`
