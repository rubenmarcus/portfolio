<script lang="ts">
  /**
   * Ordered-dither background — the blog page's generative identity.
   *
   * Renders a static Bayer-matrix (8×8) ordered dither of a coarse value-noise
   * field: terminal-green dots whose density follows the noise, on near-black.
   * Drawn once per resize (no animation loop), so it's effectively free and
   * inherently reduced-motion safe.
   */

  import { onMount } from "svelte";

  interface Props {
    /** CSS color used for the dither dots (alpha is scaled per-dot). */
    color?: string;
    /** Dither cell size in CSS px. */
    cell?: number;
    /** Master opacity multiplier. */
    opacity?: number;
    class?: string;
  }

  let {
    color = "0, 255, 65",
    cell = 5,
    opacity = 0.5,
    class: className = "",
  }: Props = $props();

  let wrapper: HTMLDivElement | null = null;
  let canvas: HTMLCanvasElement | null = null;

  // Bayer 8×8 threshold matrix, normalized to 0..1
  const BAYER = (() => {
    const m = [
      0, 32, 8, 40, 2, 34, 10, 42,
      48, 16, 56, 24, 50, 18, 58, 26,
      12, 44, 4, 36, 14, 46, 6, 38,
      60, 28, 52, 20, 62, 30, 54, 22,
      3, 35, 11, 43, 1, 33, 9, 41,
      51, 19, 59, 27, 49, 17, 57, 25,
      15, 47, 7, 39, 13, 45, 5, 37,
      63, 31, 55, 23, 61, 29, 53, 21,
    ];
    return m.map((v) => (v + 0.5) / 64);
  })();

  // Deterministic hash → smooth value noise
  function hash(ix: number, iy: number): number {
    let h = (ix * 374761393 + iy * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function smooth(t: number): number {
    return t * t * (3 - 2 * t);
  }
  function valueNoise(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = smooth(x - ix);
    const fy = smooth(y - iy);
    const a = hash(ix, iy);
    const b = hash(ix + 1, iy);
    const c = hash(ix, iy + 1);
    const d = hash(ix + 1, iy + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }

  function draw() {
    if (!canvas || !wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    const cols = Math.ceil(w / cell);
    const rows = Math.ceil(h / cell);
    const noiseScale = 5.5 / Math.max(cols, 1); // ~5–6 noise features across width

    const dotR = Math.max(0.6, cell * 0.24);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Two octaves of value noise for a softer, cloudier field
        const n =
          valueNoise(c * noiseScale * 8, r * noiseScale * 8) * 0.65 +
          valueNoise(c * noiseScale * 22 + 40, r * noiseScale * 22 + 40) * 0.35;
        const threshold = BAYER[(r % 8) * 8 + (c % 8)]!;
        // Ordered dither: dot shows where the field beats the Bayer threshold
        if (n * 0.85 < threshold) continue;
        const strength = Math.min(1, (n * 0.85 - threshold) * 2.2);
        const a = (0.05 + strength * 0.22) * opacity;
        ctx.fillStyle = `rgba(${color}, ${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(c * cell + cell / 2, r * cell + cell / 2, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  onMount(() => {
    draw();
    const ro = new ResizeObserver(() => draw());
    if (wrapper) ro.observe(wrapper);
    return () => ro.disconnect();
  });
</script>

<div bind:this={wrapper} class={`dither-bg ${className}`} aria-hidden="true">
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .dither-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    mask-image: radial-gradient(ellipse at 50% 32%, #000 0%, rgba(0, 0, 0, 0.55) 55%, transparent 85%);
    -webkit-mask-image: radial-gradient(ellipse at 50% 32%, #000 0%, rgba(0, 0, 0, 0.55) 55%, transparent 85%);
  }
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
