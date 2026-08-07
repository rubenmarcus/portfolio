<script lang="ts">
  /**
   * HarmonographDemo — lab drop 007. A classical two-pendulum-per-axis
   * harmonograph: position is the sum of damped sinusoids, so the curve
   * traces Lissajous-like phosphor figures that never quite close. Energy
   * is gently re-injected every few seconds (and on amplitude collapse) so
   * the figure keeps evolving; the pointer morphs one frequency ratio and
   * a phase offset live, easing back to baseline on pointerleave. Trails
   * come from a very slow alpha-fade on the previous frame — the
   * accumulating figure is the whole point.
   *
   * Standalone on purpose — canvas 2D, no deps.
   *
   * Cost discipline: DPR capped at 1.5, paused while offscreen,
   * prefers-reduced-motion → integrate a full figure statically, no RAF.
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

    // ── Oscillator parameters (baseline). Two pendulums per axis; the
    //    frequency ratios are slightly irrational so the curve never
    //    quite closes. f1/f2 drive X, f3/f4 drive Y.
    const baseF = [2.0, 2.005, 3.0, 3.004];
    const baseP = [0.0, 0.0, Math.PI / 4, Math.PI / 6];
    const damping = 0.01; // exp decay rate of amplitude with cycle-time

    let amp = 0; // half-extent scale (css px), set on resize
    let t = 0; // global phase time, advances each frame
    let tBase = 0; // t at last energy re-injection (start of current cycle)
    let lastReinject = 0; // performance.now() of last re-injection
    // small per-cycle phase drift so each re-injected figure is fresh
    let phaseJitter = [0, 0, 0, 0];

    // Pointer state — eased 0..1 target plus an active flag.
    let active = false;
    let ptrX = 0.5;
    let ptrY = 0.5;
    let freqOff = 0; // eased offset applied to f2/f4 (ratio morph)
    let phaseOff = 0; // eased offset applied to p3/p4 (phase morph)

    // Previously drawn point (canvas coords) so we can stroke segments.
    let prevX = 0;
    let prevY = 0;
    let havePrev = false;

    // Re-inject energy: start a new cycle and drift phases a little. Calm,
    // not jumpy — old phosphor is still fading on the canvas, the fresh
    // figure (slightly different phase) grows in on top of it.
    function reinject(now: number) {
      tBase = t;
      lastReinject = now;
      phaseJitter = phaseJitter.map((p) => p + (Math.random() - 0.5) * 0.15);
      havePrev = false; // no streak bridging the cycle boundary
    }

    // Evaluate the harmonograph at global time tt. Returns css-px offsets
    // from the canvas center. Damping is relative to the current cycle.
    function sample(tt: number): [number, number] {
      const tau = tt - tBase;
      const decay = Math.exp(-damping * Math.max(0, tau));
      const f2 = baseF[1] + freqOff;
      const f4 = baseF[3] + freqOff;
      const p3 = baseP[2] + phaseJitter[2] + phaseOff;
      const p4 = baseP[3] + phaseJitter[3] + phaseOff;
      const x =
        amp * decay * (Math.sin(baseF[0] * tt + baseP[0] + phaseJitter[0]) +
          Math.sin(f2 * tt + baseP[1] + phaseJitter[1]));
      const y =
        amp * decay * (Math.sin(baseF[2] * tt + p3) +
          Math.sin(f4 * tt + p4));
      return [x, y];
    }

    // Compose a static figure for reduced-motion: integrate a fixed t-range
    // (enough periods for a complete, gently-decaying harmonograph) and
    // draw it once. No RAF.
    function drawStatic() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.5;
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${GREEN}, 0.5)`;
      ctx.beginPath();
      let first = true;
      const dt = 0.03;
      for (let tt = 0; tt < 150; tt += dt) {
        const [ox, oy] = sample(tt);
        const x = cx + ox;
        const y = cy + oy;
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    function render(now: number) {
      // Ease pointer-driven offsets toward their target (or back to 0).
      const tgtFreq = active ? (ptrX - 0.5) * 0.4 : 0;
      const tgtPhase = active ? (ptrY - 0.5) * Math.PI : 0;
      freqOff += (tgtFreq - freqOff) * 0.04;
      phaseOff += (tgtPhase - phaseOff) * 0.04;

      // Re-inject when this cycle's amplitude has mostly collapsed, or as
      // a 6s safety net so motion never stalls.
      const decayNow = Math.exp(-damping * Math.max(0, t - tBase));
      if (decayNow < 0.14 || now - lastReinject > 6000) reinject(now);

      // Very slow phosphor fade — the figure accumulates and gently decays.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgba(${BG}, 0.05)`;
      ctx.fillRect(0, 0, w, h);

      // Integrate several sub-steps this frame in one path → one stroke.
      const cx = w * 0.5;
      const cy = h * 0.5;
      const dt = 0.02;
      const steps = 30;
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = `rgba(${BRIGHT}, 0.45)`;
      ctx.beginPath();
      let drew = false;
      for (let i = 0; i < steps; i++) {
        const [ox, oy] = sample(t);
        const x = cx + ox;
        const y = cy + oy;
        t += dt;
        if (havePrev) {
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(x, y);
          drew = true;
        }
        prevX = x;
        prevY = y;
        havePrev = true;
      }
      if (drew) ctx.stroke();
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
      amp = Math.min(w, h) * 0.205; // max half-extent ~0.41×min(w,h), fits
      havePrev = false;
    }

    resize();
    const startT = performance.now();
    lastReinject = startT;
    const tick = (now: number) => {
      if (visible) render(now);
      rafId = requestAnimationFrame(tick);
    };
    if (reduced) {
      drawStatic();
    } else {
      rafId = requestAnimationFrame(tick);
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ptrX = Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
      ptrY = Math.max(0, Math.min(1, (e.clientY - r.top) / Math.max(1, r.height)));
      active = true;
    };
    const onLeave = () => {
      active = false;
    };
    if (!reduced) {
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) drawStatic();
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

<div bind:this={host} class={`harmonograph ${className}`} aria-hidden="true"></div>

<style>
  .harmonograph {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 50%, rgba(0, 255, 65, 0.04), transparent 65%),
      #020503;
    cursor: crosshair;
  }
  .harmonograph :global(canvas) {
    display: block;
  }
</style>
