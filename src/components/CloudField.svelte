<script lang="ts">
  /**
   * Slowly-drifting "cloud" blobs rendered as overlapping additive
   * radial gradients on a Canvas 2D context. Pure Canvas, no shaders — keeps
   * the cost low while reading as the same kind of atmospheric drift the
   * quantum-website FBM cloud shader produces.
   */

  import { onMount } from "svelte";

  interface Props {
    /** Class on wrapper. */
    class?: string;
    /** Number of cloud blobs. */
    blobs?: number;
    /** Color (rgba string, 1 alpha — actual alpha picked per blob). */
    color?: string;
  }

  let {
    class: className = "",
    blobs = 6,
    color = "rgba(120, 185, 235, 1)",
  }: Props = $props();

  type Blob = {
    x: number; y: number; // 0–1 (normalized)
    r: number;            // radius in px scale factor
    speedX: number;
    speedY: number;
    phase: number;
    alpha: number;
  };

  let canvasEl: HTMLCanvasElement | null = $state(null);
  let context: CanvasRenderingContext2D | null = null;
  let width = 0, height = 0, dpr = 1;
  let rafId = 0;
  let resizeRafId = 0;
  let mobileMode = false;
  let blobList: Blob[] = [];

  function rgba(base: string, a: number): string {
    return base.replace(/,\s*[\d.]+\)$/, `, ${a.toFixed(3)})`);
  }

  function resize() {
    if (!canvasEl) return;
    mobileMode = window.matchMedia("(max-width: 767px)").matches;
    dpr = Math.min(window.devicePixelRatio || 1, mobileMode ? 1.3 : 1.6);
    width = canvasEl.clientWidth;
    height = canvasEl.clientHeight;
    canvasEl.width = Math.max(1, Math.floor(width * dpr));
    canvasEl.height = Math.max(1, Math.floor(height * dpr));
    context = canvasEl.getContext("2d", { alpha: true });
    if (context) context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function init() {
    const n = mobileMode ? Math.max(3, Math.floor(blobs / 2)) : blobs;
    blobList = [];
    for (let i = 0; i < n; i++) {
      blobList.push({
        x: Math.random(),
        y: Math.random(),
        r: 0.32 + Math.random() * 0.38,
        speedX: (Math.random() - 0.5) * 0.012,
        speedY: (Math.random() - 0.5) * 0.008,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.06 + Math.random() * 0.1,
      });
    }
  }

  function frame(time: number) {
    if (!context || width === 0 || height === 0) {
      rafId = requestAnimationFrame(frame);
      return;
    }
    context.clearRect(0, 0, width, height);

    const t = time * 0.001;
    for (const b of blobList) {
      // Slow drift wraparound
      b.x = (b.x + b.speedX * 0.4 + 1) % 1;
      b.y = (b.y + b.speedY * 0.4 + 1) % 1;

      // Position with subtle wobble
      const wobX = Math.sin(t * 0.3 + b.phase) * 0.04;
      const wobY = Math.cos(t * 0.27 + b.phase * 0.7) * 0.04;

      const px = (b.x + wobX) * width;
      const py = (b.y + wobY) * height;
      const radius = b.r * Math.max(width, height);

      const grad = context.createRadialGradient(px, py, 0, px, py, radius);
      const a = b.alpha * (0.85 + 0.15 * Math.sin(t * 0.4 + b.phase));
      grad.addColorStop(0, rgba(color, a));
      grad.addColorStop(0.55, rgba(color, a * 0.25));
      grad.addColorStop(1, rgba(color, 0));
      context.fillStyle = grad;
      context.fillRect(0, 0, width, height);
    }

    rafId = requestAnimationFrame(frame);
  }

  function onResize() {
    cancelAnimationFrame(resizeRafId);
    resizeRafId = requestAnimationFrame(() => {
      resize();
      init();
    });
  }

  onMount(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resize();
    init();
    if (!reduced) rafId = requestAnimationFrame(frame);
    else if (context) frame(0); // single static frame
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(resizeRafId);
      window.removeEventListener("resize", onResize);
    };
  });
</script>

<canvas bind:this={canvasEl} class={`cloud-field ${className}`} aria-hidden="true"></canvas>

<style>
  .cloud-field {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
    mix-blend-mode: screen;
  }
</style>
