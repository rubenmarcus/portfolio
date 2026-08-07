# Visual Rubric — Portfolio Gauntlet

Score every screenshot (page × viewport × cycle) on each item below:

- **0** — clearly broken / fails the criterion
- **1** — passable but noticeably improvable
- **2** — meets the bar

Max score per shot: **30**. View each shot with ReadMediaFile before scoring.
Record per-shot scores and cycle summaries in `qa/GAUNTLET-LOG.md`.

## Items

1. **Subject legibility at first glance** — the page's primary subject (hero
   figure, section headline, card grid) reads instantly, without hunting.
2. **Line/contour continuity** — 3D contour/wireframe vectors are continuous
   strokes; no dashed, broken, or stair-stepped lines at either viewport.
3. **Bloom quality** — glow is confined to the vortex ring / contour
   highlights; no blown-out whites, no halo swallowing text or the full scene.
4. **Whitespace rhythm** — vertical spacing follows the 8pt grid with generous
   breathing room between sections; nothing cramped or arbitrarily spaced.
5. **Type hierarchy** — display / body / mono-label tiers are unmistakable;
   sizes, weights, and tracking separate primary from secondary content.
6. **Zero stray blue** — blue/violet appears ONLY inside the cinematic vortex
   moment (and its bloom); nowhere else on any page, any viewport.
7. **Text contrast AA** — body and label text meet WCAG AA against their
   immediate background (incl. over scrims, cards, and the 3D stage).
8. **Marquee/HUD legibility** — the availability marquee and the HUD stats
   card are readable: telemetry values resolvable, meters parseable, no
   clipping.
9. **Mobile composition** — at 390×844 the layout stacks sanely: hero poster
   frame reads, no overflow, tap targets not jammed, spacing rhythm holds.
10. **No console errors** — the shot's `.console.txt` companion is empty.
11. **Footer/edge finishing** — page ends cleanly; no orphaned elements, no
    abrupt cut-offs at the bottom edge or between sections.
12. **Card/grid alignment** — cards in grids share baselines and gutters;
    no ragged edges, no overflowing media.
13. **Accent discipline** — terminal green (#00ff41 family) is the only
    structural accent; it is used sparingly enough to stay special.
14. **Motion residue** — screenshot (taken after virtual-time settle) shows a
    *settled* frame: no mid-glitch artifacts, half-scrambled text, or
    particles stuck mid-transition.
15. **Hero composition (desktop)** — figure framed centre-right, lede clear of
    the canvas, HUD card not colliding with the figure or the marquee.

## Scoring workflow per cycle

1. `node scripts/visual-gauntlet.mjs --cycle N`
2. ReadMediaFile every `qa/shots/*-cycleN.png`; check every
   `*.console.txt`.
3. Fill the score table in `qa/GAUNTLET-LOG.md` (one row per
   page × viewport, 15 item scores + total).
4. Fix the worst offenders (lowest items, most pages affected).
5. Re-shoot as the next cycle. Keep only non-regressing changes.
