<script lang="ts">
  import { onMount } from "svelte";

  interface Props {
    /** Pixel size of each grid cell. Smaller = denser. */
    cell?: number;
    /** Probability per cell of having any glyph at all (sparseness). */
    density?: number;
    /** How fast individual glyphs morph (per second). */
    morphRate?: number;
    /** Opacity of glyphs. 0–1. */
    opacity?: number;
    /** Whether the field reacts to the cursor (brightens near mouse). */
    reactive?: boolean;
    /** Tint color for glyphs (rgba string preferred). */
    color?: string;
    /** Class on the wrapping element. */
    class?: string;
  }

  let {
    cell = 18,
    density = 0.22,
    morphRate = 1.4,
    opacity = 0.42,
    reactive = true,
    color = "rgba(143, 169, 255, 1)",
    class: className = "",
  }: Props = $props();

  const GLYPHS = " .:-=+*x?#@%/\\|<>{}[]()0123abcXYZ".split("");

  let canvas: HTMLCanvasElement | null = null;
  let wrapper: HTMLDivElement | null = null;
  let ro: ResizeObserver | null = null;
  let io: IntersectionObserver | null = null;
  let rafId = 0;
  let visible = false;
  let cols = 0;
  let rows = 0;
  let chars: number[] = []; // index into GLYPHS, or -1 for empty
  let mouseX = -9999;
  let mouseY = -9999;
  let lastMorph = 0;

  function buildField(w: number, h: number) {
    cols = Math.floor(w / cell) + 1;
    rows = Math.floor(h / cell) + 1;
    chars = new Array(cols * rows);
    for (let i = 0; i < chars.length; i++) {
      chars[i] = Math.random() < density ? Math.floor(Math.random() * GLYPHS.length) : -1;
    }
  }

  function draw(now: number) {
    if (!canvas || !visible) {
      rafId = requestAnimationFrame(draw);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Periodic morph — swap a few chars
    if (now - lastMorph > 1000 / morphRate) {
      lastMorph = now;
      const swaps = Math.max(4, Math.floor(cols * rows * 0.004));
      for (let i = 0; i < swaps; i++) {
        const idx = Math.floor(Math.random() * chars.length);
        if (chars[idx] === -1 && Math.random() < density) {
          chars[idx] = Math.floor(Math.random() * GLYPHS.length);
        } else if (chars[idx] !== -1) {
          chars[idx] = Math.random() < 0.18 ? -1 : Math.floor(Math.random() * GLYPHS.length);
        }
      }
    }

    ctx.font = `${Math.floor(cell * 0.85)}px "JetBrains Mono", monospace`;
    ctx.textBaseline = "top";

    const dpr = window.devicePixelRatio || 1;
    const mxLocal = (mouseX - (canvas.getBoundingClientRect().left || 0)) * dpr;
    const myLocal = (mouseY - (canvas.getBoundingClientRect().top || 0)) * dpr;
    const haloR = 180 * dpr; // pixels
    const haloR2 = haloR * haloR;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const g = chars[idx];
        if (g === -1) continue;

        const px = c * cell * dpr;
        const py = r * cell * dpr;
        let alpha = opacity;

        if (reactive) {
          const dx = px - mxLocal;
          const dy = py - myLocal;
          const d2 = dx * dx + dy * dy;
          if (d2 < haloR2) {
            const t = 1 - d2 / haloR2;
            alpha = Math.min(1, opacity + t * 0.65);
          }
        }

        ctx.fillStyle = color.replace(/,\s*1\)$/, `, ${alpha.toFixed(3)})`);
        ctx.fillText(GLYPHS[g], px, py);
      }
    }

    rafId = requestAnimationFrame(draw);
  }

  function resize() {
    if (!canvas || !wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    buildField(canvas.width, canvas.height);
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(1, 1);
  }

  onMount(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      // Still paint a static field, but skip animation
      resize();
      const ctx = canvas?.getContext("2d");
      if (ctx && canvas) draw(0);
      return;
    }

    resize();
    ro = new ResizeObserver(() => resize());
    if (wrapper) ro.observe(wrapper);

    io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
      },
      { threshold: 0 },
    );
    if (wrapper) io.observe(wrapper);

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    if (reactive) window.addEventListener("mousemove", onMove, { passive: true });

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      ro?.disconnect();
      io?.disconnect();
      if (reactive) window.removeEventListener("mousemove", onMove);
    };
  });
</script>

<div bind:this={wrapper} class={`ascii-field ${className}`} aria-hidden="true">
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .ascii-field {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
