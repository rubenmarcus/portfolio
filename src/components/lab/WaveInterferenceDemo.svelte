<script lang="ts">
  /**
   * WaveInterferenceDemo — lab drop 015. Overlapping circular wave sources
   * rendered as an interference moiré of dotted crest lines: on a coarse dot
   * grid, each point sums cos(k·r − ωt) over all sources and lights up where
   * the sum nears a crest. Three ambient sources sit at fixed positions;
   * clicking drops a new source (capped, oldest recycled) and the pattern
   * re-interferes around it.
   *
   * Standalone on purpose — canvas 2D, no deps.
   *
   * Cost discipline: DPR capped at 1.5, the field is evaluated on a 4px dot
   * grid (not per-pixel), sources capped at 7, paused while offscreen,
   * prefers-reduced-motion → one static frame of the interference pattern.
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

    // ── Sources ──
    interface Source {
      x: number;
      y: number;
      k: number; // spatial frequency (rad / css px)
      om: number; // temporal frequency (rad / s)
      ph: number; // phase offset
    }
    let sources: Source[] = [];
    const MAX_SOURCES = 7;

    function seed() {
      sources = [
        { x: w * 0.3, y: h * 0.38, k: 0.11, om: 2.1, ph: 0 },
        { x: w * 0.72, y: h * 0.55, k: 0.13, om: 1.7, ph: 2.2 },
        { x: w * 0.5, y: h * 0.78, k: 0.09, om: 2.5, ph: 4.1 },
      ];
    }

    const STEP = 4; // dot grid pitch (css px)
    const CREST = 0.45; // normalized-sum threshold for crest dots

    function frame(t: number) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, 0, w, h);

      const n = sources.length;
      const hard = new Path2D();
      const soft = new Path2D();
      for (let gy = STEP / 2; gy < h; gy += STEP) {
        for (let gx = STEP / 2; gx < w; gx += STEP) {
          let s = 0;
          for (let i = 0; i < n; i++) {
            const src = sources[i];
            const dx = gx - src.x;
            const dy = gy - src.y;
            s += Math.cos(Math.sqrt(dx * dx + dy * dy) * src.k - t * src.om + src.ph);
          }
          s /= n;
          if (s > CREST + 0.22) {
            hard.rect(gx - 0.7, gy - 0.7, 1.5, 1.5);
          } else if (s > CREST) {
            soft.rect(gx - 0.55, gy - 0.55, 1.2, 1.2);
          }
        }
      }
      ctx.fillStyle = `rgba(${GREEN}, 0.28)`;
      ctx.fill(soft);
      ctx.fillStyle = `rgba(${BRIGHT}, 0.6)`;
      ctx.fill(hard);

      // Source markers.
      const sp = new Path2D();
      for (const src of sources) {
        sp.moveTo(src.x + 2.4, src.y);
        sp.arc(src.x, src.y, 2.4, 0, Math.PI * 2);
      }
      ctx.fillStyle = `rgba(${BRIGHT}, 0.85)`;
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
      seed();
    }

    resize();
    const startT = performance.now();
    const tick = (now: number) => {
      if (visible) frame((now - startT) * 0.001);
      rafId = requestAnimationFrame(tick);
    };
    if (reduced) {
      frame(1.4); // one static frame of the pattern, then stop
    } else {
      rafId = requestAnimationFrame(tick);
    }

    // Pointer: click drops a new wave source (oldest recycled past the cap).
    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      sources.push({
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        k: 0.09 + Math.random() * 0.05,
        om: 1.6 + Math.random() * 1.1,
        ph: Math.random() * Math.PI * 2,
      });
      if (sources.length > MAX_SOURCES) sources.splice(3, 1); // keep ambient 3
    };
    if (!reduced) {
      el.addEventListener("pointerdown", onDown);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) frame(1.4);
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

<div bind:this={host} class={`wave-interference ${className}`} aria-hidden="true"></div>

<style>
  .wave-interference {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 50%, rgba(0, 255, 65, 0.03), transparent 70%),
      #020503;
    cursor: crosshair;
  }
  .wave-interference :global(canvas) {
    display: block;
  }
</style>
