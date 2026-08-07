<script lang="ts">
  /**
   * CellularAutomatonDemo — lab drop "automaton-08". A 1D elementary
   * cellular automaton (Wolfram rule 30) grown from a single center seed.
   * Each step derives the next row from the current one through the 8-bit
   * rule table (index = (left<<2)|(self<<1)|right); rows stack downward and,
   * once the canvas fills, scroll up by exactly one cell per step so fresh
   * generations keep appearing at the bottom. Pointer move/down paints a
   * small neighborhood of cells alive in the current (bottom) row, perturbing
   * the chaos from that point on.
   *
   * Standalone on purpose — canvas 2D, no deps.
   *
   * Cost discipline: DPR capped at 1.5, column count W capped at 240,
   * paused while offscreen, prefers-reduced-motion → the rule is evolved
   * synchronously to fill the canvas once and held static (no RAF). The
   * scroll uses an integer device-pixel shift with smoothing off, so rows
   * stay crisp with no accumulated smear.
   */

  import { onMount } from "svelte";

  interface Props {
    class?: string;
  }
  let { class: className = "" }: Props = $props();

  let host: HTMLDivElement | null = null;

  const BG = "4, 8, 5";
  const BRIGHT = "164, 255, 190";

  onMount(() => {
    if (!host) return;
    const el = host;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    el.appendChild(canvas);
    ctx.imageSmoothingEnabled = false;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let w = 0;
    let h = 0;
    let rafId = 0;
    let visible = true;

    // ── Rule 30 ── index = (left<<2)|(self<<1)|right; next = bit of 30.
    const RULE = 30;
    const ruleTable = new Uint8Array(8);
    for (let i = 0; i < 8; i++) ruleTable[i] = (RULE >> i) & 1;

    // Integer device-pixel pitch keeps the scroll shift whole-pixel, so the
    // drawImage self-copy never interpolates and rows never smear.
    const CELL_DEVICE = Math.max(4, Math.round(7 * dpr));
    const cell = CELL_DEVICE / dpr; // css px per cell (~7)
    const MAX_W = 240;
    const STEP_MS = 55; // ms between generations

    let W = 0;
    let cur = new Uint8Array(0);
    let y = 0; // next draw position (css px)
    let lastY = 0; // y where `cur` was last drawn

    function alloc() {
      W = Math.min(MAX_W, Math.max(8, Math.floor(w / cell)));
      cur = new Uint8Array(W);
      cur[W >> 1] = 1; // single center seed
      y = 0;
      lastY = 0;
    }

    function computeNext(): Uint8Array {
      const next = new Uint8Array(W);
      for (let i = 0; i < W; i++) {
        const l = cur[(i - 1 + W) % W];
        const s = cur[i];
        const r = cur[(i + 1) % W];
        next[i] = ruleTable[(l << 2) | (s << 1) | r];
      }
      return next;
    }

    function drawRow(row: Uint8Array, ry: number) {
      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, ry, w, cell);
      const useGlow = W <= 96;
      if (useGlow) {
        ctx.shadowBlur = 6;
        ctx.shadowColor = `rgb(${BRIGHT})`;
      }
      ctx.fillStyle = `rgb(${BRIGHT})`;
      for (let i = 0; i < W; i++) {
        if (row[i]) ctx.fillRect(i * cell + 1, ry + 1, cell - 2, cell - 2);
      }
      if (useGlow) ctx.shadowBlur = 0;
    }

    function step() {
      const next = computeNext();
      if (y + cell > h) {
        // Scroll the whole canvas up by one cell. Done on the identity
        // transform with an integer device-pixel shift so nothing blurs;
        // restore brings the dpr scale back for the fills below.
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(
          canvas,
          0,
          0,
          canvas.width,
          canvas.height,
          0,
          -CELL_DEVICE,
          canvas.width,
          canvas.height,
        );
        ctx.restore();
        ctx.fillStyle = `rgb(${BG})`;
        ctx.fillRect(0, h - cell, w, cell);
        y -= cell;
      }
      drawRow(next, y);
      cur = next;
      lastY = y;
      y += cell;
    }

    // Pointer paints a 3-cell neighborhood in the current (bottom) row,
    // feeding the perturbation into the next generation. The newly-live
    // cells are also stamped at once for immediate visual feedback.
    function paint(clientX: number) {
      const r = canvas.getBoundingClientRect();
      const col = Math.floor((clientX - r.left) / cell);
      if (col < 0 || col >= W) return;
      ctx.fillStyle = `rgb(${BRIGHT})`;
      for (let k = -1; k <= 1; k++) {
        const c = col + k;
        if (c >= 0 && c < W) {
          cur[c] = 1;
          ctx.fillRect(c * cell + 1, lastY + 1, cell - 2, cell - 2);
        }
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
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, 0, w, h);
      alloc();
    }

    function staticFill() {
      while (y + cell <= h) step();
    }

    resize();
    if (reduced) {
      staticFill();
    } else {
      let acc = 0;
      let lastT = performance.now();
      const tick = (now: number) => {
        acc += now - lastT;
        lastT = now;
        if (visible && acc >= STEP_MS) {
          // Bound catch-up so a backgrounded tab doesn't dump rows on return.
          let n = 0;
          while (acc >= STEP_MS && n < 4) {
            step();
            acc -= STEP_MS;
            n++;
          }
          if (n === 4) acc = 0;
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }

    const onMove = (e: PointerEvent) => paint(e.clientX);
    const onDown = (e: PointerEvent) => paint(e.clientX);
    if (!reduced) {
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerdown", onDown);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) staticFill();
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
      el.removeEventListener("pointerdown", onDown);
      canvas.remove();
    };
  });
</script>

<div bind:this={host} class={`automaton ${className}`} aria-hidden="true"></div>

<style>
  .automaton {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 55%, rgba(164, 255, 190, 0.05), transparent 60%),
      #040805;
    cursor: crosshair;
  }
  .automaton :global(canvas) {
    display: block;
  }
</style>
