<script lang="ts">
  /**
   * RippleDemo — lab drop 007. A 2D water surface simulated with the
   * discretized height-field wave equation on a FIXED downscaled grid
   * (220×160). Two Float32Array buffers ping-pong: each step a cell's next
   * height is the average of its four neighbours (latest frame) minus its own
   * previous height, damped a touch so ripples fade. Press + drag to drop
   * splashes; the wave fronts read as moving phosphor light.
   *
   * Standalone on purpose — canvas 2D, no deps.
   *
   * Cost discipline: DPR capped at 1.5, fixed grid (no per-pixel canvas fill —
   * heights blit through a W×H ImageData then upscale via drawImage), paused
   * while offscreen, prefers-reduced-motion → the sim is stepped ~140 times
   * synchronously to compose a static frame.
   */

  import { onMount } from "svelte";

  interface Props {
    class?: string;
  }
  let { class: className = "" }: Props = $props();

  let host: HTMLDivElement | null = null;

  const BG = "2, 5, 3";
  const GREEN = "0, 255, 65";
  const BRIGHT = "164, 255, 190";

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

    // ── Fixed simulation grid (does NOT scale with canvas area) ──
    const W = 220;
    const H = 160;
    const DAMP = 0.986;
    const BASE = 0.09; // ambient brightness so still water isn't pure black
    const GAIN = 0.0024; // height → brightness

    // Two buffers; `cur` always references the latest heights (rendered),
    // `old` references one frame behind. step() writes the next frame into
    // `old` (reading neighbours from `cur`, centre from `old` at the same
    // index — read-before-write, never aliased with neighbour reads) then
    // swaps the references.
    const buf0 = new Float32Array(W * H);
    const buf1 = new Float32Array(W * H);
    let cur = buf1;
    let old = buf0;

    // ── Offscreen grid surface (W×H), upscaled onto the visible canvas ──
    const gridCanvas = document.createElement("canvas");
    gridCanvas.width = W;
    gridCanvas.height = H;
    const gctx = gridCanvas.getContext("2d");
    if (!gctx) return;
    const imageData = gctx.createImageData(W, H);
    const data = imageData.data;

    function splash(gx: number, gy: number, radius: number, amplitude: number) {
      const cx = gx < 1 ? 1 : gx > W - 2 ? W - 2 : gx;
      const cy = gy < 1 ? 1 : gy > H - 2 ? H - 2 : gy;
      const r = radius;
      const r2 = r * r;
      for (let dy = -r; dy <= r; dy++) {
        const y = cy + dy;
        if (y < 1 || y > H - 2) continue;
        for (let dx = -r; dx <= r; dx++) {
          const x = cx + dx;
          if (x < 1 || x > W - 2) continue;
          const d2 = dx * dx + dy * dy;
          if (d2 > r2) continue;
          const falloff = Math.exp(-d2 / (r2 * 0.5));
          cur[y * W + x] += amplitude * falloff;
        }
      }
    }

    function seed() {
      buf0.fill(0);
      buf1.fill(0);
      splash(W >> 1, H >> 1, 4, 650);
    }

    function step() {
      // Interior pass; edges stay at their initialised 0 (absorbing boundary,
      // stable). Writes go into `old`; neighbour reads come from `cur`, centre
      // read from `old[i]` immediately before the write at the same index.
      for (let y = 1; y < H - 1; y++) {
        const row = y * W;
        for (let x = 1; x < W - 1; x++) {
          const i = row + x;
          const next =
            (cur[i - 1] + cur[i + 1] + cur[i - W] + cur[i + W]) * 0.5 - old[i];
          old[i] = next * DAMP;
        }
      }
      const t = cur;
      cur = old;
      old = t;
    }

    function render() {
      for (let i = 0, p = 0; i < W * H; i++, p += 4) {
        let b = BASE + cur[i] * GAIN;
        if (b < 0) b = 0;
        else if (b > 1) b = 1;
        // Phosphor ramp: BG → GREEN → BRIGHT.
        let r: number, g: number, bl: number;
        if (b < 0.5) {
          const t = b * 2;
          r = 2 + (0 - 2) * t;
          g = 5 + (255 - 5) * t;
          bl = 3 + (65 - 3) * t;
        } else {
          const t = (b - 0.5) * 2;
          r = 0 + (164 - 0) * t;
          g = 255;
          bl = 65 + (190 - 65) * t;
        }
        data[p] = r;
        data[p + 1] = g;
        data[p + 2] = bl;
        data[p + 3] = 255;
      }
      gctx.putImageData(imageData, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
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
      ctx.imageSmoothingEnabled = true;
      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, 0, w, h);
      // Grid is fixed; just wake the surface back up on reflow.
      seed();
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
      // Compose a static frame: evolve a seeded splash, then draw once.
      seed();
      for (let k = 0; k < 140; k++) step();
      render();
    } else {
      rafId = requestAnimationFrame(tick);
    }

    // ── Pointer reactivity: stamp a Gaussian bump while pressed ──
    let pressed = false;
    function stamp(e: PointerEvent) {
      const r = canvas.getBoundingClientRect();
      const fx = e.clientX - r.left;
      const fy = e.clientY - r.top;
      const gx = Math.floor((fx / r.width) * W);
      const gy = Math.floor((fy / r.height) * H);
      splash(gx, gy, 3, 420);
    }
    const onDown = (e: PointerEvent) => {
      pressed = true;
      stamp(e);
    };
    const onMove = (e: PointerEvent) => {
      if (pressed) stamp(e);
    };
    const onUp = () => {
      pressed = false;
    };
    if (!reduced) {
      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointerleave", onUp);
      window.addEventListener("pointerup", onUp);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) {
        seed();
        for (let k = 0; k < 140; k++) step();
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
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointerleave", onUp);
      window.removeEventListener("pointerup", onUp);
      canvas.remove();
    };
  });
</script>

<div bind:this={host} class={`ripple ${className}`} aria-hidden="true"></div>

<style>
  .ripple {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 50%, rgba(0, 255, 65, 0.03), transparent 70%),
      #020503;
    cursor: crosshair;
  }
  .ripple :global(canvas) {
    display: block;
  }
</style>
