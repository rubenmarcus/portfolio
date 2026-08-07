<script lang="ts">
  /**
   * PhosphorFireDemo — lab drop 016. The classic Doom fire algorithm in
   * phosphor green: a fixed low-res heat grid whose bottom row is stoked
   * every frame; each step a cell inherits the heat of a jittered cell below
   * minus a random decay, so flames rise, wobble, and cool. Rendered through
   * a black → green → bright ramp with baked-in scanline darkening, upscaled
   * chunky (no smoothing). The pointer stirs the embers — moving it injects
   * heat blobs that flare into new tongues of fire.
   *
   * Standalone on purpose — canvas 2D, no deps.
   *
   * Cost discipline: DPR capped at 1.5, fixed grid (~150 cols, height from
   * aspect) blitted through an ImageData and upscaled, paused while
   * offscreen, prefers-reduced-motion → the sim is stepped ~90 times
   * synchronously to compose a static frame.
   */

  import { onMount } from "svelte";

  interface Props {
    class?: string;
  }
  let { class: className = "" }: Props = $props();

  let host: HTMLDivElement | null = null;

  onMount(() => {
    if (!host) return;
    const el = host;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    el.appendChild(canvas);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let w = 0;
    let h = 0;
    let rafId = 0;
    let visible = true;

    // ── Phosphor palette: black → deep green → #00ff41 → bright → white ──
    const PAL = new Uint8ClampedArray(256 * 3);
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      let r: number, g: number, b: number;
      if (t < 0.45) {
        const k = t / 0.45;
        r = 2 + (0 - 2) * k;
        g = 5 + (255 - 5) * k;
        b = 3 + (65 - 3) * k;
      } else if (t < 0.8) {
        const k = (t - 0.45) / 0.35;
        r = 0 + (164 - 0) * k;
        g = 255;
        b = 65 + (190 - 65) * k;
      } else {
        const k = (t - 0.8) / 0.2;
        r = 164 + (235 - 164) * k;
        g = 255;
        b = 190 + (245 - 190) * k;
      }
      PAL[i * 3] = r;
      PAL[i * 3 + 1] = g;
      PAL[i * 3 + 2] = b;
    }

    // ── Fixed heat grid ──
    const W = 150;
    let H = 110;
    let heat = new Uint8Array(0);

    const gridCanvas = document.createElement("canvas");
    let gctx: CanvasRenderingContext2D | null = null;
    let imageData: ImageData | null = null;

    function alloc() {
      H = Math.max(60, Math.round(W * (h / Math.max(1, w))));
      heat = new Uint8Array(W * H);
      gridCanvas.width = W;
      gridCanvas.height = H;
      gctx = gridCanvas.getContext("2d");
      imageData = gctx ? gctx.createImageData(W, H) : null;
    }

    // Doom fire spread: each cell takes heat from a jittered cell below,
    // minus decay. Bottom row is the fuel line.
    function step() {
      const fuelBase = (H - 1) * W;
      for (let x = 0; x < W; x++) {
        heat[fuelBase + x] = 180 + ((Math.random() * 75) | 0);
      }
      for (let y = 0; y < H - 1; y++) {
        const row = y * W;
        const below = row + W;
        for (let x = 0; x < W; x++) {
          const jit = (Math.random() * 3) | 0; // 0..2 → -1..1
          const src = below + ((x + jit - 1 + W) % W);
          const decay = (Math.random() * 3) | 0;
          const v = heat[src] - decay;
          heat[row + x] = v > 0 ? v : 0;
        }
      }
    }

    // Pointer stirs: inject a heat blob at grid coords.
    function stir(gx: number, gy: number) {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const x = gx + dx;
          const y = gy + dy;
          if (x < 0 || x >= W || y < 0 || y >= H) continue;
          const f = 1 - Math.hypot(dx, dy) / 3;
          if (f <= 0) continue;
          const i = y * W + x;
          const v = heat[i] + 200 * f;
          heat[i] = v > 255 ? 255 : v;
        }
      }
    }

    function render() {
      if (!gctx || !imageData) return;
      const data = imageData.data;
      for (let y = 0; y < H; y++) {
        const row = y * W;
        const scan = y % 2 === 0 ? 0.82 : 1; // baked-in scanlines
        for (let x = 0; x < W; x++) {
          const i = heat[row + x];
          const p = (row + x) * 4;
          data[p] = PAL[i * 3] * scan;
          data[p + 1] = PAL[i * 3 + 1] * scan;
          data[p + 2] = PAL[i * 3 + 2] * scan;
          data[p + 3] = 255;
        }
      }
      gctx.putImageData(imageData, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false; // chunky phosphor pixels
      ctx.drawImage(gridCanvas, 0, 0, w, h);
    }

    function resize() {
      const r = el.getBoundingClientRect();
      w = Math.max(1, Math.floor(r.width));
      h = Math.max(1, Math.floor(r.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#020503";
      ctx.fillRect(0, 0, w, h);
      alloc();
    }

    resize();
    const tick = () => {
      if (visible) {
        step();
        render();
      }
      rafId = requestAnimationFrame(tick);
    };
    if (reduced) {
      // Compose a static frame: let the fire reach steady state, draw once.
      for (let k = 0; k < 90; k++) step();
      render();
    } else {
      rafId = requestAnimationFrame(tick);
    }

    // Pointer: stir heat blobs into the grid while moving.
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const gx = Math.floor(((e.clientX - r.left) / r.width) * W);
      const gy = Math.floor(((e.clientY - r.top) / r.height) * H);
      stir(gx, gy);
    };
    if (!reduced) {
      el.addEventListener("pointermove", onMove);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) {
        for (let k = 0; k < 90; k++) step();
        render();
      }
    });
    ro.observe(el);

    const vio = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
      },
      { threshold: 0 },
    );
    vio.observe(el);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      vio.disconnect();
      el.removeEventListener("pointermove", onMove);
      canvas.remove();
    };
  });
</script>

<div bind:this={host} class={`phosphor-fire ${className}`} aria-hidden="true"></div>

<style>
  .phosphor-fire {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: #020503;
    cursor: crosshair;
  }
  .phosphor-fire :global(canvas) {
    display: block;
  }
</style>
