---
name: make-portfolio-blog-cover
description: Create, regenerate, or validate raster cover thumbnails for rubenmarcus.dev blog posts. Use when an article needs a cover, an existing thumbnail must be brought into the site's black-and-phosphor-green particle system, a cover motif must be added to scripts/gen-blog-covers.mjs, or blog image dimensions and visual consistency need QA.
---

# Make Portfolio Blog Cover

Turn an article's central idea into one readable particle motif that matches the existing portfolio thumbnails.

## Workflow

1. Read `references/visual-system.md` completely.
2. Inspect at least four recent covers in `public/art/blog/`, including one visually related article. Do not infer the style from filenames alone.
3. Reduce the article to one motif that remains recognizable at card size. Avoid literal paragraphs, UI text, brand marks, and a collage of concepts.
4. Add the slug and motif to `COVERS` in `scripts/gen-blog-covers.mjs` so the art direction remains reproducible.
5. Use the available raster image-generation capability. For ImageGen, generate one distinct asset per article and use inspected covers only as style references.
6. Save the selected final at `public/art/blog/<slug>.png`. Never leave a project-referenced image only in a tool cache or temporary directory.
7. Inspect the saved file at original detail. Verify motif, palette, negative space, absence of text, and similarity to the thumbnail family.
8. Verify a 1024x1024 PNG with RGB or RGBA color. Check that the corners are effectively black and that no unintended color family dominates.
9. Confirm that both language versions reference the same `/art/blog/<slug>.png` path.

## Prompt construction

Start from the shared style below, then add one `MOTIF:` sentence from the article:

```text
A dense luminous swarm of tiny phosphor-green (#00ff41) particles, sparks and hairline light trails on a pure black background, forming one central motif. Organic depth, soft phosphor bloom, subtle dot-matrix grain, cinematic contrast, square composition with generous black margins. Strictly no text, letters, logos, people, solid fills, frames, borders, or other colors. Dark analog occult-techno mood.
```

Do not request title text inside the bitmap. The site renders article titles separately.

## Completion gate

Finish only when the motif is registered, the PNG is saved in the project, visual inspection passes, technical checks pass, and both articles use the same cover path.
