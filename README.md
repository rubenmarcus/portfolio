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

## License

MIT
