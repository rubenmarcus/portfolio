<script lang="ts">
  /**
   * FlowFieldDemo — lab drop 004. A few thousand particles advected through
   * a time-drifting curl-noise field (divergence-free, so the flow swirls
   * instead of clumping). Flicking the pointer through the canvas injects
   * a vortex scaled by pointer velocity; trails come from alpha-fade on the
   * previous frame, not per-particle history.
   *
   * Standalone on purpose — canvas 2D, no deps.
   *
   * Cost discipline: DPR capped at 1.5, particle count scaled to card area
   * (2.6k–3.8k), paused while offscreen, prefers-reduced-motion → the
   * simulation is stepped synchronously once to compose a static frame.
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

    // ── Field: hashed value-noise, curl via finite differences ──
    function hash(ix: number, iy: number): number {
      let n = (ix * 374761393 + iy * 668265263) | 0;
      n = Math.imul(n ^ (n >>> 13), 1274126177);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    }
    function vnoise(x: number, y: number): number {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const fx = x - ix;
      const fy = y - iy;
      const ux = fx * fx * (3 - 2 * fx);
      const uy = fy * fy * (3 - 2 * fy);
      const a = hash(ix, iy);
      const b = hash(ix + 1, iy);
      const c = hash(ix, iy + 1);
      const d = hash(ix + 1, iy + 1);
      return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
    }
    // Two octaves, drifting in opposite directions so the flow never settles.
    function field(x: number, y: number, t: number): number {
      return (
        vnoise(x * 0.0042 + t * 0.11, y * 0.0042 - t * 0.07) +
        0.5 * vnoise(x * 0.011 - t * 0.05, y * 0.011 + t * 0.09)
      );
    }

    // ── Particles ──
    let N = 0;
    let posX = new Float32Array(0);
    let posY = new Float32Array(0);
    let velX = new Float32Array(0);
    let velY = new Float32Array(0);
    let age = new Float32Array(0);
    let span = new Float32Array(0);

    function spawn(i: number) {
      posX[i] = Math.random() * w;
      posY[i] = Math.random() * h;
      velX[i] = 0;
      velY[i] = 0;
      age[i] = 0;
      span[i] = 240 + Math.random() * 420;
    }

    function alloc() {
      N = Math.round(Math.min(3800, Math.max(2600, (w * h) / 90)));
      posX = new Float32Array(N);
      posY = new Float32Array(N);
      velX = new Float32Array(N);
      velY = new Float32Array(N);
      age = new Float32Array(N);
      span = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        spawn(i);
        // Stagger initial ages so the population doesn't respawn in waves.
        age[i] = Math.random() * span[i];
      }
    }

    // Pointer state — eased position plus a decaying velocity estimate.
    let active = false;
    let tx = -1;
    let ty = -1;
    let px = -1;
    let py = -1;
    let pvx = 0;
    let pvy = 0;

    const CURL = 4.4; // field delta → target px/frame
    const EPS = 2.2; // finite-difference epsilon (css px)
    const RADIUS = 140; // pointer vortex radius (css px)
    const FADE = 0.1; // trail persistence (lower = longer trails)

    function simulate(t: number) {
      // Ease pointer + decay its velocity.
      if (active && tx >= 0) {
        if (px < 0) {
          px = tx;
          py = ty;
        } else {
          const dx = tx - px;
          const dy = ty - py;
          pvx = pvx * 0.72 + dx * 0.28;
          pvy = pvy * 0.72 + dy * 0.28;
          px += dx * 0.32;
          py += dy * 0.32;
        }
      } else {
        pvx *= 0.9;
        pvy *= 0.9;
        if (Math.abs(pvx) + Math.abs(pvy) < 0.05) px = -1;
      }
      const speed = Math.min(Math.hypot(pvx, pvy), 42);

      // Trail fade.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgba(${BG}, ${FADE})`;
      ctx.fillRect(0, 0, w, h);

      // Two stroke buckets: dim for ambient drift, bright for fast particles
      // (the ones the pointer just kicked). One path per bucket, one stroke.
      ctx.lineWidth = 1;
      ctx.beginPath(); // dim
      const dimPath = ctx;
      let drewBright = false;

      for (let i = 0; i < N; i++) {
        const x = posX[i];
        const y = posY[i];

        // Curl of the field at (x, y): (∂n/∂y, −∂n/∂x).
        const txv = (field(x, y + EPS, t) - field(x, y - EPS, t)) * CURL;
        const tyv = -(field(x + EPS, y, t) - field(x - EPS, y, t)) * CURL;

        let vx = velX[i] + (txv - velX[i]) * 0.055;
        let vy = velY[i] + (tyv - velY[i]) * 0.055;

        // Pointer vortex: tangential swirl + a push along pointer velocity.
        if (px >= 0 && speed > 0.4) {
          const dx = x - px;
          const dy = y - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < RADIUS * RADIUS && d2 > 1) {
            const d = Math.sqrt(d2);
            const f = 1 - d / RADIUS;
            const g = f * f;
            vx += ((-dy / d) * speed * 0.17 + pvx * 0.05) * g;
            vy += ((dx / d) * speed * 0.17 + pvy * 0.05) * g;
          }
        }

        vx *= 0.985;
        vy *= 0.985;
        const nx = x + vx;
        const ny = y + vy;

        velX[i] = vx;
        velY[i] = vy;
        posX[i] = nx;
        posY[i] = ny;

        age[i]++;
        if (age[i] > span[i] || nx < -24 || nx > w + 24 || ny < -24 || ny > h + 24) {
          spawn(i);
          continue; // no streak across the canvas on respawn
        }

        if (vx * vx + vy * vy > 8) {
          // Defer bright strokes to a second path (drawn after this loop).
          brightMove(brightPath, x, y, nx, ny);
          drewBright = true;
        } else {
          dimPath.moveTo(x, y);
          dimPath.lineTo(nx, ny);
        }
      }

      ctx.strokeStyle = `rgba(${GREEN}, 0.26)`;
      ctx.stroke();

      if (drewBright) {
        ctx.strokeStyle = `rgba(${BRIGHT}, 0.55)`;
        ctx.stroke(brightPath);
      }
    }

    // Bright strokes accumulate in their own Path2D, recreated each frame
    // in render() so it never grows unbounded.
    let brightPath = new Path2D();
    function brightMove(p: Path2D, x0: number, y0: number, x1: number, y1: number) {
      p.moveTo(x0, y0);
      p.lineTo(x1, y1);
    }

    function render(t: number) {
      brightPath = new Path2D();
      simulate(t);
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
    const startT = performance.now();
    const tick = (now: number) => {
      if (visible) render((now - startT) * 0.001);
      rafId = requestAnimationFrame(tick);
    };
    if (reduced) {
      // Compose a static frame: run the sim at a fixed t so the flow is
      // coherent, then stop.
      for (let k = 0; k < 260; k++) render(3.2);
    } else {
      rafId = requestAnimationFrame(tick);
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      active = true;
    };
    const onLeave = () => {
      active = false;
      tx = -1;
      ty = -1;
    };
    if (!reduced) {
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) for (let k = 0; k < 260; k++) render(3.2);
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

<div bind:this={host} class={`flow-field ${className}`} aria-hidden="true"></div>

<style>
  .flow-field {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 45%, rgba(0, 255, 65, 0.04), transparent 65%),
      #020503;
    cursor: crosshair;
  }
  .flow-field :global(canvas) {
    display: block;
  }
</style>
