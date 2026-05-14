<script lang="ts">
  import RotatingVerb from "./RotatingVerb.svelte";

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

  $effect(() => {
    if (video) {
      try { video.playbackRate = 1.15; } catch {}
    }
  });
</script>

<section class="hero" aria-label="Intro">
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

    <div class="hero__iceTint" aria-hidden="true"></div>
    <div class="hero__vignette" aria-hidden="true"></div>
    <div class="hero__grid" aria-hidden="true"></div>
  </div>

  <div class="hero__lede">
    <p class="hero__intro">
      Hello, I'm <span class="hero__introName">Ruben Marcus</span>
      and I <span class="hero__introVerb">Build</span>
    </p>

    <h1 class="hero__title">
      <RotatingVerb words={verbs} interval={3600} morphMs={750} class="hero__verb" />
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
  }

  /* Static background — no parallax, no zoom transitions, no mouse tracking */
  .hero__bg {
    position: absolute;
    inset: 0;
    z-index: -2;
  }

  .hero__video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.15);
    transform-origin: center center;
    filter: brightness(0.86) contrast(1.04) saturate(0.18);
  }

  /* Ice tint over the video */
  .hero__iceTint {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      135deg,
      rgba(200, 235, 255, 0.5) 0%,
      rgba(150, 210, 245, 0.45) 35%,
      rgba(100, 180, 230, 0.45) 65%,
      rgba(60, 140, 200, 0.5) 100%
    );
    mix-blend-mode: color;
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

  .hero__intro {
    margin: 0;
    font-family: var(--font-sans);
    font-size: clamp(1.15rem, 1.7vw, 1.55rem);
    color: var(--muted);
    line-height: 1.35;
  }
  .hero__introName,
  .hero__introVerb {
    color: var(--accent-soft);
    font-weight: 500;
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

  /* The blue glow lives on the rotating word ONLY — no cursor halo, no
     viewport-wide filter. The rotating text is itself the blue accent. */
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
