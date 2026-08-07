<script lang="ts">
  /**
   * DitherCover — blog post covers rendered through an ordered-dither
   * (Bayer 8×8) canvas filter, tinted terminal green. The dithered layer sits
   * on top of the full-color source; on hover it fades away to reveal color.
   *
   * If the post has no cover (or the remote image can't be sampled — CORS),
   * a dithered geometric pattern is synthesized from the post title hash, so
   * every card still gets a deterministic, on-palette visual.
   *
   * Guards: DPR capped at 2, renders once (and on resize) — no animation loop.
   */

  import { onMount } from "svelte";

  interface Props {
    src?: string;
    /** Seed text (post title) for the synthesized fallback pattern. */
    seed: string;
    alt?: string;
    class?: string;
    /** Invert the hover: real image at rest, dots on hover. */
    invert?: boolean;
  }
  let { src = "", seed, alt = "", class: className = "", invert = false }: Props = $props();

  // Classic Bayer 8×8, normalized to 0..1
  const BAYER = [
    0, 32, 8, 40, 2, 34, 10, 42,
    48, 16, 56, 24, 50, 18, 58, 26,
    12, 44, 4, 36, 14, 46, 6, 38,
    60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41,
    51, 19, 59, 27, 49, 17, 57, 25,
    15, 47, 7, 39, 13, 45, 5, 37,
    63, 31, 55, 23, 61, 29, 53, 21,
  ].map((v) => (v + 0.5) / 64);

  let host: HTMLDivElement | null = null;

  /** Deterministic PRNG from a string seed (mulberry32 over an FNV hash). */
  function seededRand(s: string) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h = Math.imul(h ^ (h >>> 15), h | 1);
      h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
      return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Synthesize an abstract geometric composition from the title hash. */
  function drawSynth(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const rand = seededRand(seed);
    ctx.fillStyle = "#040805";
    ctx.fillRect(0, 0, w, h);
    const palette = ["#00ff41", "#4ade80", "#f5f1ea", "#15803d"];
    const shapes = 7 + Math.floor(rand() * 5);
    for (let i = 0; i < shapes; i++) {
      const kind = rand();
      const x = rand() * w;
      const y = rand() * h;
      const size = (0.12 + rand() * 0.3) * Math.min(w, h);
      ctx.strokeStyle = palette[Math.floor(rand() * palette.length)];
      ctx.fillStyle = ctx.strokeStyle;
      ctx.globalAlpha = 0.16 + rand() * 0.3;
      ctx.lineWidth = Math.max(1, size * 0.04);
      if (kind < 0.35) {
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        rand() > 0.5 ? ctx.stroke() : ctx.fill();
      } else if (kind < 0.7) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (rand() - 0.5) * w * 0.6, y + (rand() - 0.5) * h * 0.6);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x + size / 2, y - size * 0.86);
        ctx.closePath();
        rand() > 0.5 ? ctx.stroke() : ctx.fill();
      }
    }
    // A few horizontal "code lines" for texture
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#4ade80";
    const lines = 3 + Math.floor(rand() * 3);
    for (let i = 0; i < lines; i++) {
      const y = h * (0.15 + rand() * 0.7);
      ctx.fillRect(w * 0.08, y, w * (0.2 + rand() * 0.4), Math.max(1.5, h * 0.012));
    }
    ctx.globalAlpha = 1;
  }

  onMount(() => {
    if (!host) return;
    const el = host;

    const ditherCanvas = document.createElement("canvas");
    ditherCanvas.className = "dither-cover__dither";
    const colorCanvas = document.createElement("canvas");
    colorCanvas.className = "dither-cover__color";
    const dctx = ditherCanvas.getContext("2d");
    const cctx = colorCanvas.getContext("2d");
    if (!dctx || !cctx) return;
    el.appendChild(colorCanvas);
    el.appendChild(ditherCanvas);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let img: HTMLImageElement | null = null;
    let imgOk = false;

    function render() {
      const r = el.getBoundingClientRect();
      const W = Math.max(1, Math.round(r.width));
      const H = Math.max(1, Math.round(r.height));
      for (const c of [ditherCanvas, colorCanvas]) {
        c.width = Math.round(W * dpr);
        c.height = Math.round(H * dpr);
        c.style.width = `${W}px`;
        c.style.height = `${H}px`;
      }
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // ── Color layer ──
      if (imgOk && img) {
        // cover-crop
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        const scale = Math.max(W / iw, H / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        cctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      } else {
        drawSynth(cctx, W, H);
      }

      // ── Dither layer: sample the color layer at halftone resolution ──
      const CELL = 5; // halftone cell pitch, CSS px
      const cols = Math.max(1, Math.floor(W / CELL));
      const rows = Math.max(1, Math.floor(H / CELL));
      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      octx.drawImage(colorCanvas, 0, 0, cols, rows);

      let data: Uint8ClampedArray;
      try {
        data = octx.getImageData(0, 0, cols, rows).data;
      } catch {
        // Tainted by the remote image — re-render both layers from the synth
        imgOk = false;
        cctx.setTransform(1, 0, 0, 1, 0, 0);
        cctx.clearRect(0, 0, colorCanvas.width, colorCanvas.height);
        cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawSynth(cctx, W, H);
        octx.clearRect(0, 0, cols, rows);
        octx.drawImage(colorCanvas, 0, 0, cols, rows);
        try {
          data = octx.getImageData(0, 0, cols, rows).data;
        } catch {
          return;
        }
      }

      dctx.clearRect(0, 0, W, H);
      dctx.fillStyle = "#020403";
      dctx.fillRect(0, 0, W, H);
      const dot = CELL - 1.6;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const l = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
          const t = BAYER[(y % 8) * 8 + (x % 8)];
          if (l <= t) continue;
          dctx.fillStyle = `rgba(0, 255, 65, ${(0.35 + l * 0.6).toFixed(3)})`;
          dctx.fillRect(x * CELL, y * CELL, dot, dot);
        }
      }
    }

    function tryLoadImage() {
      if (!src) return;
      const probe = new Image();
      probe.crossOrigin = "anonymous";
      probe.decoding = "async";
      probe.onload = () => {
        img = probe;
        imgOk = true;
        render();
      };
      probe.onerror = () => {
        imgOk = false;
        render(); // synth fallback
      };
      probe.src = src;
    }

    let resizeT: ReturnType<typeof setTimeout> | null = null;
    const ro = new ResizeObserver(() => {
      if (resizeT) clearTimeout(resizeT);
      resizeT = setTimeout(render, 160);
    });
    ro.observe(el);

    render(); // synth immediately, upgrade to the real cover if it loads
    tryLoadImage();

    return () => {
      ro.disconnect();
      if (resizeT) clearTimeout(resizeT);
    };
  });
</script>

<div bind:this={host} class={`dither-cover ${invert ? "dither-cover--invert" : ""} ${className}`} role="img" aria-label={alt}></div>

<style>
  .dither-cover {
    position: relative;
    overflow: hidden;
    border-radius: 10px;
    background: #020403;
    min-height: 100%;
  }
  .dither-cover :global(canvas) {
    position: absolute;
    inset: 0;
    display: block;
  }
  .dither-cover :global(.dither-cover__dither) {
    transition: opacity 420ms var(--ease-default);
  }
  .dither-cover:hover :global(.dither-cover__dither) {
    opacity: 0;
  }
  /* Inverted: the real cover rests in full view, dots wash in on hover */
  .dither-cover--invert :global(.dither-cover__dither) {
    opacity: 0;
  }
  .dither-cover--invert:hover :global(.dither-cover__dither) {
    opacity: 1;
  }
  @media (prefers-reduced-motion: reduce) {
    .dither-cover :global(.dither-cover__dither) {
      transition: none;
    }
  }
</style>
