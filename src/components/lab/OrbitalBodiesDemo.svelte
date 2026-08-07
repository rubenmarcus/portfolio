<script lang="ts">
  /**
   * OrbitalBodiesDemo — lab drop 014. A tiny n-body toy: one heavy center
   * mass and a dozen particles on near-circular orbits, integrated with a
   * softened inverse-square force. Trails come from a very slow alpha-fade,
   * so the orbits read as long-exposure rings. Clicking drops a temporary
   * gravity well at the pointer that perturbs (or captures) anything nearby
   * for a few seconds before decaying.
   *
   * Standalone on purpose — canvas 2D, no deps.
   *
   * Cost discipline: DPR capped at 1.5, fixed small body count, paused while
   * offscreen, prefers-reduced-motion → the system is stepped synchronously
   * to compose a static frame of orbit rings.
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

    // ── Bodies ──
    const COUNT = 13;
    const GM = 5200; // central mass (tuned for css px, 60fps steps)
    const SOFT = 90; // softening² — no singularities near the core
    interface Body {
      x: number;
      y: number;
      vx: number;
      vy: number;
    }
    let bodies: Body[] = [];

    // Temporary pointer wells.
    interface Well {
      x: number;
      y: number;
      ttl: number; // frames remaining
    }
    let wells: Well[] = [];
    const WELL_TTL = 170;
    const WELL_GM = GM * 0.9;

    let maxR = 100;

    function seed() {
      bodies = [];
      wells = [];
      maxR = Math.min(w, h) * 0.46;
      for (let i = 0; i < COUNT; i++) {
        const r = maxR * (0.22 + 0.75 * (i / COUNT)) * (0.92 + Math.random() * 0.16);
        const a = Math.random() * Math.PI * 2;
        const v = Math.sqrt(GM / r) * (0.9 + Math.random() * 0.16);
        bodies.push({
          x: w / 2 + Math.cos(a) * r,
          y: h / 2 + Math.sin(a) * r,
          // Prograde tangential velocity → near-circular orbits.
          vx: -Math.sin(a) * v,
          vy: Math.cos(a) * v,
        });
      }
    }

    const FADE = 0.06; // long-exposure trails

    function frame() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgba(${BG}, ${FADE})`;
      ctx.fillRect(0, 0, w, h);

      // Decay wells.
      wells = wells.filter((wl) => --wl.ttl > 0);

      const cx = w / 2;
      const cy = h / 2;

      ctx.lineWidth = 1;
      const path = new Path2D();
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        const px = b.x;
        const py = b.y;

        // Central mass.
        let dx = cx - b.x;
        let dy = cy - b.y;
        let r2 = dx * dx + dy * dy + SOFT;
        let inv = GM / (r2 * Math.sqrt(r2));
        b.vx += dx * inv;
        b.vy += dy * inv;

        // Pointer wells.
        for (const wl of wells) {
          const k = Math.min(1, wl.ttl / 40); // ease-out at end of life
          dx = wl.x - b.x;
          dy = wl.y - b.y;
          r2 = dx * dx + dy * dy + SOFT;
          inv = (WELL_GM * k) / (r2 * Math.sqrt(r2));
          b.vx += dx * inv;
          b.vy += dy * inv;
        }

        b.x += b.vx;
        b.y += b.vy;

        // Respawn escapees and core-divers back onto a stable orbit.
        const ox = b.x - cx;
        const oy = b.y - cy;
        const ro = Math.hypot(ox, oy);
        if (ro > maxR * 1.7 || ro < 12 || !Number.isFinite(ro)) {
          const r = maxR * (0.3 + Math.random() * 0.6);
          const a = Math.random() * Math.PI * 2;
          const v = Math.sqrt(GM / r);
          b.x = cx + Math.cos(a) * r;
          b.y = cy + Math.sin(a) * r;
          b.vx = -Math.sin(a) * v;
          b.vy = Math.cos(a) * v;
          continue; // no streak across the canvas on respawn
        }

        path.moveTo(px, py);
        path.lineTo(b.x, b.y);
      }
      ctx.strokeStyle = `rgba(${GREEN}, 0.5)`;
      ctx.stroke(path);

      // Central mass, redrawn bright each frame (it survives the fade).
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
      glow.addColorStop(0, `rgba(${BRIGHT}, 0.95)`);
      glow.addColorStop(0.35, `rgba(${GREEN}, 0.5)`);
      glow.addColorStop(1, `rgba(${GREEN}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();

      // Live wells pulse as faint rings.
      for (const wl of wells) {
        const k = Math.min(1, wl.ttl / 40);
        ctx.strokeStyle = `rgba(${BRIGHT}, ${0.4 * k})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(wl.x, wl.y, 6 + (1 - k) * 4, 0, Math.PI * 2);
        ctx.stroke();
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
      seed();
    }

    resize();
    const tick = () => {
      if (visible) frame();
      rafId = requestAnimationFrame(tick);
    };
    if (reduced) {
      // Compose a static frame: a few hundred steps so orbits close into
      // rings, then stop.
      for (let k = 0; k < 420; k++) frame();
    } else {
      rafId = requestAnimationFrame(tick);
    }

    // Pointer: click drops a temporary gravity well.
    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      wells.push({
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        ttl: WELL_TTL,
      });
      if (wells.length > 3) wells.shift();
    };
    if (!reduced) {
      el.addEventListener("pointerdown", onDown);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) for (let k = 0; k < 420; k++) frame();
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
      canvas.remove();
    };
  });
</script>

<div bind:this={host} class={`orbital-bodies ${className}`} aria-hidden="true"></div>

<style>
  .orbital-bodies {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 50%, rgba(0, 255, 65, 0.05), transparent 62%),
      #020503;
    cursor: crosshair;
  }
  .orbital-bodies :global(canvas) {
    display: block;
  }
</style>
