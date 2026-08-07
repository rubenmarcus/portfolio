<script lang="ts">
  /**
   * VoronoiDriftDemo — lab drop 010. A slowly drifting Voronoi diagram drawn
   * as dotted cell borders: on a coarse dot grid, a dot lights up wherever
   * the two nearest seed distances are nearly equal (i.e. the point sits on
   * a cell boundary). Seeds wander on their own; while the pointer is inside,
   * the nearest seed is gently attracted toward it, dragging its cell along.
   *
   * Standalone on purpose — canvas 2D, no deps.
   *
   * Cost discipline: DPR capped at 1.5, seed count scaled to card area, the
   * border test runs on a 4px dot grid (not per-pixel), paused while
   * offscreen, prefers-reduced-motion → one static frame of the diagram.
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

    // ── Seeds drifting with wraparound ──
    interface Seed {
      x: number;
      y: number;
      vx: number;
      vy: number;
    }
    let seeds: Seed[] = [];

    function alloc() {
      const n = Math.round(Math.min(36, Math.max(18, (w * h) / 11000)));
      seeds = [];
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 0.08 + Math.random() * 0.22;
        seeds.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
        });
      }
    }

    // Pointer state — the nearest seed is attracted while active.
    let active = false;
    let mx = -1;
    let my = -1;

    const STEP = 4; // dot grid pitch (css px)
    const FADE = 0.32; // slight trail on the drifting dots

    function frame() {
      // Move seeds; wrap toroidally with a margin so cells slide in/out.
      let nearIdx = -1;
      let nearD2 = Infinity;
      for (let i = 0; i < seeds.length; i++) {
        const s = seeds[i];
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < -20) s.x += w + 40;
        else if (s.x > w + 20) s.x -= w + 40;
        if (s.y < -20) s.y += h + 40;
        else if (s.y > h + 20) s.y -= h + 40;

        if (active && mx >= 0) {
          const dx = s.x - mx;
          const dy = s.y - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < nearD2) {
            nearD2 = d2;
            nearIdx = i;
          }
        }
      }
      // Ease the nearest seed toward the pointer.
      if (nearIdx >= 0) {
        const s = seeds[nearIdx];
        s.x += (mx - s.x) * 0.06;
        s.y += (my - s.y) * 0.06;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgba(${BG}, ${FADE})`;
      ctx.fillRect(0, 0, w, h);

      // Dotted borders: for each grid point, compare the two nearest seed
      // distances. Close to equal → on a cell boundary. Two brightness
      // buckets (hard edge / soft halo) → two batched fills.
      const hard = new Path2D();
      const soft = new Path2D();
      const n = seeds.length;
      for (let gy = STEP / 2; gy < h; gy += STEP) {
        for (let gx = STEP / 2; gx < w; gx += STEP) {
          let d1 = Infinity;
          let d2 = Infinity;
          for (let i = 0; i < n; i++) {
            const dx = gx - seeds[i].x;
            const dy = gy - seeds[i].y;
            const d = dx * dx + dy * dy;
            if (d < d1) {
              d2 = d1;
              d1 = d;
            } else if (d < d2) {
              d2 = d;
            }
          }
          const edge = Math.sqrt(d2) - Math.sqrt(d1);
          if (edge < 1.3) {
            hard.rect(gx - 0.6, gy - 0.6, 1.3, 1.3);
          } else if (edge < 2.8) {
            soft.rect(gx - 0.5, gy - 0.5, 1.1, 1.1);
          }
        }
      }
      ctx.fillStyle = `rgba(${GREEN}, 0.16)`;
      ctx.fill(soft);
      ctx.fillStyle = `rgba(${GREEN}, 0.55)`;
      ctx.fill(hard);

      // Seeds as brighter dots.
      const sp = new Path2D();
      for (const s of seeds) sp.rect(s.x - 0.9, s.y - 0.9, 1.9, 1.9);
      ctx.fillStyle = `rgba(${BRIGHT}, 0.8)`;
      ctx.fill(sp);
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
      alloc();
    }

    resize();
    const tick = () => {
      if (visible) frame();
      rafId = requestAnimationFrame(tick);
    };
    if (reduced) {
      frame(); // one static frame of the diagram, then stop
    } else {
      rafId = requestAnimationFrame(tick);
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
      active = true;
    };
    const onLeave = () => {
      active = false;
      mx = -1;
      my = -1;
    };
    if (!reduced) {
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) frame();
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

<div bind:this={host} class={`voronoi-drift ${className}`} aria-hidden="true"></div>

<style>
  .voronoi-drift {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 50%, rgba(0, 255, 65, 0.03), transparent 70%),
      #020503;
    cursor: crosshair;
  }
  .voronoi-drift :global(canvas) {
    display: block;
  }
</style>
