<script lang="ts">
  /**
   * Availability marquee — slim terminal strip directly under the hero.
   * Infinite CSS-scroll loop, monospace terminal green on near-black with
   * 1px green hairlines. Pauses on hover; static when the user prefers
   * reduced motion. The track is duplicated so translateX(-50%) loops
   * seamlessly.
   */

  interface Props {
    lang?: string;
  }
  let { lang = "en" }: Props = $props();
  const pt = lang.startsWith("pt");

  const ITEMS_EN = [
    "AVAILABLE FOR FULL-TIME ROLES",
    "OPEN TO FREELANCE CONTRACTS",
    "SENIOR PRODUCT ENGINEER · AGENTIC AI",
    "AI AGENTS · LLM TOOLING · EVALS",
    "NEXT.JS · TYPESCRIPT · REACT",
    "BASED IN LISBON · REMOTE WORLDWIDE",
  ];

  const ITEMS_PT = [
    "DISPONÍVEL PARA VAGAS FULL-TIME",
    "ABERTO A CONTRATOS FREELANCE",
    "SENIOR PRODUCT ENGINEER · AGENTIC AI",
    "AI AGENTS · LLM TOOLING · EVALS",
    "NEXT.JS · TYPESCRIPT · REACT",
    "EM LISBOA · REMOTO PARA O MUNDO",
  ];

  const items = $derived(pt ? ITEMS_PT : ITEMS_EN);
</script>

<div class="marquee-band" aria-label="Availability">
  <div class="marquee-band__track">
    {#each [0, 1] as copy (copy)}
      <div class="marquee-band__group" aria-hidden={copy === 1}>
        {#each items as item, i (i)}
          <span class="marquee-band__item">
            {#if item.startsWith("AVAILABLE") || item.startsWith("DISPONÍVEL")}
              <span class="marquee-band__dot" aria-hidden="true"></span>
            {/if}
            {item}
          </span>
          <span class="marquee-band__sep" aria-hidden="true">✦</span>
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  .marquee-band {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 32px;
    display: flex;
    align-items: center;
    z-index: calc(var(--z-nav, 50) + 1);
    overflow: hidden;
    background: #010603;
    border-bottom: 1px solid rgba(0, 255, 65, 0.35);
    padding-block: 0;
    /* Fade both edges so items enter/exit softly — and so the frozen
       reduced-motion frame never ends on a hard mid-word cut. */
    mask-image: linear-gradient(90deg, transparent 0, #000 2.5%, #000 97.5%, transparent 100%);
    -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 2.5%, #000 97.5%, transparent 100%);
  }

  .marquee-band__track {
    display: flex;
    width: max-content;
    animation: marquee-band-scroll 30s linear infinite;
  }
  .marquee-band:hover .marquee-band__track {
    animation-play-state: paused;
  }

  .marquee-band__group {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .marquee-band__item {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--accent);
    text-shadow: 0 0 12px rgba(0, 255, 65, 0.35);
    white-space: nowrap;
  }

  .marquee-band__sep {
    margin-inline: 1.6rem;
    color: var(--accent-deep);
    font-size: 0.6rem;
  }

  /* Pulsing availability dot */
  .marquee-band__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 8px rgba(0, 255, 65, 0.8);
    animation: marquee-band-pulse 1.8s ease-in-out infinite;
  }

  @keyframes marquee-band-scroll {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  @keyframes marquee-band-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.35; transform: scale(0.8); }
  }

  @media (prefers-reduced-motion: reduce) {
    .marquee-band__track { animation: none; }
    .marquee-band__dot { animation: none; }
  }
</style>
