<script lang="ts">
  import RotatingVerb from "./RotatingVerb.svelte";
  import HeroScan from "./HeroScan.svelte";
  import HeroTerminal from "./HeroTerminal.svelte";
  import GradientGridBg from "./GradientGridBg.svelte";

  interface Props {
    lang?: string;
  }
  let { lang = "en" }: Props = $props();
  const pt = lang.startsWith("pt");
  // Internal links keep the visitor inside the PT tree.
  const base = pt ? "/pt" : "";

  const VERBS_EN = [
    "autonomous AI agents",
    "multi-agent systems",
    "AI dev tools",
    "LLM pipelines",
    "products end-to-end",
    "open-source libraries",
  ];

  const VERBS_PT = [
    "agentes de IA autônomos",
    "sistemas multi-agent",
    "AI dev tools",
    "pipelines de LLM",
    "produtos end-to-end",
    "bibliotecas open-source",
  ];

  const verbs = $derived(pt ? VERBS_PT : VERBS_EN);

  const copy = $derived(
    pt
      ? {
          hello: "Olá, eu sou",
          build: "e eu",
          buildVerb: "construo",
          sub: "Senior Product Engineer. Produtos AI-native, experiências web premium e protótipos prontos pra startup. 13 anos de Next.js, TypeScript, sistemas de IA e developer tooling.",
          ctaPrimary: "Agendar um projeto",
          ctaSecondary: "Melhore o AEO da sua empresa",
          ctaAgent: "contrate via agente ↗",
        }
      : {
          hello: "Hello, I'm",
          build: "and I",
          buildVerb: "Build",
          sub: "Senior Product Engineer. AI-native products, premium web experiences, and startup-ready prototypes. 13 years across Next.js, TypeScript, AI systems and developer tooling.",
          ctaPrimary: "Book a project",
          ctaSecondary: "Fix the AEO of your company",
          ctaAgent: "hire me via your agent ↗",
        },
  );
</script>

<section class="hero" aria-label="Intro">
  <div class="hero__bg">
    <!-- Animated gradient-grid backdrop at very low intensity — felt, not seen -->
    <GradientGridBg />

    <!-- Background terminal — the code the portrait is "writing", typed live
         across the whole hero at low opacity, behind everything. -->
    <HeroTerminal class="hero__terminal" />

    <!-- Scanline portrait — the hero subject: Ruben at the laptop, rendered
         live in WebGL with cursor-reactive scanline warp. Lazily boots
         three.js; static <img> / single frame on mobile & reduced motion. -->
    <HeroScan class="hero__desk3d" />

    <div class="hero__vignette" aria-hidden="true"></div>
    <div class="hero__fadeBottom" aria-hidden="true"></div>
  </div>

  <div class="hero__lede">
    <p class="hero__intro">
      {copy.hello} <span class="hero__introName">Ruben Marcus</span>
      {copy.build} <span class="hero__introVerb">{copy.buildVerb}</span>
    </p>

    <h1 class="hero__title">
      <RotatingVerb words={verbs} interval={7000} morphMs={1800} class="hero__verb" />
    </h1>

    <p class="hero__sub">
      {copy.sub}
    </p>

    <div class="hero__ctas">
      <a href="{base}/contact" class="btn btn-primary">{copy.ctaPrimary}</a>
      <a href="{base}/contact?subject=aeo" class="btn btn-secondary">{copy.ctaSecondary}</a>
      <a href="{base}/connect" class="hero__agentCta">{copy.ctaAgent}</a>
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
    inset: 0;
    z-index: -2;
  }

  /* Scanline portrait — right portion of the hero on desktop, the figure
     filling most of the viewport height. Soft left mask so the canvas melts
     into the dark stage instead of showing a hard edge (the artwork's pure
     black background makes the blend seamless). */
  :global(.hero__desk3d) {
    inset: 0 0 0 auto !important;
    width: min(62vw, 1080px) !important;
    z-index: 0;
    mask-image: linear-gradient(90deg, transparent 0%, #000 20%);
    -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 20%);
  }
  @media (max-width: 900px) {
    :global(.hero__desk3d) {
      inset: 0 !important;
      width: 100% !important;
      opacity: 0.5;
      mask-image: linear-gradient(180deg, #000 0%, transparent 70%);
      -webkit-mask-image: linear-gradient(180deg, #000 0%, transparent 70%);
    }
  }

  /* CRT terminal — upper-left on desktop, aligned with the lede column and
     tucked under the header. Low visual weight; hidden on mobile. */
  :global(.hero__terminal) {
    inset: 0;
    z-index: 0;
  }
  @media (max-width: 900px) {
    :global(.hero__terminal) { display: none; }
  }

  /* Legibility scrim — a soft dark field behind the lede only, no global
     murk. The stage itself stays pure near-black. */
  .hero__vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(ellipse 50% 45% at 20% 82%, rgba(4, 6, 11, 0.62) 0%, rgba(4, 6, 11, 0.26) 55%, transparent 82%),
      linear-gradient(180deg, rgba(4, 6, 11, 0.5) 0%, transparent 14%);
  }

  /* Bottom fade-to-black — pairs with the HeroStats top fade so the
     transition between the two sections is a continuous gradient. */
  .hero__fadeBottom {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 320px;
    pointer-events: none;
    z-index: 1;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(0, 0, 0, 0.25) 30%,
      rgba(0, 0, 0, 0.7) 65%,
      #000 100%
    );
  }

  /* Lede — left column, capped so it never reaches the 3D figure at
     1440px+; wide whitespace around it. */
  .hero__lede {
    position: absolute;
    left: clamp(2rem, 7vw, 8rem);
    bottom: 11%;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.55rem;
    max-width: min(44rem, 44vw);
  }
  @media (max-width: 900px) {
    .hero__lede {
      left: 1rem;
      right: 1rem;
      bottom: 8%;
      max-width: none;
    }
  }

  /* Choreographed entrance — the lede rises in ~0.8s after load, once the
     3D figure's assemble intro is already underway. One clean moment. */
  @media (prefers-reduced-motion: no-preference) {
    .hero__intro,
    .hero__title,
    .hero__sub,
    .hero__ctas {
      opacity: 0;
      animation: heroRise 900ms cubic-bezier(0.22, 0.61, 0.21, 1) forwards;
    }
    .hero__intro { animation-delay: 800ms; }
    .hero__title { animation-delay: 950ms; }
    .hero__sub { animation-delay: 1050ms; }
    .hero__ctas { animation-delay: 1150ms; }
  }
  @keyframes heroRise {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: none; }
  }

  /* Intro — Space Grotesk lede, name/verb pick up the terminal accent */
  .hero__intro {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(1.4rem, 2.1vw, 2rem);
    font-weight: 400;
    color: var(--muted);
    line-height: 1.3;
    letter-spacing: 0.005em;
  }
  .hero__introName {
    color: var(--accent-soft);
  }
  .hero__introVerb {
    color: var(--accent-soft);
  }

  .hero__title {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(2.6rem, 4.9vw, 4.4rem);
    line-height: 0.98;
    letter-spacing: -0.03em;
    font-weight: 500;
    color: var(--text);
    display: block;
    text-wrap: balance;
  }

  /* Green glow lives on the rotating verb */
  :global(.hero__verb) {
    color: var(--accent-soft);
    text-shadow:
      0 0 24px rgba(0, 255, 65, 0.4),
      0 0 48px rgba(0, 255, 65, 0.2);
  }

  /* Positioning subheadline — the "what I do for you" line under the verb */
  .hero__sub {
    margin: 0;
    max-width: 34rem;
    font-family: var(--font-display);
    font-size: clamp(0.98rem, 1.25vw, 1.15rem);
    font-weight: 400;
    line-height: 1.5;
    color: var(--muted);
  }

  .hero__ctas {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    margin-top: 0.4rem;
    align-items: center;
  }

  /* Agent channel — quiet mono chip next to the real CTAs */
  .hero__agentCta {
    font-family: var(--font-mono);
    font-size: 0.74rem;
    letter-spacing: 0.06em;
    color: var(--accent-soft);
    opacity: 0.75;
    transition: opacity var(--duration-hover) var(--ease-default),
      text-shadow var(--duration-hover) var(--ease-default);
  }
  .hero__agentCta:hover {
    opacity: 1;
    text-shadow: 0 0 12px rgba(0, 255, 65, 0.45);
  }
  /* Four CTAs stay a clean wrapped row on small screens */
  @media (max-width: 560px) {
    .hero__ctas {
      gap: 0.55rem;
    }
    .hero__ctas :global(.btn) {
      font-size: 0.78rem;
      padding: 0.6rem 0.95rem;
    }
  }
</style>
