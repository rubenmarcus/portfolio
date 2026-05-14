<script lang="ts">
  import RotatingVerb from "./RotatingVerb.svelte";
  import CodeStream from "./CodeStream.svelte";
  import CloudField from "./CloudField.svelte";
  import AsciiField from "./AsciiField.svelte";
  import { scramble } from "../lib/motion/scramble";

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

  let mouse = $state({ x: 0, y: 0 });
  let zoom = $state(1.15);
  let video: HTMLVideoElement | null = $state(null);
  let hovering = $state(false);

  $effect(() => {
    if (video) {
      try { video.playbackRate = 1.15; } catch {}
    }
  });

  $effect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      mouse = { x, y };
    };
    const onWheel = (e: WheelEvent) => {
      zoom = Math.min(Math.max(zoom + e.deltaY * 0.0008, 1.1), 1.4);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("wheel", onWheel);
    };
  });

  const inCenter = $derived(hovering && Math.abs(mouse.x) < 0.3 && Math.abs(mouse.y) < 0.3);
  const activeZoom = $derived(inCenter ? zoom + 0.08 : zoom);
  const parallaxX = $derived(mouse.x * 22);
  const parallaxY = $derived(mouse.y * 22);
  const haloX = $derived(((mouse.x + 1) * 50).toFixed(1) + "%");
  const haloY = $derived(((mouse.y + 1) * 50).toFixed(1) + "%");
</script>

<section
  class="hero"
  onmouseenter={() => (hovering = true)}
  onmouseleave={() => (hovering = false)}
  role="region"
  aria-label="Intro"
>
  <div
    class="hero__bg"
    style:transform={`translate(${parallaxX}px, ${parallaxY}px)`}
  >
    <video
      bind:this={video}
      autoplay
      loop
      muted
      playsinline
      preload="auto"
      class="hero__video"
      style:transform={`scale(${activeZoom})`}
    >
      <source src="/videobg.webm" type="video/webm" />
    </video>

    <div class="hero__iceTint" aria-hidden="true"></div>

    <CloudField client:load blobs={6} class="hero__clouds" />

    <AsciiField
      client:load
      cell={12}
      density={0.16}
      morphRate={1.2}
      opacity={0.22}
      reactive={true}
      color="rgba(200, 230, 255, 1)"
      class="hero__asciiHalo"
    />

    <CodeStream client:load count={7} class="hero__code" />

    <div
      class="hero__halo"
      aria-hidden="true"
      style:--mx={haloX}
      style:--my={haloY}
    ></div>

    <div class="hero__vignette" aria-hidden="true"></div>
    <div class="hero__grid" aria-hidden="true"></div>
  </div>

  <!-- Lede pinned at 10% from left, 10% from bottom -->
  <div class="hero__lede">
    <p class="hero__intro">
      Hello, I'm <span class="hero__introName" use:scramble>Ruben Marcus</span>
      and I <span class="hero__introVerb" use:scramble>Build</span>
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

  .hero__bg {
    position: absolute;
    inset: -4%;
    z-index: -2;
    transition: transform 0.8s var(--ease-default);
  }

  .hero__video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform-origin: center center;
    transition: transform 0.8s var(--ease-default);
    filter: brightness(0.86) contrast(1.04) saturate(0.18);
  }

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

  :global(.hero__clouds) {
    position: absolute !important;
    inset: 0;
    z-index: 0;
    opacity: 0.75;
  }

  :global(.hero__asciiHalo) {
    position: absolute !important;
    inset: 0;
    z-index: 0;
    mix-blend-mode: screen;
  }

  :global(.hero__code) {
    position: absolute !important;
    inset: 0;
    z-index: 0;
    color: rgba(190, 230, 255, 0.62) !important;
  }

  /* Quantum-style flashlight halo */
  .hero__halo {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(
        circle 110px at var(--mx, 50%) var(--my, 50%),
        rgba(255, 255, 255, 0.7) 0%,
        rgba(220, 240, 255, 0.4) 55%,
        transparent 100%
      ),
      radial-gradient(
        circle 260px at var(--mx, 50%) var(--my, 50%),
        rgba(190, 230, 255, 0.28) 0%,
        rgba(120, 185, 235, 0.14) 45%,
        transparent 75%
      ),
      radial-gradient(
        circle 460px at var(--mx, 50%) var(--my, 50%),
        rgba(94, 200, 255, 0.12) 0%,
        rgba(94, 200, 255, 0.05) 50%,
        transparent 80%
      );
    mix-blend-mode: screen;
    transition: background 60ms linear;
    opacity: 1;
  }

  /* Vignette — sides near-black, strong bottom-left darken under the lede */
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

  /* ── Lede ── */
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
    filter: drop-shadow(0 4px 24px rgba(0, 0, 0, 0.55));
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
    text-shadow: 0 2px 18px rgba(0, 0, 0, 0.65);
  }
  .hero__introName,
  .hero__introVerb {
    color: var(--accent-soft);
    font-weight: 500;
    cursor: default;
    transition: color var(--duration-hover) var(--ease-default);
  }
  .hero__introName:hover,
  .hero__introVerb:hover { color: #c8def0; }

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
    text-shadow: 0 2px 32px rgba(0, 0, 0, 0.75);
  }

  :global(.hero__verb) {
    color: var(--accent-soft);
  }

  .hero__ctas {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    margin-top: 0.4rem;
  }
</style>
