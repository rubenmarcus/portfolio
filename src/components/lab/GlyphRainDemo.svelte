<script lang="ts">
  /**
   * GlyphRainDemo — lab drop 005 ("glyph-rain-05"). Phosphor-green glyph
   * rain in the spirit of the classic matrix cascade, kept sparse and quiet:
   * one column of mono glyphs per cell width, each column a head glowing
   * BRIGHT with a tail of K glyphs fading toward transparent green. The
   * soft phosphor decay comes from alpha-fading the previous frame, not
   * from per-glyph history.
   *
   * Hover focuses a column: its head flares near-white and it (plus a small
   * neighborhood) gets a speed boost that decays back to ambient on leave.
   *
   * Standalone on purpose — canvas 2D, no deps.
   *
   * Cost discipline: DPR capped at 1.5, column count = width / 18px (cell
   * width never below 14px), paused while offscreen, prefers-reduced-motion
   * → one static snapshot frame, no RAF.
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

  // Mono glyph cell. 18px is comfortably inside the 16–18px band and never
  // drops below the 14px floor, so columns stay readable on small cards.
  const COL_W = 18;
  const CELL_H = 18;
  const FONT_PX = 15;
  const FONT = `${FONT_PX}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;

  const GLYPHS = (
    "0123456789" +
    "abcdef" +
    "+*/<>=&|%^~" +
    // half-width katakana — single cell wide, reads cleanly in mono.
    "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎ"
  ).split("");

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

    // ── Columns: head Y, ambient speed, tail length, decaying pointer boost ──
    let cols = 0;
    let headY = new Float32Array(0);
    let speed = new Float32Array(0);
    let tail = new Int32Array(0);
    let boost = new Float32Array(0);

    function seedCol(i: number, scatter: boolean) {
      // scatter: spread heads across/above the canvas so the rain doesn't
      // materialise in a single wave on (re)alloc.
      headY[i] = scatter ? Math.random() * h * 1.6 - h * 0.5 : -Math.random() * h * 0.8;
      speed[i] = 1.1 + Math.random() * 2.1;
      tail[i] = 9 + Math.floor(Math.random() * 14); // 9..22, head inclusive
      boost[i] = 0;
    }

    function alloc() {
      cols = Math.max(1, Math.floor(w / COL_W));
      headY = new Float32Array(cols);
      speed = new Float32Array(cols);
      tail = new Int32Array(cols);
      boost = new Float32Array(cols);
      for (let i = 0; i < cols; i++) seedCol(i, true);
    }

    // Stable per-(column,cell) glyph. The cell index tracks the head, so the
    // stream scrolls naturally as the head descends — no per-frame arrays,
    // no mutation noise; the rain stays elegant rather than flickery.
    function glyphFor(col: number, cell: number): string {
      let n = (Math.imul(col + 1, 73856093) ^ Math.imul(cell + 1, 19349663)) | 0;
      n = Math.imul(n ^ (n >>> 13), 1274126177);
      n ^= n >>> 16;
      return GLYPHS[(n >>> 0) % GLYPHS.length];
    }

    // ── Pointer ──
    let hoverCol = -1;
    const HOVER_RADIUS = 2; // neighborhood columns each side
    const HOVER_BOOST = 3.2; // px/frame added to the focused column
    const BOOST_DECAY = 0.9;

    function refreshBoost() {
      if (hoverCol < 0) return;
      for (let k = -HOVER_RADIUS; k <= HOVER_RADIUS; k++) {
        const cc = hoverCol + k;
        if (cc < 0 || cc >= cols) continue;
        const fall = 1 - Math.abs(k) / (HOVER_RADIUS + 1);
        const amt = fall * HOVER_BOOST;
        if (amt > boost[cc]) boost[cc] = amt;
      }
    }

    // ── Render ──
    function paint(advance: boolean) {
      // Phosphor decay: alpha-fade the previous frame instead of clearing.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgba(${BG}, 0.08)`;
      ctx.fillRect(0, 0, w, h);

      ctx.font = FONT;
      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      if (advance) refreshBoost();

      for (let c = 0; c < cols; c++) {
        const x = c * COL_W + COL_W * 0.5;
        const hy = headY[c];
        const K = tail[c];
        const sp = speed[c] + boost[c];
        const focused = c === hoverCol;

        for (let k = 0; k < K; k++) {
          const gy = hy - k * CELL_H;
          if (gy < -CELL_H || gy > h) continue;
          const cell = Math.round(hy / CELL_H) - k;
          const g = glyphFor(c, cell);
          if (k === 0) {
            ctx.fillStyle = focused
              ? "rgba(225, 255, 232, 0.98)"
              : `rgba(${BRIGHT}, 0.9)`;
          } else {
            const a = (1 - k / K) * 0.72;
            ctx.fillStyle = `rgba(${GREEN}, ${a})`;
          }
          ctx.fillText(g, x, gy);
        }

        if (advance) {
          headY[c] = hy + sp;
          boost[c] *= BOOST_DECAY;
          if (boost[c] < 0.02) boost[c] = 0;
          // Recycle once the whole tail has cleared the bottom edge.
          if (hy - K * CELL_H > h) seedCol(c, false);
        }
      }
    }

    function composeStatic() {
      // Frozen snapshot: drop heads somewhere on screen and paint once.
      for (let c = 0; c < cols; c++) headY[c] = Math.random() * h;
      paint(false);
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
      if (visible) paint(true);
      rafId = requestAnimationFrame(tick);
    };
    if (reduced) {
      composeStatic();
    } else {
      rafId = requestAnimationFrame(tick);
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const c = Math.floor((e.clientX - r.left) / COL_W);
      hoverCol = c >= 0 && c < cols ? c : -1;
      refreshBoost();
    };
    const onLeave = () => {
      hoverCol = -1;
    };
    if (!reduced) {
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) composeStatic();
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

<div bind:this={host} class={`glyph-rain ${className}`} aria-hidden="true"></div>

<style>
  .glyph-rain {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 0%, rgba(0, 255, 65, 0.05), transparent 60%),
      #020503;
    cursor: crosshair;
  }
  .glyph-rain :global(canvas) {
    display: block;
  }
</style>
