# rubenmarcus.dev

Personal portfolio site. Cyberpunk terminal aesthetic with a looping video background, interactive parallax, text scramble effects, and a curated ambient music player.

**Live:** [rubenmarcus.dev](https://rubenmarcus.dev)

## Stack

- [Astro](https://astro.build) with React islands
- [Tailwind CSS](https://tailwindcss.com)
- [Motion](https://motion.dev) (animations)
- [Lucide React](https://lucide.dev) (icons)
- TypeScript

## Features

- Fullscreen video background with mouse-follow parallax and scroll zoom
- Text scramble animation on load and hover (custom `useScramble` hook)
- Rotating profession titles via `TextLoop`
- Infinite marquee slider with links and now-playing info
- Background music player with 10-track curated playlist (YouTube IFrame API), skip/prev/next controls, mute toggle
- Responsive layout (mobile + desktop)
- SEO: OpenGraph, Twitter Cards, JSON-LD structured data, sitemap, robots.txt

## Getting started

```bash
pnpm install
pnpm dev
```

Build for production:

```bash
pnpm build
pnpm preview
```

## Project structure

```
src/
  components/
    Hero.tsx            # Main hero section (React island)
    TextLoop.tsx        # Cycling text animation
    InfiniteSlider.tsx  # Infinite marquee component
  layouts/
    Layout.astro        # HTML shell, SEO meta, fonts
  pages/
    index.astro         # Homepage
  styles/
    globals.css         # Tailwind + custom styles
public/
  videobg.webm         # Background video
  thumbnai.png          # OG image
  favicon.ico / .svg    # Favicons
```


## Video BG Prompt

```
Create a perfectly looping video. SUBJECT: A centered human head and upper neck (full bust portrait). The neck and lower head must remain visible and preserved at all times. The framing is locked and never changes. The subject is rendered entirely in an ASCII terminal style. The face and neck are composed of monospaced terminal characters. Character density is used to define shading and depth. CAMERA MOTION: The camera performs a smooth, continuous 360-degree orbit around the subject at a constant angular speed. The camera completes exactly one full rotation and returns to the identical starting viewpoint. The rotation passes smoothly through all angles, including the back of the head. No reversing direction. No oscillation. No back-and-forth motion. The subject remains perfectly still while the camera moves. LOOP CONSTRAINT (CRITICAL): The first frame and the last frame are visually and compositionally identical. No fade-in. No fade-out. No cross-dissolve. No interpolation at the loop seam. No flicker at the loop point. Time is treated as a closed loop where t=0 and t=end produce the same frame. ASCII STYLE: Use a rich and varied ASCII character set. Include letters, numbers, punctuation, and symbols. Examples include: A–Z, a–z, 0–9, @ # % & + = : ; < > / \ | _ - ( ) Character patterns are deterministic and stable over time. BACKGROUND: A black terminal background with vertical falling ASCII character columns. The background resembles real terminal output and system data. Use mixed ASCII characters, not binary-only characters. Do NOT use only 0 and 1. The background animation is loopable and independent from the camera motion. The background does not rotate, zoom, or parallax. COMPOSITION RULES: No cropping. No auto-centering. No zoom. No reframing. No camera shake. Lighting and contrast remain consistent throughout the entire loop. NEGATIVE CONSTRAINTS: no binary-only code rain no 0-and-1-only background no face-only crop no neck removal no torso removal no fade-in no fade-out no flicker no snap at loop no mirroring no extra rotations
```

## License

MIT
