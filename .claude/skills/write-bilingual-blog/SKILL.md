---
name: write-bilingual-blog
description: Write, translate, revise, or publish paired Portuguese and English Markdown articles for rubenmarcus.dev. Use for new portfolio blog posts, bilingual article pairs, PT/EN synchronization, frontmatter preparation, internal-link planning, article updates, and editorial QA in src/content/blog-pt and src/content/blog.
---

# Write Bilingual Blog

Produce two native-sounding versions of one evidence-backed article while keeping facts, structure, links, and frontmatter synchronized.

## Workflow

1. Read `.claude/skills/blog-voice/SKILL.md` completely before drafting.
2. Read `references/publishing-contract.md` completely.
3. Inspect at least two recent paired posts with related subject matter. Reuse facts and links, not sentences.
4. Build a fact sheet from user statements, repository evidence, commands, measurements, and existing articles. Mark missing evidence instead of inventing it.
5. Choose the language closest to the source material as the first draft. For Ruben's personal experience, default to PT-BR first.
6. Open with a concrete event, number, command, failure, or decision. Do not open with a definition or trend claim.
7. Write the second language from the fact sheet and argument, not by translating sentence by sentence.
8. Keep the same internal translation key (the shared filename), date, cover, core headings, claims, examples, and destination URLs across both files. Register a natural PT-BR public slug in `src/lib/blog-routes.ts`. Localize title, description, prose, link labels, and the Portuguese public URL.
9. Add internal links only where they advance the argument. Prefer the matching language route when it exists.
10. Run `pnpm text:gate`, `pnpm check`, and `pnpm build`. Fix every failure caused by the article.

## Editorial rules

- Separate concepts by observable behavior. Do not create labels that differ only rhetorically.
- Use Ruben's projects as evidence: show the command, loop, file, failure, cost, or measured output.
- Treat Ralph Starter as a concrete implementation when discussing spec-driven loops, validation feedback, worktrees, provider choice, or pull requests.
- Distinguish exploration from production. State what changes when code needs users, maintenance, security, or repeatability.
- Explain jargon on first use without flattening it.
- Include at least one failed attempt or operating constraint.
- End with a decision rule the reader can apply.
- Never manufacture usage numbers, costs, benchmark results, dates, quotes, or implementation details.

## Completion gate

Finish only when both Markdown files exist, their frontmatter is paired, their claims agree, the PT slug and redirect are covered by `blog-routes`, every referenced local route exists, the shared cover path exists, and all three repository checks pass.
