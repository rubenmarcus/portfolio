<script lang="ts">
  /**
   * CircuitTraceDemo — lab drop 009. PCB-style autorouting: glowing traces
   * run between pads on the canvas edges, every bend a multiple of 45° like
   * a real board router. Each trace carries a bright packet that travels its
   * length and loops. While the pointer is inside, a repulsion field pushes
   * nearby trace vertices aside — the routes bend around the cursor as if
   * re-routed live. Clicking clears the board and routes a fresh one.
   *
   * Standalone on purpose — canvas 2D, no deps.
   *
   * Cost discipline: DPR capped at 1.5, trace count scaled to card area,
   * paused while offscreen, prefers-reduced-motion → the board is drawn once
   * as a static frame.
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

    // ── Traces ──
    interface Pt {
      x: number;
      y: number;
    }
    interface Trace {
      pts: Pt[]; // base route (before pointer displacement)
      cum: number[]; // cumulative polyline length per vertex
      len: number;
      s: number; // packet distance along the trace
      speed: number; // packet px/frame
    }
    let traces: Trace[] = [];

    const MARGIN = 16; // pad inset from the edge (css px)

    // A pad sits on a random edge, inset from the corners.
    function randPad(exceptEdge = -1): Pt & { edge: number } {
      let edge = Math.floor(Math.random() * 4);
      if (edge === exceptEdge) edge = (edge + 1 + Math.floor(Math.random() * 3)) % 4;
      if (edge === 0) return { x: MARGIN + Math.random() * (w - MARGIN * 2), y: 0, edge };
      if (edge === 1) return { x: w, y: MARGIN + Math.random() * (h - MARGIN * 2), edge };
      if (edge === 2) return { x: MARGIN + Math.random() * (w - MARGIN * 2), y: h, edge };
      return { x: 0, y: MARGIN + Math.random() * (h - MARGIN * 2), edge };
    }

    // Octilinear greedy router: 8 candidate directions (45° multiples),
    // scored by remaining distance plus jitter, with out-of-bounds
    // candidates rejected. Final approach is diagonal-then-axial so every
    // segment stays on the 45° grid.
    const DIRS = [
      [1, 0], [1, 1], [0, 1], [-1, 1],
      [-1, 0], [-1, -1], [0, -1], [1, -1],
    ];
    function route(a: Pt, b: Pt): Pt[] {
      const pts: Pt[] = [{ x: a.x, y: a.y }];
      let cx = a.x;
      let cy = a.y;
      let prevDir = -1;
      let guard = 0;
      while (guard++ < 40) {
        const dx = b.x - cx;
        const dy = b.y - cy;
        if (Math.hypot(dx, dy) < 26) break;
        let best = -1;
        let bestScore = Infinity;
        for (let d = 0; d < 8; d++) {
          const step = 34 + Math.random() * 40;
          const nx = cx + DIRS[d][0] * step;
          const ny = cy + DIRS[d][1] * step;
          if (nx < MARGIN * 0.5 || nx > w - MARGIN * 0.5) continue;
          if (ny < MARGIN * 0.5 || ny > h - MARGIN * 0.5) continue;
          let score = Math.hypot(b.x - nx, b.y - ny) + Math.random() * 60;
          if (d === prevDir) score -= 26; // prefer running straight
          if ((d + 4) % 8 === prevDir) score += 120; // avoid doubling back
          if (score < bestScore) {
            bestScore = score;
            best = d;
          }
        }
        if (best < 0) break;
        const step = 34 + Math.random() * 40;
        cx += DIRS[best][0] * step;
        cy += DIRS[best][1] * step;
        pts.push({ x: cx, y: cy });
        prevDir = best;
      }
      // Final approach: diagonal for min(|dx|,|dy|), then the axial rest.
      const dx = b.x - cx;
      const dy = b.y - cy;
      const dg = Math.min(Math.abs(dx), Math.abs(dy));
      if (dg > 2) {
        cx += Math.sign(dx) * dg;
        cy += Math.sign(dy) * dg;
        pts.push({ x: cx, y: cy });
      }
      pts.push({ x: b.x, y: b.y });
      return pts;
    }

    function makeTrace(pts: Pt[]): Trace {
      const cum = [0];
      for (let i = 1; i < pts.length; i++) {
        cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
      }
      return {
        pts,
        cum,
        len: cum[cum.length - 1],
        s: Math.random() * cum[cum.length - 1],
        speed: 1.6 + Math.random() * 1.6,
      };
    }

    function build() {
      const n = Math.round(Math.min(16, Math.max(8, (w * h) / 15000)));
      traces = [];
      for (let i = 0; i < n; i++) {
        const a = randPad();
        const b = randPad(a.edge);
        traces.push(makeTrace(route(a, b)));
      }
    }

    // Pointer state — eased so the repulsion field moves smoothly.
    let active = false;
    let tx = -1;
    let ty = -1;
    let mx = -1;
    let my = -1;

    const RADIUS = 110; // repulsion radius (css px)
    const PUSH = 44; // peak vertex displacement
    const FADE = 0.45; // mild fade: packets leave a short ghost

    // Displaced copy of a route under the pointer's repulsion field.
    const disp: Pt[] = [];
    function displace(pts: Pt[]) {
      disp.length = 0;
      for (const p of pts) {
        if (mx >= 0) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < RADIUS * RADIUS && d2 > 0.25) {
            const d = Math.sqrt(d2);
            const f = 1 - d / RADIUS;
            const push = f * f * PUSH;
            disp.push({ x: p.x + (dx / d) * push, y: p.y + (dy / d) * push });
            continue;
          }
        }
        disp.push(p);
      }
      return disp;
    }

    // Point at distance s along a polyline.
    function at(pts: Pt[], s: number): Pt {
      let acc = 0;
      for (let i = 1; i < pts.length; i++) {
        const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
        if (acc + seg >= s) {
          const t = seg > 0 ? (s - acc) / seg : 0;
          return {
            x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t,
            y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t,
          };
        }
        acc += seg;
      }
      return pts[pts.length - 1];
    }

    function frame() {
      // Ease the pointer toward its target.
      if (active && tx >= 0) {
        if (mx < 0) {
          mx = tx;
          my = ty;
        } else {
          mx += (tx - mx) * 0.18;
          my += (ty - my) * 0.18;
        }
      } else {
        mx = -1;
        my = -1;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgba(${BG}, ${FADE})`;
      ctx.fillRect(0, 0, w, h);

      for (const tr of traces) {
        const pts = mx >= 0 ? displace(tr.pts) : tr.pts;

        // The copper: one stroked path per trace.
        ctx.strokeStyle = `rgba(${GREEN}, 0.34)`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();

        // Vias at each bend, pads at the endpoints.
        ctx.fillStyle = `rgba(${GREEN}, 0.5)`;
        for (let i = 1; i < pts.length - 1; i++) {
          ctx.fillRect(pts[i].x - 1, pts[i].y - 1, 2, 2);
        }
        ctx.fillStyle = `rgba(${BRIGHT}, 0.7)`;
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, 2.2, 0, Math.PI * 2);
        ctx.arc(pts[pts.length - 1].x, pts[pts.length - 1].y, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Traveling packet: bright dot with a short glowing tail.
        tr.s = (tr.s + tr.speed) % (tr.len + 40);
        if (tr.s <= tr.len) {
          const head = at(pts, tr.s);
          const tail = at(pts, Math.max(0, tr.s - 26));
          const grad = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
          grad.addColorStop(0, `rgba(${GREEN}, 0)`);
          grad.addColorStop(1, `rgba(${BRIGHT}, 0.85)`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(tail.x, tail.y);
          ctx.lineTo(head.x, head.y);
          ctx.stroke();
          ctx.fillStyle = `rgba(${BRIGHT}, 0.95)`;
          ctx.beginPath();
          ctx.arc(head.x, head.y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function renderStatic() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, 0, w, h);
      for (const tr of traces) {
        ctx.strokeStyle = `rgba(${GREEN}, 0.34)`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(tr.pts[0].x, tr.pts[0].y);
        for (let i = 1; i < tr.pts.length; i++) ctx.lineTo(tr.pts[i].x, tr.pts[i].y);
        ctx.stroke();
        ctx.fillStyle = `rgba(${BRIGHT}, 0.7)`;
        ctx.beginPath();
        ctx.arc(tr.pts[0].x, tr.pts[0].y, 2.2, 0, Math.PI * 2);
        ctx.arc(tr.pts[tr.pts.length - 1].x, tr.pts[tr.pts.length - 1].y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        // Packet parked mid-trace.
        const p = at(tr.pts, tr.len * 0.55);
        ctx.fillStyle = `rgba(${BRIGHT}, 0.95)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
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
      build();
    }

    resize();
    const tick = () => {
      if (visible) frame();
      rafId = requestAnimationFrame(tick);
    };
    if (reduced) {
      renderStatic();
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
    // Click clears the board and routes a fresh one.
    const onDown = () => {
      build();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, 0, w, h);
    };
    if (!reduced) {
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      el.addEventListener("pointerdown", onDown);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) renderStatic();
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
      el.removeEventListener("pointerdown", onDown);
      canvas.remove();
    };
  });
</script>

<div bind:this={host} class={`circuit-trace ${className}`} aria-hidden="true"></div>

<style>
  .circuit-trace {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 50%, rgba(0, 255, 65, 0.04), transparent 68%),
      #020503;
    cursor: crosshair;
  }
  .circuit-trace :global(canvas) {
    display: block;
  }
</style>
