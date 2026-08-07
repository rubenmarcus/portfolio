<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  interface Props {
    label?: string;
  }
  let { label }: Props = $props();

  const GLYPHS = ".:-=+*x?#@%/\\|<>{}[]()0123abcXYZ".split("");
  const CELL = 18;
  const BAND_ROWS = 5;

  let wrapper: HTMLDivElement | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let cleanup = () => {};

  onMount(() => {
    if (!canvas || !wrapper) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, cols = 0, rows = 0;
    let chars: number[] = [];
    let glitchAlpha = 0;
    let idleAlpha = 0.12;
    let raf = 0;
    let visible = false;
    let lastMorph = 0;

    const resize = () => {
      if (!canvas || !wrapper) return;
      w = wrapper.clientWidth;
      h = wrapper.clientHeight;
      canvas.width = w;
      canvas.height = h;
      cols = Math.floor(w / CELL) + 1;
      rows = Math.floor(h / CELL) + 1;
      chars = Array.from({ length: cols * rows }, () =>
        Math.random() < 0.6 ? Math.floor(Math.random() * GLYPHS.length) : -1,
      );
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;

      ctx.clearRect(0, 0, w, h);
      const totalAlpha = Math.max(idleAlpha, glitchAlpha);

      // Scramble faster during burst, slow idle morph otherwise
      if (glitchAlpha > 0.05) {
        const flood = Math.floor(chars.length * 0.5);
        for (let i = 0; i < flood; i++) {
          chars[Math.floor(Math.random() * chars.length)] = Math.floor(Math.random() * GLYPHS.length);
        }
      } else if (now - lastMorph > 120) {
        lastMorph = now;
        const swaps = Math.max(2, Math.floor(cols * rows * 0.003));
        for (let i = 0; i < swaps; i++) {
          const idx = Math.floor(Math.random() * chars.length);
          chars[idx] = Math.random() < 0.5 ? -1 : Math.floor(Math.random() * GLYPHS.length);
        }
      }

      ctx.font = `bold ${CELL}px "JetBrains Mono", monospace`;
      ctx.textBaseline = "top";

      const centerRow = rows / 2;
      const halfBand = BAND_ROWS / 2;

      for (let r = 0; r < rows; r++) {
        const rowDist = Math.abs(r - centerRow) / halfBand;
        if (rowDist > 1.0) continue;
        const rowFade = 1.0 - rowDist * rowDist;

        for (let c = 0; c < cols; c++) {
          const g = chars[r * cols + c];
          if (g === -1) continue;

          const hx = c / cols;
          const hFade = Math.min(1, hx / 0.06) * Math.min(1, (1 - hx) / 0.06);

          const wave = Math.abs(Math.sin((c / cols + now * 0.0006) * Math.PI * 5));
          const a = totalAlpha * rowFade * hFade * (0.35 + wave * 0.5);
          if (a < 0.012) continue;

          ctx.fillStyle = `rgba(74,222,128,${a.toFixed(3)})`;
          ctx.fillText(GLYPHS[g], c * CELL, r * CELL);
        }
      }

      if (glitchAlpha > 0) glitchAlpha *= 0.91;
    };
    raf = requestAnimationFrame(draw);

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        if (visible) glitchAlpha = 0.75;
      },
      { threshold: 0.1 },
    );
    io.observe(wrapper);

    cleanup = () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  });

  onDestroy(() => cleanup());
</script>

<div bind:this={wrapper} class="glitch-divider" aria-hidden="true">
  <canvas bind:this={canvas}></canvas>
  {#if label}
    <span class="glitch-divider__label">{label}</span>
  {/if}
</div>

<style>
  .glitch-divider {
    position: relative;
    width: 100%;
    height: 72px;
    margin-block: 1.25rem;
    overflow: hidden;
    /* Static anchor — with reduced motion the canvas never paints, and an
       invisible 120px strip read as dead scroll. A centered hairline keeps
       the divider present in every rendering mode. */
    background: linear-gradient(
      180deg,
      transparent calc(50% - 1px),
      rgba(0, 255, 65, 0.14) 50%,
      transparent calc(50% + 1px)
    );
  }

  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    mix-blend-mode: screen;
    pointer-events: none;
  }

  .glitch-divider__label {
    position: absolute;
    bottom: 0.6rem;
    right: var(--gutter-x, 1.5rem);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(74, 222, 128, 0.3);
    pointer-events: none;
  }
</style>
