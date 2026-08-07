<script lang="ts">
  /**
   * BoidsDemo — lab drop 006. Reynolds flocking: ~120–180 agents steering on
   * separation (steer away from crowded neighbors), alignment (match the
   * average heading of the local flock) and cohesion (drift toward the local
   * centroid). Toroidal wrap at the edges — no bounce. A pointer inside the
   * canvas adds a soft attraction so the flock bends toward the cursor;
   * trails come from alpha-fade on the previous frame, not per-boid history.
   *
   * Standalone on purpose — canvas 2D, no deps.
   *
   * Cost discipline: DPR capped at 1.5, boid count scaled to card area
   * (120–180, hard-capped), naive O(N²) neighbor query is fine at this N,
   * paused while offscreen, prefers-reduced-motion → the simulation is
   * stepped synchronously a few times to compose a static frame.
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

    // ── Flocking tuning ──
    const PERCEPT = 28; // neighbor perception radius (css px)
    const PERCEPT2 = PERCEPT * PERCEPT;
    const SEP = 16; // separation radius (css px)
    const SEP2 = SEP * SEP;
    const MIN_SPEED = 0.9;
    const MAX_SPEED = 2.6;
    const MAX_FORCE = 0.045; // per-step acceleration clamp
    const W_SEP = 1.5;
    const W_ALI = 1.0;
    const W_COH = 1.0;
    const POINTER_R = 160; // pointer attraction radius (css px)
    const POINTER_R2 = POINTER_R * POINTER_R;
    const W_POINTER = 0.6;
    const FADE = 0.12; // trail persistence (lower = longer trails)

    // ── Boids ──
    let N = 0;
    let posX = new Float32Array(0);
    let posY = new Float32Array(0);
    let velX = new Float32Array(0);
    let velY = new Float32Array(0);

    function alloc() {
      N = Math.round(Math.min(180, Math.max(120, (w * h) / 1400)));
      posX = new Float32Array(N);
      posY = new Float32Array(N);
      velX = new Float32Array(N);
      velY = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        posX[i] = Math.random() * w;
        posY[i] = Math.random() * h;
        const a = Math.random() * Math.PI * 2;
        const s = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
        velX[i] = Math.cos(a) * s;
        velY[i] = Math.sin(a) * s;
      }
    }

    // Pointer state.
    let pointerInside = false;
    let px = 0;
    let py = 0;

    // Reusable scratch so the hot loop allocates nothing. steer() treats its
    // (dx, dy) argument as a desired velocity, clamps it to MAX_SPEED, then
    // writes (desired − v) clamped to MAX_FORCE into scratch.
    const scratch = { x: 0, y: 0 };
    function steer(dx: number, dy: number, vx: number, vy: number) {
      let m = Math.hypot(dx, dy);
      if (m > MAX_SPEED && m > 0) {
        dx = (dx / m) * MAX_SPEED;
        dy = (dy / m) * MAX_SPEED;
      }
      let fx = dx - vx;
      let fy = dy - vy;
      m = Math.hypot(fx, fy);
      if (m > MAX_FORCE && m > 0) {
        fx = (fx / m) * MAX_FORCE;
        fy = (fy / m) * MAX_FORCE;
      }
      scratch.x = fx;
      scratch.y = fy;
    }

    function simulate() {
      // Trail fade.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgba(${BG}, ${FADE})`;
      ctx.fillRect(0, 0, w, h);

      // Two stroke buckets: dim body streaks, bright heads. One Path2D each,
      // stroked once at the end.
      ctx.lineWidth = 1;
      const bodyPath = new Path2D();
      const headPath = new Path2D();

      for (let i = 0; i < N; i++) {
        const x = posX[i];
        const y = posY[i];
        const vx = velX[i];
        const vy = velY[i];

        // Naive O(N²) neighbor query. Plain euclidean distance — at a 28px
        // perception radius the toroidal cross-edge gain is marginal.
        let sepX = 0;
        let sepY = 0;
        let aliX = 0;
        let aliY = 0;
        let cohX = 0;
        let cohY = 0;
        let sepN = 0;
        let aliN = 0;

        for (let j = 0; j < N; j++) {
          if (i === j) continue;
          const dx = x - posX[j];
          const dy = y - posY[j];
          const d2 = dx * dx + dy * dy;
          if (d2 < SEP2 && d2 > 0) {
            const d = Math.sqrt(d2);
            sepX += dx / d;
            sepY += dy / d;
            sepN++;
          }
          if (d2 < PERCEPT2) {
            aliX += velX[j];
            aliY += velY[j];
            cohX += posX[j];
            cohY += posY[j];
            aliN++;
          }
        }

        let accX = 0;
        let accY = 0;

        // Separation: steer toward the sum of unit vectors pointing away
        // from each too-close neighbor.
        if (sepN > 0) {
          steer(sepX / sepN, sepY / sepN, vx, vy);
          accX += scratch.x * W_SEP;
          accY += scratch.y * W_SEP;
        }

        // Alignment + cohesion share the same perceptual neighborhood.
        if (aliN > 0) {
          steer(aliX / aliN, aliY / aliN, vx, vy);
          accX += scratch.x * W_ALI;
          accY += scratch.y * W_ALI;
          steer(cohX / aliN - x, cohY / aliN - y, vx, vy);
          accX += scratch.x * W_COH;
          accY += scratch.y * W_COH;
        }

        // Pointer attraction: a gentle pull toward the cursor, falling off
        // to zero at POINTER_R.
        if (pointerInside) {
          const dx = px - x;
          const dy = py - y;
          const d2 = dx * dx + dy * dy;
          if (d2 < POINTER_R2 && d2 > 1) {
            const d = Math.sqrt(d2);
            const f = (1 - d / POINTER_R) * W_POINTER;
            const desiredX = (dx / d) * MAX_SPEED;
            const desiredY = (dy / d) * MAX_SPEED;
            let fpx = (desiredX - vx) * f;
            let fpy = (desiredY - vy) * f;
            const m = Math.hypot(fpx, fpy);
            if (m > MAX_FORCE && m > 0) {
              fpx = (fpx / m) * MAX_FORCE;
              fpy = (fpy / m) * MAX_FORCE;
            }
            accX += fpx;
            accY += fpy;
          }
        }

        // Integrate, then clamp speed to [MIN_SPEED, MAX_SPEED].
        let nvx = vx + accX;
        let nvy = vy + accY;
        const sp = Math.hypot(nvx, nvy);
        if (sp > MAX_SPEED) {
          nvx = (nvx / sp) * MAX_SPEED;
          nvy = (nvy / sp) * MAX_SPEED;
        } else if (sp < MIN_SPEED && sp > 0) {
          nvx = (nvx / sp) * MIN_SPEED;
          nvy = (nvy / sp) * MIN_SPEED;
        }

        let nx = x + nvx;
        let ny = y + nvy;

        // Toroidal wrap (no bounce).
        if (nx < 0) nx += w;
        else if (nx >= w) nx -= w;
        if (ny < 0) ny += h;
        else if (ny >= h) ny -= h;

        velX[i] = nvx;
        velY[i] = nvy;
        posX[i] = nx;
        posY[i] = ny;

        // Draw a streak from the old position to the new one; the head
        // (one velocity-vector forward) lands in the brighter bucket. Skip
        // if the boid just wrapped across an edge to avoid a full-canvas
        // slash.
        const wrapped = Math.abs(nx - x) > w / 2 || Math.abs(ny - y) > h / 2;
        if (!wrapped) {
          bodyPath.moveTo(x, y);
          bodyPath.lineTo(nx, ny);
          headPath.moveTo(nx, ny);
          headPath.lineTo(nx + nvx, ny + nvy);
        }
      }

      ctx.strokeStyle = `rgba(${GREEN}, 0.5)`;
      ctx.stroke(bodyPath);
      ctx.strokeStyle = `rgba(${BRIGHT}, 0.85)`;
      ctx.stroke(headPath);
    }

    function render() {
      simulate();
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
      if (visible) render();
      rafId = requestAnimationFrame(tick);
    };
    if (reduced) {
      // Step the sim a few times so the flock has coherent structure, then
      // leave the composed static frame (no RAF).
      for (let k = 0; k < 8; k++) render();
    } else {
      rafId = requestAnimationFrame(tick);
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
      pointerInside = true;
    };
    const onLeave = () => {
      pointerInside = false;
    };
    if (!reduced) {
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) for (let k = 0; k < 8; k++) render();
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

<div bind:this={host} class={`boids ${className}`} aria-hidden="true"></div>

<style>
  .boids {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 45%, rgba(0, 255, 65, 0.04), transparent 65%),
      #020503;
    cursor: crosshair;
  }
  .boids :global(canvas) {
    display: block;
  }
</style>
