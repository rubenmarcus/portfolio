<script lang="ts">
  /**
   * LSystemDemo — lab drop 011. A bracketed L-system tree that grows branch
   * by branch in phosphor light: a random rule set is picked each cycle, the
   * turtle trace is normalized to fit the card, then segments are revealed a
   * few at a time. Once the tree is complete it fades out in slow alpha
   * steps and a new random tree regrows; clicking fells the current tree
   * early.
   *
   * Standalone on purpose — canvas 2D, no deps.
   *
   * Cost discipline: DPR capped at 1.5, the turtle runs once per cycle
   * (segments are replayed, not recomputed), paused while offscreen,
   * prefers-reduced-motion → one fully-grown tree drawn as a static frame.
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

    // ── L-system → segment list ──
    interface Seg {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      depth: number;
    }
    let segs: Seg[] = [];
    let drawn = 0; // segments revealed so far this cycle
    let phase: "grow" | "hold" | "fade" = "grow";
    let phaseT = 0;

    const RULES_X = [
      "F+[[X]-X]-F[-FX]+X",
      "F[+X][-X]FX",
      "F[+X]F[-X]+X",
      "FF+[+X-FX]-[-X+FX]",
      "F-[[X]+X]+F[+FX]-X",
    ];

    function build() {
      const angle = (16 + Math.random() * 13) * (Math.PI / 180);
      const ruleX = RULES_X[Math.floor(Math.random() * RULES_X.length)];
      const ruleF = Math.random() < 0.55 ? "FF" : "F";
      const iters = 4 + (Math.random() < 0.4 ? 1 : 0);

      let s = "X";
      for (let i = 0; i < iters; i++) {
        let out = "";
        for (const c of s) {
          if (c === "X") out += ruleX;
          else if (c === "F") out += ruleF;
          else out += c;
        }
        s = out;
        if (s.length > 60000) break; // safety valve on explosive rules
      }

      // Turtle pass — unit step first, then fit to the card.
      const raw: Seg[] = [];
      let x = 0;
      let y = 0;
      let dir = -Math.PI / 2;
      let depth = 0;
      const stack: { x: number; y: number; dir: number; depth: number }[] = [];
      for (const c of s) {
        if (c === "F") {
          const nx = x + Math.cos(dir);
          const ny = y + Math.sin(dir);
          raw.push({ x0: x, y0: y, x1: nx, y1: ny, depth });
          x = nx;
          y = ny;
        } else if (c === "+") {
          dir += angle * (0.9 + Math.random() * 0.2);
        } else if (c === "-") {
          dir -= angle * (0.9 + Math.random() * 0.2);
        } else if (c === "[") {
          stack.push({ x, y, dir, depth });
          depth++;
        } else if (c === "]") {
          const st = stack.pop();
          if (st) {
            x = st.x;
            y = st.y;
            dir = st.dir;
            depth = st.depth;
          }
        }
      }

      // Normalize: scale to fit height with margin, root centered at bottom.
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const sg of raw) {
        if (sg.x0 < minX) minX = sg.x0;
        if (sg.x0 > maxX) maxX = sg.x0;
        if (sg.y0 < minY) minY = sg.y0;
        if (sg.y0 > maxY) maxY = sg.y0;
        if (sg.y1 < minY) minY = sg.y1;
        if (sg.y1 > maxY) maxY = sg.y1;
      }
      const rh = Math.max(1e-6, maxY - minY);
      const rw = Math.max(1e-6, maxX - minX);
      const scale = Math.min((h * 0.82) / rh, (w * 0.86) / rw);
      const offX = w / 2 - (raw.length ? raw[0].x0 : 0) * scale;
      const offY = h * 0.94 - (raw.length ? raw[0].y0 : 0) * scale;
      segs = raw.map((sg) => ({
        x0: sg.x0 * scale + offX,
        y0: sg.y0 * scale + offY,
        x1: sg.x1 * scale + offX,
        y1: sg.y1 * scale + offY,
        depth: sg.depth,
      }));

      drawn = 0;
      phase = "grow";
      phaseT = 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, 0, w, h);
    }

    function drawSeg(sg: Seg, bright: boolean) {
      ctx.strokeStyle = bright
        ? `rgba(${BRIGHT}, 0.9)`
        : `rgba(${GREEN}, 0.42)`;
      ctx.lineWidth = Math.max(0.6, 1.6 - sg.depth * 0.22);
      ctx.beginPath();
      ctx.moveTo(sg.x0, sg.y0);
      ctx.lineTo(sg.x1, sg.y1);
      ctx.stroke();
    }

    function frame() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (phase === "grow") {
        // Reveal a slice of segments per frame so growth takes ~4s.
        const perFrame = Math.max(2, Math.ceil(segs.length / 240));
        const end = Math.min(segs.length, drawn + perFrame);
        // Dim the previous frontier back to the base stroke color.
        for (let i = drawn; i < end; i++) drawSeg(segs[i], true);
        drawn = end;
        if (drawn >= segs.length) {
          phase = "hold";
          phaseT = 0;
        } else if (drawn - perFrame >= 0) {
          // Repaint the just-passed slice dim so only the frontier glows.
          const lo = Math.max(0, drawn - perFrame * 2);
          for (let i = lo; i < drawn - perFrame; i++) drawSeg(segs[i], false);
        }
      } else if (phase === "hold") {
        phaseT++;
        if (phaseT > 140) {
          phase = "fade";
          phaseT = 0;
        }
      } else {
        // Slow alpha fade — the light dissolves, then a new tree regrows.
        ctx.fillStyle = `rgba(${BG}, 0.045)`;
        ctx.fillRect(0, 0, w, h);
        phaseT++;
        if (phaseT > 150) build();
      }
    }

    function renderStatic() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, 0, w, h);
      for (const sg of segs) drawSeg(sg, false);
      // Bright tip accents on the shallowest branches.
      ctx.fillStyle = `rgba(${BRIGHT}, 0.7)`;
      for (const sg of segs) {
        if (sg.depth >= 3) ctx.fillRect(sg.x1 - 0.7, sg.y1 - 0.7, 1.4, 1.4);
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

    // Pointer: click fells the current tree early and regrows a new one.
    const onDown = () => {
      if (phase !== "fade") {
        phase = "fade";
        phaseT = 0;
      }
    };
    if (!reduced) {
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
      el.removeEventListener("pointerdown", onDown);
      canvas.remove();
    };
  });
</script>

<div bind:this={host} class={`l-system ${className}`} aria-hidden="true"></div>

<style>
  .l-system {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 85%, rgba(0, 255, 65, 0.04), transparent 70%),
      #020503;
  }
  .l-system :global(canvas) {
    display: block;
  }
</style>
