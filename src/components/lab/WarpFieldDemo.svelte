<script lang="ts">
  /**
   * WarpFieldDemo — lab drop 013. A starfield warp: particles stream outward
   * from a vanishing point, each drawn as a speed line between its previous
   * and current projection. The pointer steers the warp — the vanishing
   * point eases toward it and the star flow bends accordingly. Depth (z)
   * drives both speed and brightness.
   *
   * Standalone on purpose — canvas 2D, no deps.
   *
   * Cost discipline: DPR capped at 1.5, star count scaled to card area,
   * paused while offscreen, prefers-reduced-motion → the field is stepped
   * synchronously a few times to compose a static frame of streaks.
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

    // ── Stars: (x, y) in [-1, 1]², z depth in (0, 1] ──
    let N = 0;
    let sx = new Float32Array(0);
    let sy = new Float32Array(0);
    let sz = new Float32Array(0);

    function spawn(i: number, deep: boolean) {
      sx[i] = Math.random() * 2 - 1;
      sy[i] = Math.random() * 2 - 1;
      sz[i] = deep ? 0.2 + Math.random() * 0.8 : 1;
    }

    function alloc() {
      N = Math.round(Math.min(750, Math.max(320, (w * h) / 620)));
      sx = new Float32Array(N);
      sy = new Float32Array(N);
      sz = new Float32Array(N);
      for (let i = 0; i < N; i++) spawn(i, true);
    }

    // Vanishing point — eased toward the pointer, drifting home otherwise.
    let cx = 0;
    let cy = 0;
    let tx = 0;
    let ty = 0;

    const SPEED = 0.012; // z decrement per frame
    const FADE = 0.34; // background fade (streaks carry the motion)

    function frame() {
      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgba(${BG}, ${FADE})`;
      ctx.fillRect(0, 0, w, h);

      const f = Math.min(w, h) * 0.52; // projection scale
      const dim = new Path2D();
      const bright = new Path2D();
      let drewBright = false;

      for (let i = 0; i < N; i++) {
        const z0 = sz[i];
        const z1 = z0 - SPEED * (0.35 + (1 - z0));
        if (z1 < 0.06) {
          spawn(i, false);
          continue; // no streak across the canvas on respawn
        }
        sz[i] = z1;

        const x0 = cx + (sx[i] / z0) * f;
        const y0 = cy + (sy[i] / z0) * f;
        const x1 = cx + (sx[i] / z1) * f;
        const y1 = cy + (sy[i] / z1) * f;
        if ((x0 < -40 || x0 > w + 40 || y0 < -40 || y0 > h + 40) && z0 > 0.5) {
          continue; // far offscreen tail — skip until it swings back in
        }

        if (z1 < 0.35) {
          bright.moveTo(x0, y0);
          bright.lineTo(x1, y1);
          drewBright = true;
        } else {
          dim.moveTo(x0, y0);
          dim.lineTo(x1, y1);
        }
      }

      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${GREEN}, 0.3)`;
      ctx.stroke(dim);
      if (drewBright) {
        ctx.lineWidth = 1.3;
        ctx.strokeStyle = `rgba(${BRIGHT}, 0.75)`;
        ctx.stroke(bright);
      }
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
      cx = tx = w / 2;
      cy = ty = h / 2;
      alloc();
    }

    resize();
    const tick = () => {
      if (visible) frame();
      rafId = requestAnimationFrame(tick);
    };
    if (reduced) {
      // Compose a static frame: a few steps so streaks have length.
      for (let k = 0; k < 12; k++) frame();
    } else {
      rafId = requestAnimationFrame(tick);
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
    };
    const onLeave = () => {
      tx = w / 2;
      ty = h / 2;
    };
    if (!reduced) {
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) for (let k = 0; k < 12; k++) frame();
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
      el.removeEventListener("pointerleave", onLeave);
      canvas.remove();
    };
  });
</script>

<div bind:this={host} class={`warp-field ${className}`} aria-hidden="true"></div>

<style>
  .warp-field {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 50%, rgba(0, 255, 65, 0.04), transparent 68%),
      #020503;
    cursor: crosshair;
  }
  .warp-field :global(canvas) {
    display: block;
  }
</style>
