<script lang="ts">
  import { onMount } from "svelte";
  import RotatingVerb from "./RotatingVerb.svelte";
  import AsciiField from "./AsciiField.svelte";
  import CodeStream from "./CodeStream.svelte";

  const verbs = [
    "autonomous AI agents",
    "post-quantum tools",
    "DeFi trading bots",
    "AI frameworks",
    "landing pages",
    "NFT marketplaces",
    "e-commerce platforms",
    "developer portals",
    "spec-driven coding loops",
    "wallet UX",
    "banking portals",
    "AI search infra",
    "open-source libraries",
  ];

  let video: HTMLVideoElement | null = $state(null);
  let hero: HTMLElement | null = $state(null);

  $effect(() => {
    if (video) {
      try { video.playbackRate = 1.15; } catch {}
    }
  });

  // Scroll-driven zoom. Updates a single CSS variable on the hero element via
  // a passive listener — no Svelte reactive state involved, so no re-renders.
  onMount(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let ticking = false;
    const update = () => {
      if (!hero) return;
      const y = window.scrollY;
      // 1.15 base, up to ~1.55 after 600px of scroll
      const zoom = 1.15 + Math.min(y * 0.00065, 0.4);
      hero.style.setProperty("--scroll-zoom", zoom.toFixed(3));
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  });
</script>

<section bind:this={hero} class="hero" aria-label="Intro">
  <div class="hero__bg">
    <video
      bind:this={video}
      autoplay
      loop
      muted
      playsinline
      preload="auto"
      class="hero__video"
    >
      <source src="/videobg.webm" type="video/webm" />
    </video>

    <!-- Blue tint masked to the head only -->
    <div class="hero__iceTint" aria-hidden="true"></div>

    <!-- Static-feeling ASCII overlay: sparse, slow, no cursor reactivity -->
    <AsciiField
      client:load
      cell={16}
      density={0.07}
      morphRate={0.35}
      opacity={0.16}
      reactive={false}
      color="rgba(200, 230, 255, 1)"
      class="hero__asciiOverlay"
    />

    <!-- Calm code snippet drift — 3 at a time, long lifespans -->
    <CodeStream client:load count={3} class="hero__code" />

    <div class="hero__vignette" aria-hidden="true"></div>
    <div class="hero__grid" aria-hidden="true"></div>
  </div>

  <div class="hero__lede">
    <p class="hero__intro">
      Hello, I'm <span class="hero__introName">Ruben Marcus</span>
      and I <span class="hero__introVerb">Build</span>
    </p>

    <h1 class="hero__title">
      <RotatingVerb words={verbs} interval={5200} morphMs={1100} class="hero__verb" />
    </h1>

    <div class="hero__ctas">
      <a href="/portfolio" class="btn btn-primary">See the work</a>
      <a href="/ai" class="btn btn-secondary">AI tools I ship</a>
    </div>
  </div>
</section>

<style>
  .hero {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    isolation: isolate;
    --scroll-zoom: 1.15;
  }

  .hero__bg {
    position: absolute;
    inset: 0;
    z-index: -2;
  }

  .hero__video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(var(--scroll-zoom, 1.15));
    transform-origin: center center;
    transition: transform 250ms ease-out;
    filter: brightness(0.86) contrast(1.04) saturate(0.18);
  }

  /* Ice tint masked to the head only */
  .hero__iceTint {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      135deg,
      rgba(200, 235, 255, 0.6) 0%,
      rgba(150, 210, 245, 0.55) 35%,
      rgba(100, 180, 230, 0.55) 65%,
      rgba(60, 140, 200, 0.6) 100%
    );
    mix-blend-mode: color;
    mask-image: radial-gradient(
      ellipse 22% 42% at 50% 50%,
      #000 55%,
      rgba(0, 0, 0, 0.6) 75%,
      transparent 100%
    );
    -webkit-mask-image: radial-gradient(
      ellipse 22% 42% at 50% 50%,
      #000 55%,
      rgba(0, 0, 0, 0.6) 75%,
      transparent 100%
    );
  }

  /* ASCII glyph overlay — same scale as the video so it zooms with it */
  :global(.hero__asciiOverlay) {
    position: absolute !important;
    inset: 0;
    z-index: 0;
    mix-blend-mode: screen;
    transform: scale(var(--scroll-zoom, 1.15));
    transform-origin: center center;
    transition: transform 250ms ease-out;
  }

  /* Code snippets float over everything else in the bg */
  :global(.hero__code) {
    position: absolute !important;
    inset: 0;
    z-index: 0;
    color: rgba(190, 230, 255, 0.5) !important;
  }

  .hero__vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(ellipse 55% 55% at 22% 80%, rgba(6, 8, 15, 0.7) 0%, rgba(6, 8, 15, 0.32) 55%, transparent 82%),
      linear-gradient(90deg, rgba(6, 8, 15, 1) 0%, rgba(6, 8, 15, 0.9) 7%, rgba(6, 8, 15, 0.45) 16%, transparent 28%, transparent 72%, rgba(6, 8, 15, 0.45) 84%, rgba(6, 8, 15, 0.9) 93%, rgba(6, 8, 15, 1) 100%),
      linear-gradient(180deg, rgba(6, 8, 15, 0.85) 0%, transparent 18%, transparent 55%, rgba(6, 8, 15, 0.92) 100%);
  }

  .hero__grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.14;
    background-image:
      linear-gradient(rgba(245, 241, 234, 0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(245, 241, 234, 0.06) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: radial-gradient(ellipse at center, #000 30%, transparent 80%);
  }

  /* Lede */
  .hero__lede {
    position: absolute;
    left: 10%;
    bottom: 10%;
    right: clamp(1rem, 4vw, 3rem);
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.55rem;
    max-width: 1100px;
  }
  @media (max-width: 720px) {
    .hero__lede {
      left: 1rem;
      right: 1rem;
      bottom: 8%;
    }
  }

  /* Intro — serif, italic-ready */
  .hero__intro {
    margin: 0;
    font-family: var(--font-serif);
    font-size: clamp(1.4rem, 2.1vw, 2rem);
    color: var(--muted);
    line-height: 1.3;
    letter-spacing: 0.005em;
  }
  .hero__introName,
  .hero__introVerb {
    color: var(--accent-soft);
    font-style: italic;
  }

  .hero__title {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(3.4rem, 9.5vw, 7.5rem);
    line-height: 0.96;
    letter-spacing: -0.03em;
    font-weight: 500;
    color: var(--text);
    display: block;
    text-wrap: balance;
  }

  /* Blue glow lives on the rotating verb */
  :global(.hero__verb) {
    color: var(--accent-soft);
    text-shadow:
      0 0 24px rgba(94, 200, 255, 0.45),
      0 0 48px rgba(94, 200, 255, 0.22);
  }

  .hero__ctas {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    margin-top: 0.4rem;
  }
</style>
