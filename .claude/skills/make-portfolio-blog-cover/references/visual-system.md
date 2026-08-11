# Blog cover visual system

## Fixed properties

- Output: PNG, 1024x1024, RGB or RGBA.
- Background: pure or effectively pure black.
- Foreground: phosphor green centered near `#00ff41` with dim green particle falloff.
- Material: tiny particles, sparks, dust, wire-thin trails, restrained bloom.
- Composition: one centered motif, large black margins, readable as a small thumbnail.
- Mood: dark analog instrument, radar, oscilloscope, occult-techno diagram.
- Exclude text, letters, people, logos, watermarks, borders, frames, opaque colored panels, and unrelated colors.

## Motif selection

Choose a physical or diagrammatic metaphor for the article's argument:

- Routing: branching paths or a switchboard.
- Validation: calipers, target, gate, or test sweep.
- Parallel agents: multiple trails converging on one artifact.
- Product delivery: an object moving through distinct transformation stations.
- Research: a field of candidates below one measured frontier.

Use one metaphor. If the prompt needs the word "and" more than once to describe the motif, simplify it.

## Reference covers

Inspect these before generating:

- `public/art/blog/i-built-my-portfolio-with-a-fleet-of-ai-agents.png`
- `public/art/blog/cs-brasil-ai-harness.png`
- `public/art/blog/agent-command-center.png`
- `public/art/blog/automating-entire-workflows-with-ralph-starter.png`

## Technical QA

Use `file` or ImageMagick `identify` for dimensions and color mode. Inspect the image visually at original detail. Sample the corners if the background looks lifted. Reject any image with readable text, a second color palette, a full-bleed bright field, or a motif that disappears at thumbnail size.
