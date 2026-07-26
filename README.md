# jseramn.tech

Personal portfolio site for José Ramón García Del Risco (jseramn). Neon terminal aesthetic with a looping video background, interactive parallax, text scramble effects, and ambient music.

**Live:** [jseramn.tech](https://jseramn.tech)

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
- Infinite marquee slider with links and GitHub commit ticker
- Background music player (YouTube IFrame API) with skip/prev/next controls and mute toggle
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
  config/
    site.ts             # Canonical identity, presence, SEO, tracks
  components/
    Hero.tsx            # Main hero section (React island)
    TextLoop.tsx        # Cycling text animation
    InfiniteSlider.tsx  # Infinite marquee component
  layouts/
    Layout.astro        # HTML shell, SEO meta, fonts
  pages/
    index.astro         # Homepage
  styles/
    globals.css         # Tailwind + Vesper tokens
public/
  videobg.webm          # Background video
  thumbnail.png         # OG image
  favicon.ico / .svg    # Favicons
```

## License

MIT
