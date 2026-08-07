<script lang="ts">
  /**
   * ReactionDiffusionDemo — lab drop "reaction-diffusion-08". Gray-Scott
   * reaction-diffusion on a fixed 200×150 grid (Du=1.0, Dv=0.5, feed≈0.0545,
   * kill≈0.062 — the coral / mitosis region). Two ping-pong Float32Arrays
   * hold u (substrate) and v (activator); a 3x3 stencil (corners 0.05,
   * edges 0.2, center -1) computes the Laplacian. The activator field is
   * rasterized to a W×H offscreen ImageData, then drawImage'd scaled with
   * smoothing for a soft, organic phosphor look. Moving the pointer paints
   * fresh activator that grows into splitting spots.
   *
   * Standalone on purpose — canvas 2D, no deps.
   *
   * Cost discipline: DPR capped at 1.5, grid fixed at 200×150 regardless of
   * canvas size (only the drawImage scale changes), paused while offscreen,
   * prefers-reduced-motion → the simulation is stepped synchronously ~300
   * times to grow a developed frame, then stops.
   */

  import { onMount } from "svelte";

  interface Props {
    class?: string;
  }
  let { class: className = "" }: Props = $props();

  let host: HTMLDivElement | null = null;

  const BG = "2, 5, 3";
  const GREEN = "0, 255, 65";

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

    // ── Fixed-size Gray-Scott grid ──
    const W = 200;
    const H = 150;
    const Du = 1.0;
    const Dv = 0.5;
    const FEED = 0.0545;
    const KILL = 0.062;

    // Ping-pong: current = (uA, vA), next = (uB, vB). Read current, write
    // next, then swap — never read and write the same array in one pass.
    let uA = new Float32Array(W * H);
    let vA = new Float32Array(W * H);
    let uB = new Float32Array(W * H);
    let vB = new Float32Array(W * H);

    // Offscreen raster (exactly W×H) + its ImageData buffer.
    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const offCtx = off.getContext("2d");
    if (!offCtx) return;
    const img = offCtx.createImageData(W, H);

    // Phosphor LUT: v∈[0,1] → RGB from BG (dark green-black) toward GREEN.
    const LUT = new Uint8ClampedArray(256 * 3);
    for (let i = 0; i < 256; i++) {
      const b = Math.pow(i / 255, 0.7); // gamma to lift mid-tones
      LUT[i * 3] = Math.round(2 + (0 - 2) * b);
      LUT[i * 3 + 1] = Math.round(5 + (255 - 5) * b);
      LUT[i * 3 + 2] = Math.round(3 + (65 - 3) * b);
    }

    // Stamp a disc of v=1 onto the CURRENT v buffer (pointer / seed painting).
    function stamp(cx: number, cy: number, r: number) {
      const r2 = r * r;
      const x0 = Math.max(0, Math.floor(cx - r));
      const x1 = Math.min(W - 1, Math.ceil(cx + r));
      const y0 = Math.max(0, Math.floor(cy - r));
      const y1 = Math.min(H - 1, Math.ceil(cy + r));
      for (let y = y0; y <= y1; y++) {
        const dy = y - cy;
        const row = y * W;
        for (let x = x0; x <= x1; x++) {
          const dx = x - cx;
          if (dx * dx + dy * dy <= r2) vA[row + x] = 1;
        }
      }
    }

    // Seed once when buffers are allocated: u=1, v=0 everywhere, then a few
    // v=1 blobs so the pattern is alive immediately.
    function seed() {
      uA.fill(1);
      vA.fill(0);
      uB.fill(1);
      vB.fill(0);
      stamp(W / 2, H / 2, 8);
      for (let i = 0; i < 6; i++) {
        stamp(10 + Math.random() * (W - 20), 10 + Math.random() * (H - 20), 5 + Math.random() * 4);
      }
    }

    // One Gray-Scott substep. Clamped (zero-gradient) edges for stability.
    function step() {
      for (let y = 0; y < H; y++) {
        const yu = y === 0 ? 0 : y - 1;
        const yd = y === H - 1 ? H - 1 : y + 1;
        const row = y * W;
        const rowu = yu * W;
        const rowd = yd * W;
        for (let x = 0; x < W; x++) {
          const xl = x === 0 ? 0 : x - 1;
          const xr = x === W - 1 ? W - 1 : x + 1;

          const uc = uA[row + x];
          const lapU =
            -uc +
            0.2 * (uA[row + xl] + uA[row + xr] + uA[rowu + x] + uA[rowd + x]) +
            0.05 * (uA[rowu + xl] + uA[rowu + xr] + uA[rowd + xl] + uA[rowd + xr]);

          const vc = vA[row + x];
          const lapV =
            -vc +
            0.2 * (vA[row + xl] + vA[row + xr] + vA[rowu + x] + vA[rowd + x]) +
            0.05 * (vA[rowu + xl] + vA[rowu + xr] + vA[rowd + xl] + vA[rowd + xr]);

          const uvv = uc * vc * vc;
          let nu = uc + (Du * lapU - uvv + FEED * (1 - uc));
          let nv = vc + (Dv * lapV + uvv - (KILL + FEED) * vc);
          if (nu < 0) nu = 0;
          else if (nu > 1) nu = 1;
          if (nv < 0) nv = 0;
          else if (nv > 1) nv = 1;

          uB[row + x] = nu;
          vB[row + x] = nv;
        }
      }
      const tu = uA;
      uA = uB;
      uB = tu;
      const tv = vA;
      vA = vB;
      vB = tv;
    }

    function render() {
      const data = img.data;
      for (let i = 0; i < W * H; i++) {
        let vi = (vA[i] * 255) | 0;
        if (vi > 255) vi = 255;
        const li = vi * 3;
        const j = i * 4;
        data[j] = LUT[li];
        data[j + 1] = LUT[li + 1];
        data[j + 2] = LUT[li + 2];
        data[j + 3] = 255;
      }
      offCtx.putImageData(img, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(off, 0, 0, W, H, 0, 0, w, h);
    }

    // 2 substeps per frame for stability.
    function frame() {
      step();
      step();
      render();
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
      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, 0, w, h);
      render(); // grid persists across resizes; just redraw at new scale
    }

    seed();
    resize();

    if (reduced) {
      // Grow a developed pattern synchronously, render once, and stop.
      for (let k = 0; k < 300; k++) step();
      render();
    } else {
      const tick = () => {
        if (visible) frame();
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }

    // ── Pointer reactivity: paint activator (v=1) onto the grid ──
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const gx = ((e.clientX - r.left) / r.width) * W;
      const gy = ((e.clientY - r.top) / r.height) * H;
      stamp(gx, gy, 6);
    };
    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const gx = ((e.clientX - r.left) / r.width) * W;
      const gy = ((e.clientY - r.top) / r.height) * H;
      stamp(gx, gy, 6);
    };
    if (!reduced) {
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerdown", onDown);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) render();
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
      el.removeEventListener("pointerdown", onDown);
      canvas.remove();
    };
  });
</script>

<div bind:this={host} class={`reaction-diffusion ${className}`} aria-hidden="true"></div>

<style>
  .reaction-diffusion {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 45%, rgba(0, 255, 65, 0.04), transparent 65%),
      #020503;
    cursor: crosshair;
  }
  .reaction-diffusion :global(canvas) {
    display: block;
  }
</style>
