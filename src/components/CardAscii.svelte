<script lang="ts">
  /**
   * Small procedural ASCII decoration for cards.
   * Deterministic by seed — same input always renders the same pattern.
   * One glyph swaps every 1.6s for subtle "alive" feel.
   * Skips animation entirely on reduced-motion devices.
   */

  import { onMount } from "svelte";

  interface Props {
    seed?: string;
    /** Grid width in characters. */
    cols?: number;
    /** Grid height in characters. */
    rows?: number;
    /** Tint color (CSS string). */
    color?: string;
    /** Variant: noise (sparse field), block (denser block art), wave (sin-wave). */
    variant?: "noise" | "block" | "wave";
    /** Class on wrapping element. */
    class?: string;
  }

  let {
    seed = "0",
    cols = 12,
    rows = 5,
    color = "rgba(143, 169, 255, 0.55)",
    variant = "noise",
    class: className = "",
  }: Props = $props();

  // Deterministic PRNG (mulberry32) seeded from a string
  function hashString(s: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function rng(seedNum: number) {
    let a = seedNum >>> 0;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const NOISE_GLYPHS = " ·-+:o*x#@";
  const BLOCK_GLYPHS = " ░▒▓█";
  const WAVE_GLYPHS  = " .-~=*+";

  const r = rng(hashString(seed));
  let cells = $state<string[]>([]);
  let visible = $state(true);

  function init() {
    const out: string[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let g = " ";
        if (variant === "noise") {
          const v = r();
          g = v < 0.55 ? " " : NOISE_GLYPHS[Math.floor(v * NOISE_GLYPHS.length)] ?? " ";
        } else if (variant === "block") {
          const v = r();
          g = BLOCK_GLYPHS[Math.floor(v * BLOCK_GLYPHS.length)] ?? " ";
        } else if (variant === "wave") {
          const t = x / cols;
          const yNorm = y / rows;
          const w = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 + yNorm * 1.3);
          const v = w * (0.5 + r() * 0.6);
          g = WAVE_GLYPHS[Math.min(WAVE_GLYPHS.length - 1, Math.floor(v * WAVE_GLYPHS.length))] ?? " ";
        }
        out.push(g);
      }
    }
    cells = out;
  }

  init();

  let el: HTMLDivElement | null = $state(null);

  onMount(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    // Pause when off-screen
    let io: IntersectionObserver | null = null;
    if (el) {
      io = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0 },
      );
      io.observe(el);
    }

    // Pick a glyph palette to morph through
    let palette: string;
    if (variant === "block") palette = BLOCK_GLYPHS;
    else if (variant === "wave") palette = WAVE_GLYPHS;
    else palette = NOISE_GLYPHS;

    // Swap a couple of glyphs every ~1.6s for subtle motion
    const morphRng = rng(hashString(seed) ^ 0x9e3779b9);
    const tick = setInterval(() => {
      if (!visible || cells.length === 0) return;
      const swaps = 1 + Math.floor(morphRng() * 2);
      const next = [...cells];
      for (let i = 0; i < swaps; i++) {
        const idx = Math.floor(morphRng() * next.length);
        const g = palette[Math.floor(morphRng() * palette.length)] ?? " ";
        next[idx] = g;
      }
      cells = next;
    }, 1600);

    return () => {
      clearInterval(tick);
      io?.disconnect();
    };
  });
</script>

<div bind:this={el} class={`card-ascii ${className}`} aria-hidden="true" style:color>
  <pre
    class="card-ascii__grid"
    style:--cols={cols}
    style:--rows={rows}
  >{cells.join("")}</pre>
</div>

<style>
  .card-ascii {
    position: absolute;
    top: 0.7rem;
    right: 0.85rem;
    pointer-events: none;
    opacity: 0.85;
    transition: opacity var(--duration-hover) var(--ease-default), transform var(--duration-hover) var(--ease-default);
  }

  .card-ascii__grid {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 0.62rem;
    line-height: 1.05;
    letter-spacing: 0.08em;
    white-space: pre-wrap;
    word-break: break-all;
    /* Reflect grid shape — narrow band to right of card */
    width: calc(var(--cols, 12) * 0.45rem);
    text-shadow: 0 0 12px rgba(58, 109, 255, 0.25);
  }

  /* When inside a hovered card, the ASCII brightens + nudges */
  :global(.card:hover) .card-ascii,
  :global(.ai-card:hover) .card-ascii,
  :global(.support-card:hover) .card-ascii,
  :global(.contact-card:hover) .card-ascii,
  :global(.filter:hover) .card-ascii,
  :global(.skills-col:hover) .card-ascii,
  :global(.tool__features:hover) .card-ascii {
    opacity: 1;
    transform: translateX(-2px);
  }
</style>
