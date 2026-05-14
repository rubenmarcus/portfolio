<script lang="ts">
  import { onMount } from "svelte";

  interface Props {
    /** Particles spawned per frame while the cursor is moving over the hero. */
    rate?: number;
    /** Min/max particle radius in CSS pixels. */
    minSize?: number;
    maxSize?: number;
    /** Particle lifespan in ms. */
    life?: number;
    /** Base color (rgba, alpha will be overridden). */
    color?: string;
    /** Class on the wrapper. */
    class?: string;
  }

  let {
    rate = 2.5,
    minSize = 1,
    maxSize = 3,
    life = 1100,
    color = "rgba(190, 230, 255, 1)",
    class: className = "",
  }: Props = $props();

  type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    born: number;
    rot: number;
    glyph: number;
  };

  // Sparkle as small filled circles + occasional ASCII "+" or "·" glyph
  const GLYPHS = ["·", "+", "·", "·", "*"];

  let canvas: HTMLCanvasElement | null = $state(null);
  let wrapper: HTMLDivElement | null = $state(null);
  let enabled = $state(false);

  onMount(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (coarse || reduced) return;
    enabled = true;

    let mx = -9999, my = -9999, lastMx = -9999, lastMy = -9999;
    let active = false;
    let rafId = 0;
    let particles: Particle[] = [];
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    let visible = true;
    let rateAccum = 0;
    let lastT = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas || !wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }

    function localFromMouse(): { x: number; y: number } | null {
      if (!wrapper) return null;
      const rect = wrapper.getBoundingClientRect();
      const x = (mx - rect.left) * dpr;
      const y = (my - rect.top) * dpr;
      if (x < 0 || y < 0 || x > canvas!.width || y > canvas!.height) return null;
      return { x, y };
    }

    function spawn(now: number, n: number) {
      const local = localFromMouse();
      if (!local) return;
      for (let i = 0; i < n; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.18 + Math.random() * 0.35) * dpr;
        particles.push({
          x: local.x + (Math.random() - 0.5) * 8 * dpr,
          y: local.y + (Math.random() - 0.5) * 8 * dpr,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.04 * dpr, // slight upward bias
          r: (minSize + Math.random() * (maxSize - minSize)) * dpr,
          born: now,
          rot: Math.random() * Math.PI,
          glyph: Math.floor(Math.random() * GLYPHS.length),
        });
      }
      // Cap particle count
      if (particles.length > 280) particles = particles.slice(-280);
    }

    function step(now: number) {
      const dt = Math.min(48, now - lastT);
      lastT = now;
      if (!canvas || !visible) {
        rafId = requestAnimationFrame(step);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn based on mouse movement / activity
      const dx = mx - lastMx, dy = my - lastMy;
      const movement = Math.hypot(dx, dy);
      if (active && movement > 0.5) {
        rateAccum += (rate + movement * 0.06) * (dt / 16);
        const toSpawn = Math.floor(rateAccum);
        if (toSpawn > 0) {
          spawn(now, Math.min(toSpawn, 6));
          rateAccum -= toSpawn;
        }
      }
      lastMx = mx;
      lastMy = my;

      // Step + draw particles
      const alive: Particle[] = [];
      for (const p of particles) {
        const age = now - p.born;
        if (age >= life) continue;

        const t = age / life;
        const ease = 1 - (1 - t) * (1 - t); // easeOut
        const alpha = Math.max(0, 0.85 * (1 - ease));

        // Velocity decay + light upward drift
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.vy -= 0.008 * dpr; // gentle rise

        // Draw — small soft circle + glyph for variety
        const r = p.r * (1 - ease * 0.6);
        const cAlpha = color.replace(/,\s*1\)$/, `, ${alpha.toFixed(3)})`);
        const cFaint = color.replace(/,\s*1\)$/, `, ${(alpha * 0.35).toFixed(3)})`);

        // Outer glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
        grad.addColorStop(0, cAlpha);
        grad.addColorStop(1, "rgba(190, 230, 255, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 5, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        ctx.fillStyle = cAlpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Occasional glyph for ASCII character
        if (p.glyph === 1 || p.glyph === 4) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot + age * 0.001);
          ctx.fillStyle = cFaint;
          ctx.font = `${Math.floor(r * 4)}px "JetBrains Mono", monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(GLYPHS[p.glyph], 0, 0);
          ctx.restore();
        }

        alive.push(p);
      }
      particles = alive;

      rafId = requestAnimationFrame(step);
    }

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      active = true;
    };
    const onEnter = () => { active = true; };
    const onLeaveDoc = () => { active = false; };

    resize();
    ro = new ResizeObserver(() => resize());
    if (wrapper) ro.observe(wrapper);

    io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
    });
    if (wrapper) io.observe(wrapper);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseleave", onLeaveDoc);
    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseleave", onLeaveDoc);
      ro?.disconnect();
      io?.disconnect();
    };
  });
</script>

<div bind:this={wrapper} class={`hero-particles ${className}`} aria-hidden="true">
  {#if enabled}
    <canvas bind:this={canvas}></canvas>
  {/if}
</div>

<style>
  .hero-particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    mix-blend-mode: screen;
  }
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
