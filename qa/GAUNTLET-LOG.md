# Gauntlet Log

Scores per `VISUAL_RUBRIC.md` — 15 items × 0–2, max 30 per shot.
Shots: `qa/shots/<page>-<viewport>-cycle<N>.png` (not committed).
Harness: `node scripts/visual-gauntlet.mjs --cycle N` (headless Chrome,
`--use-angle=metal`, `--force-prefers-reduced-motion` for deterministic
settled frames, virtual-time-budget 10000).

## Harness calibration notes (pre-cycle-1)

- `--disable-gpu` headless = SwiftShader: WebGL contexts failed outright
  (`BindToCurrentSequence failed`) and, once working, mangled shader
  derivatives (contour bands rendered as dense mesh) and dropped DOM text
  layers. Unusable for visual scoring.
- `--use-angle=metal` renders the real GPU path — contour, bloom, and DOM
  compositing all correct.
- Compositor-driven CSS animations race the virtual-time clock: entrance
  animations (`heroRise`, GSAP reveals) sometimes captured at opacity 0.
  `--force-prefers-reduced-motion` makes every shot a deterministic settled
  frame (also the site's reduced-motion path). The vortex intro only plays
  with motion enabled — verified with dedicated non-forced shots
  (`_vortex-check.png`), not in the scored set.
- Known capture limitation: the rigged character GLB loads after the desk
  GLB; under virtual time the capture may fire before it parses, so the
  character can be absent from hero shots even though it appears in real
  browsing. Flagged where it affects scores.

## Cycle 1

Mean: **29.4 / 30**. Console note: index shots show GitHub API 403s
(unauthenticated rate limit from repeated QA runs — environmental, the HUD
degrades gracefully to placeholder values).

| Shot | Score | Worst items | Notes |
|------|-------|-------------|-------|
| index-1600x1000 | 29 | console(1) | poster contour + character + HUD settle cleanly; 403s |
| index-390x844 | 29 | console(1) | true-390 layout after CDP fix; hamburger, poster, lede all clean |
| portfolio-1600x1000 | 30 | — | ASCII title + era cards aligned, generous rhythm |
| portfolio-390x844 | 30 | — | 2-col era grid wraps well |
| ai-1600x1000 | 30 | — | |
| ai-390x844 | 30 | — | |
| blog-1600x1000 | 30 | — | |
| blog-390x844 | 30 | — | |
| about-1600x1000 | 30 | — | |
| about-390x844 | 30 | — | earlier "overflow" was the 490px harness artifact, not the site |
| contact-1600x1000 | 28 | HUD/legibility(1), cards(1) | email value crosses the primary card border |
| contact-390x844 | 27 | cards(0), mobile(1), legibility(1) | email clipped mid-string ("@gmai…") in primary card |

### Cycle 1 fixes

- `contact.astro`: `.contact-card__value` resized `clamp(1.5rem,3vw,2.1rem)`
  → `clamp(1.15rem,2.6vw,1.75rem)` + `overflow-wrap: anywhere` so the full
  email stays inside the card on both viewports.
- Harness (not site): dev toolbar disabled in `astro.config.mjs` (dev-only)
  after its pill polluted every shot.

## Cycle 2

Mean: **29.75 / 30**. Same environmental GitHub 403s on index.

| Shot | Score | Delta vs C1 | Notes |
|------|-------|-------------|-------|
| index-1600x1000 | 29 | = | 403s only |
| index-390x844 | 29 | = | 403s only |
| portfolio-1600x1000 | 30 | = | |
| portfolio-390x844 | 30 | = | |
| ai-1600x1000 | 30 | = | |
| ai-390x844 | 30 | = | |
| blog-1600x1000 | 30 | = | |
| blog-390x844 | 30 | = | |
| about-1600x1000 | 30 | = | |
| about-390x844 | 30 | = | |
| contact-1600x1000 | 30 | +2 | email fully inside the card |
| contact-390x844 | 29 | +2 | email contained but wraps an orphan "m" — needs a smaller floor |

### Cycle 2 fixes

- `contact.astro`: `.contact-card__value` floor `1.15rem` → `1rem` so the
  email fits on one line at 390px.

## Cycle 3

Mean: **29.83 / 30**. Same environmental GitHub 403s on index.

| Shot | Score | Delta vs C2 | Notes |
|------|-------|-------------|-------|
| index-1600x1000 | 29 | = | 403s only |
| index-390x844 | 29 | = | 403s only |
| portfolio-1600x1000 | 30 | = | spot-checked, no regression |
| portfolio-390x844 | 30 | = | spot-checked, no regression |
| ai-1600x1000 | 30 | = | spot-checked, no regression |
| ai-390x844 | 30 | = | |
| blog-1600x1000 | 30 | = | |
| blog-390x844 | 30 | = | |
| about-1600x1000 | 30 | = | |
| about-390x844 | 30 | = | |
| contact-1600x1000 | 30 | = | |
| contact-390x844 | 30 | +1 | email on one line inside the card |

### Cycle 3 verdict

All changes non-regressing; kept. Remaining known issues are environmental
or harness-level, not site defects — see below.

## Cycle 4 (partial: /, /agents, /blog, /pt/agents)

Spot cycle after the /agents rework (card removals, AI Framework rename,
logo covers, article deep-links) and the global AudioPlayer deck. 8 shots,
0 console errors — the earlier GitHub 403s did not recur.

| Shot | Result | Notes |
|------|--------|-------|
| index both viewports | clean | radio deck settles bottom-right, no overlap issues |
| agents-1600x1000 | clean | hero + AI Framework card + logo cover render correctly |
| agents-390x844 | clean | hamburger, lede wrap, deck floats as designed |
| blog both viewports | clean | |
| pt-agents both viewports | clean | PT mirror matches EN structure |

## Remaining known issues (honest list)

- **GitHub API 403s in QA shots** — unauthenticated rate limit hit by
  repeated gauntlet runs. The HUD degrades gracefully (`———` / estimates).
  Not a site defect; would resolve with a token or cache.
- **Vortex/character timing in captures** — with motion forced off (the
  scored set), the hero is the static poster by design. The vortex intro
  (motion on) is verified via dedicated shots (`_vortex-check.png`), and
  the rigged character can be absent from captures when the virtual clock
  races the second GLB parse; it appears in real browsing.
- **RotatingVerb mid-morph in captures** — with motion enabled, the 7s
  verb morph can be caught mid-scramble in a still. Intentional live,
  artifact only in screenshots.
- **Headless fidelity** — SwiftShader cannot render this site (context
  failures / derivative artifacts); scoring relies on `--use-angle=metal`.
  CI machines without a GPU would need a different backend.
