<script lang="ts">
  import { aiTools } from "../lib/data/aiTools";
  import VoxelIcon from "../lib/assets/VoxelIcon.svelte";
  import DitherCover from "./DitherCover.svelte";
  import type { VoxelIconName } from "../lib/assets/registry";

  // Voxel icon per tool — the asset lib's Tier A marks (hover rotates them).
  const TOOL_ICONS: Record<string, VoxelIconName> = {
    autoresearcher: "claude",
    "ralph-starter": "terminal",
    aeojs: "zap",
    "aeo-checker": "zap",
    scanrepo: "shipping",
    csbrasil: "threejs",
  };

  interface Card {
    slug: string;
    name: string;
    tagline: string;
    features: string[];
    status: string;
    site: string;
    /** Public repo — omit for closed-source tools (site link only). */
    repo?: string;
  }

  // aiTools order: autoresearcher → ralph starter → aeo.js
  const ORDER = ["autoresearcher", "ralph-starter", "aeojs"];
  const toolCards: Card[] = ORDER.map((slug) => {
    const t = aiTools.find((t) => t.slug === slug)!;
    return {
      slug: t.slug,
      name: t.name,
      tagline: t.tagline,
      features: t.features.slice(0, 2).map((f) => f.split(":")[0].split("·")[0].trim()),
      status: t.status,
      site: t.url,
      repo: t.repo ?? t.url,
    };
  });

  const extraCards: Card[] = [
    {
      slug: "aeo-checker",
      name: "AEO Checker",
      tagline: "Free AEO scanner. 4,500+ sites checked.",
      features: ["Instant AEO score", "AI-crawler policy report"],
      status: "shipping",
      site: "https://check.aeojs.org",
      repo: "https://github.com/rubenmarcus/aeo.js",
    },
    {
      slug: "scanrepo",
      name: "ScanRepo",
      tagline: "Scan repos for hidden malware & crypto scams.",
      features: ["Credential-theft detection", "Supply-chain analysis"],
      status: "shipping",
      site: "https://scanrepo.dev",
    },
    {
      slug: "csbrasil",
      name: "CS Brasil",
      tagline: "Browser FPS. 2,191 players, 154K+ kills, 27 countries.",
      features: ["WebGL shooter", "2,848 matches tracked"],
      status: "beta",
      site: "https://csbrasil.online",
      repo: "https://github.com/rubenmarcus/csbrasil",
    },
  ];

  const cards = [...toolCards, ...extraCards];

  interface Props {
    lang?: string;
  }
  let { lang = "en" }: Props = $props();
  const pt = lang.startsWith("pt");
  const base = pt ? "/pt" : "";

  /** pt-BR card copy keyed by slug — EN stays the data default. */
  const CARDS_PT: Record<string, { tagline: string; features: string[] }> = {
    autoresearcher: {
      tagline: "Loops de pesquisa general-purpose.",
      features: ["Co-evolução multi-agent", "Pareto frontier"],
    },
    "ralph-starter": {
      tagline: "Specs viram código. A IA cuida do resto.",
      features: ["Swarms multi-agent", "MCP server"],
    },
    aeojs: {
      tagline: "Answer Engine Optimization para a web moderna.",
      features: ["Análise de robots policy p/ AI crawlers", "Exports prontos p/ LLM"],
    },
    "aeo-checker": {
      tagline: "Scanner de AEO grátis. 4.500+ sites verificados.",
      features: ["Score de AEO instantâneo", "Relatório de AI-crawler policy"],
    },
    scanrepo: {
      tagline: "Escaneie repos atrás de malware e golpes de crypto.",
      features: ["Detecção de roubo de credenciais", "Análise de supply-chain"],
    },
    csbrasil: {
      tagline: "FPS no browser. 2.191 jogadores, 154K+ kills, 27 países.",
      features: ["Shooter em WebGL", "2.848 partidas registradas"],
    },
  };

  const taglineOf = (c: Card) => (pt ? (CARDS_PT[c.slug]?.tagline ?? c.tagline) : c.tagline);
  const featuresOf = (c: Card) => (pt ? (CARDS_PT[c.slug]?.features ?? c.features) : c.features);

  const copy = $derived(
    pt
      ? { bracket: "Open source", title: "Open Source", more: "Todas as AI tools →" }
      : { bracket: "Open source", title: "Open Source", more: "All AI tools →" },
  );

  // Particle-art covers (scripts/gen-project-covers.mjs) — same language
  // as the blog thumbs: image at rest, dither dots on hover.
  const COVER_SLUG: Record<string, string> = {
    autoresearcher: "autoresearcher",
    "ralph-starter": "ralph-starter",
    aeojs: "aeojs",
    "aeo-checker": "aeo-checker",
    scanrepo: "scanrepo",
    csbrasil: "corosolto",
  };

  // Deterministic ASCII bridge — denser at top, dissolves toward bottom
  function mkBridge(): string[] {
    const chars = ['·', '+', '·', '.', '×', '·', '·', '.', '·', '+'];
    return Array.from({ length: 10 }, (_, r) =>
      Array.from({ length: 80 }, (_, c) => {
        const h = ((r * 31 + c * 17 + r * c * 7) % 97) / 97;
        const density = (1 - r / 10) * 0.52;
        return h < density ? chars[(r * 5 + c * 3) % chars.length] : ' ';
      }).join('')
    );
  }
  const bridgeRows = mkBridge();
  let bridgeEl = $state<HTMLElement | null>(null);

  $effect(() => {
    if (!bridgeEl) return;
    const el = bridgeEl;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onScroll = () => {
      el.style.setProperty('--bridge-y', `${window.scrollY * 0.2}px`);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  });
</script>

<section class="tools" aria-label="Open Source">
  <div class="tools__inner">
  <div class="tools__bridge" aria-hidden="true" bind:this={bridgeEl}>
    {#each bridgeRows as row}
      <div class="tools__bridge-row">{row}</div>
    {/each}
  </div>

  <header class="tools__head">
    <span class="bracket">{copy.bracket}</span>
    <div class="tools__headRow">
      <h2 class="tools__title">{copy.title}</h2>
      <a class="tools__more" href="{base}/ai">{copy.more}</a>
    </div>
  </header>

  <div class="tools__grid">
    {#each cards as card, i}
      <article class="tools__card" style="--idx: {i};">
        <span class="tools__corner" aria-hidden="true">
          <VoxelIcon name={TOOL_ICONS[card.slug] ?? "circleDot"} size={54} />
        </span>
        <div class="tools__videoWrap" aria-hidden="true">
          <DitherCover
            src={`/art/covers/${COVER_SLUG[card.slug]}.png`}
            seed={card.name}
            alt={`${card.name} cover`}
            invert
          />
        </div>
        <div class="tools__body">
          <span class="tools__name">{card.name}</span>
          <span class="tools__tagline">{taglineOf(card)}</span>
          <ul class="tools__features">
            {#each featuresOf(card) as feat}
              <li class="tools__feat">{feat}</li>
            {/each}
          </ul>
          <div class="tools__foot">
            <span class="tools__status tools__status--{card.status}">{card.status}</span>
            <span class="tools__links">
              <a class="tools__link" href={card.site} target="_blank" rel="noopener noreferrer">site ↗</a>
              {#if card.repo}
                <a class="tools__link" href={card.repo} target="_blank" rel="noopener noreferrer">repo ↗</a>
              {/if}
            </span>
          </div>
        </div>
      </article>
    {/each}
  </div>
  </div>
</section>

<style>
  .tools {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 100%;
    border-bottom: 1px solid var(--line);
    /* Deep green-black lift — stays inside the site's single-accent language
       (no blue/slate anywhere outside the vortex moment). */
    background: linear-gradient(
      180deg,
      #000 0%,
      #030905 22%,
      #05100a 50%,
      #030905 78%,
      #000 100%
    );
  }

  .tools__inner {
    width: 100%;
    max-width: var(--content-max);
    margin-inline: auto;
    padding-inline: var(--gutter-x);
    padding-block: 3.5rem 4.5rem;
  }

  /* ASCII bridge — same as before */
  .tools__bridge {
    position: absolute;
    top: -230px;
    left: 0;
    right: 0;
    height: 380px;
    pointer-events: none;
    z-index: -1;
    overflow: hidden;
    font-family: var(--font-mono);
    font-size: 0.68rem;
    line-height: 2;
    letter-spacing: 0.28em;
    color: var(--accent-soft);
    opacity: 0.32;
    transform: translateY(var(--bridge-y, 0px));
    will-change: transform;
    mask-image: linear-gradient(
      180deg,
      transparent 0%,
      rgba(0, 0, 0, 0.5) 18%,
      rgba(0, 0, 0, 0.85) 42%,
      rgba(0, 0, 0, 0.5) 72%,
      transparent 100%
    );
    -webkit-mask-image: linear-gradient(
      180deg,
      transparent 0%,
      rgba(0, 0, 0, 0.5) 18%,
      rgba(0, 0, 0, 0.85) 42%,
      rgba(0, 0, 0, 0.5) 72%,
      transparent 100%
    );
  }
  .tools__bridge-row { white-space: pre; overflow: hidden; }

  .tools__head {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2.5rem;
  }
  .tools__headRow {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .tools__more {
    font-family: var(--font-mono);
    font-size: 0.74rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    transition: color var(--duration-hover) var(--ease-default);
  }
  .tools__more:hover { color: var(--accent-soft); }
  .tools__title {
    font-family: var(--font-display);
    font-size: clamp(2.2rem, 4.4vw, 3.4rem);
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.01em;
    color: var(--text);
    margin: 0;
  }

  .tools__grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 2rem;
  }
  @media (min-width: 640px) { .tools__grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1100px) { .tools__grid { grid-template-columns: repeat(3, 1fr); } }

  .tools__card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: #000;
    color: var(--text);
    isolation: isolate;
    overflow: hidden;
    text-decoration: none;
    opacity: 0;
    transform: translateY(14px);
    animation: tools-rise 700ms var(--ease-emphasis) forwards;
    animation-delay: calc(var(--idx, 0) * 100ms + 120ms);
    transition:
      border-color var(--duration-hover) var(--ease-default),
      transform var(--duration-hover) var(--ease-default),
      box-shadow var(--duration-hover) var(--ease-default);
  }
  .tools__card:hover {
    border-color: var(--line-bright);
    transform: translateY(-4px);
    box-shadow: 0 20px 52px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(0, 255, 65, 0.12);
  }
  .tools__card:hover .tools__video {
    filter: brightness(1.05) saturate(1);
    transform: scale(1.025);
  }
  .tools__card:hover .tools__corner { opacity: 0.85; transform: translate(0, 0); }

  .tools__corner {
    position: absolute;
    top: 0.75rem;
    right: 0.85rem;
    z-index: 2;
    opacity: 0.9;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.85));
    transform: translate(3px, -1px);
    transition:
      opacity var(--duration-hover) var(--ease-default),
      transform var(--duration-hover) var(--ease-default);
    pointer-events: none;
    z-index: 2;
    mix-blend-mode: screen;
  }

  .tools__videoWrap {
    position: relative;
    margin: 0.75rem 0.75rem 0;
    border-radius: 10px;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    background: #000;
    isolation: isolate;
  }

  .tools__video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #000;
    filter: brightness(0.82) saturate(0.65) contrast(1.08);
    transition:
      filter var(--duration-hover) var(--ease-default),
      transform 600ms var(--ease-default);
  }

  .tools__videoDots {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle, rgba(187, 247, 208, 0.55) 1px, transparent 1px) 0 0 / 11px 11px,
      linear-gradient(135deg, rgba(74, 222, 128, 0.62) 0%, rgba(21, 128, 61, 0.56) 100%);
    mix-blend-mode: color;
    z-index: 1;
  }

  .tools__body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.45rem;
    padding: 1.4rem 1.4rem 1.75rem;
    flex: 1;
  }

  .tools__name {
    font-family: var(--font-display);
    font-size: clamp(1.24rem, 1.92vw, 1.6rem);
    font-weight: 700;
    color: var(--accent-soft);
    line-height: 1.05;
    letter-spacing: -0.02em;
  }

  .tools__tagline {
    font-family: var(--font-sans);
    font-size: clamp(0.95rem, 1.4vw, 1.1rem);
    color: var(--muted);
    line-height: 1.45;
  }

  .tools__features {
    list-style: none;
    padding: 0;
    margin: 0.4rem 0 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .tools__feat {
    font-family: var(--font-sans);
    font-size: clamp(0.82rem, 1.1vw, 0.95rem);
    color: var(--muted-soft);
    line-height: 1.35;
  }
  .tools__feat::before { content: "· "; color: var(--accent-soft); opacity: 0.6; }

  .tools__foot {
    margin-top: auto;
    padding-top: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
  }

  .tools__links {
    display: inline-flex;
    gap: 0.85rem;
  }

  .tools__link {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    transition: color var(--duration-hover) var(--ease-default),
      text-shadow var(--duration-hover) var(--ease-default);
  }
  .tools__link:hover {
    color: var(--accent-soft);
    text-shadow: 0 0 12px rgba(0, 255, 65, 0.45);
  }

  .tools__status {
    font-family: var(--font-mono);
    font-size: 0.66rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 0.2rem 0.65rem;
    border-radius: var(--radius-pill);
    border: 1px solid currentColor;
  }
  .tools__status--shipping { color: rgba(96, 220, 140, 0.8); }
  .tools__status--beta     { color: rgba(0, 255, 65, 0.8); }
  .tools__status--research { color: rgba(163, 230, 53, 0.8); }

  @keyframes tools-rise {
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .tools__card { animation: none; opacity: 1; transform: none; }
    .tools__bridge { display: none; }
  }
</style>
