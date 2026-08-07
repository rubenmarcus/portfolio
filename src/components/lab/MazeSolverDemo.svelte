<script lang="ts">
  /**
   * MazeSolverDemo — lab drop 012. A perfect maze carved by the recursive
   * backtracker, then solved by a BFS wavefront that floods outward from the
   * entrance leaving a dim phosphor wash; once the flood reaches the exit,
   * the shortest path is traced back in bright green. After a short hold the
   * cycle restarts with a fresh maze. Walls are prerendered to an offscreen
   * canvas once per maze.
   *
   * Standalone on purpose — canvas 2D, no deps.
   *
   * Cost discipline: DPR capped at 1.5, grid sized from card area, paused
   * while offscreen, prefers-reduced-motion → a solved maze drawn once as a
   * static frame.
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

    // ── Maze state ──
    const T = 1;
    const R = 2;
    const B = 4;
    const L = 8;
    let cell = 14;
    let cols = 0;
    let rows = 0;
    let walls = new Uint8Array(0);
    let dist = new Int32Array(0);
    let parent = new Int32Array(0);
    let order: number[] = []; // BFS visitation order
    let path: number[] = []; // solution, entrance → exit

    let wallCanvas: HTMLCanvasElement | null = null;

    let revealed = 0; // wavefront cells revealed so far
    let phase: "solve" | "trace" | "hold" = "solve";
    let phaseT = 0;
    let pathLen = 0;

    function idx(cx: number, cy: number) {
      return cy * cols + cx;
    }

    function generate() {
      cell = Math.max(10, Math.floor(Math.min(w, h) / 26));
      cols = Math.max(6, Math.floor(w / cell));
      rows = Math.max(6, Math.floor(h / cell));
      const n = cols * rows;
      walls = new Uint8Array(n).fill(15);
      const seen = new Uint8Array(n);

      // Recursive backtracker (iterative stack).
      const stack = [0];
      seen[0] = 1;
      while (stack.length > 0) {
        const curI = stack[stack.length - 1];
        const cx = curI % cols;
        const cy = (curI / cols) | 0;
        const opts: number[] = [];
        if (cy > 0 && !seen[curI - cols]) opts.push(0); // up
        if (cx < cols - 1 && !seen[curI + 1]) opts.push(1); // right
        if (cy < rows - 1 && !seen[curI + cols]) opts.push(2); // down
        if (cx > 0 && !seen[curI - 1]) opts.push(3); // left
        if (opts.length === 0) {
          stack.pop();
          continue;
        }
        const d = opts[Math.floor(Math.random() * opts.length)];
        let nxt = curI;
        if (d === 0) {
          walls[curI] &= ~T;
          nxt = curI - cols;
          walls[nxt] &= ~B;
        } else if (d === 1) {
          walls[curI] &= ~R;
          nxt = curI + 1;
          walls[nxt] &= ~L;
        } else if (d === 2) {
          walls[curI] &= ~B;
          nxt = curI + cols;
          walls[nxt] &= ~T;
        } else {
          walls[curI] &= ~L;
          nxt = curI - 1;
          walls[nxt] &= ~R;
        }
        seen[nxt] = 1;
        stack.push(nxt);
      }

      // BFS from entrance (0,0) — order[] doubles as the wavefront timeline.
      dist = new Int32Array(n).fill(-1);
      parent = new Int32Array(n).fill(-1);
      order = [];
      const queue = [0];
      dist[0] = 0;
      for (let qi = 0; qi < queue.length; qi++) {
        const curI = queue[qi];
        order.push(curI);
        const cx = curI % cols;
        const cy = (curI / cols) | 0;
        const wv = walls[curI];
        if (!(wv & T) && dist[curI - cols] < 0) {
          dist[curI - cols] = dist[curI] + 1;
          parent[curI - cols] = curI;
          queue.push(curI - cols);
        }
        if (!(wv & R) && dist[curI + 1] < 0) {
          dist[curI + 1] = dist[curI] + 1;
          parent[curI + 1] = curI;
          queue.push(curI + 1);
        }
        if (!(wv & B) && dist[curI + cols] < 0) {
          dist[curI + cols] = dist[curI] + 1;
          parent[curI + cols] = curI;
          queue.push(curI + cols);
        }
        if (!(wv & L) && dist[curI - 1] < 0) {
          dist[curI - 1] = dist[curI] + 1;
          parent[curI - 1] = curI;
          queue.push(curI - 1);
        }
      }

      // Walk parents back from the exit → solution path.
      path = [];
      for (let i = n - 1; i >= 0; i = parent[i]) {
        path.push(i);
        if (i === 0) break;
      }
      path.reverse();

      prerenderWalls();
      revealed = 0;
      pathLen = 0;
      phase = "solve";
      phaseT = 0;
    }

    function prerenderWalls() {
      wallCanvas = document.createElement("canvas");
      wallCanvas.width = Math.round(w * dpr);
      wallCanvas.height = Math.round(h * dpr);
      const wctx = wallCanvas.getContext("2d");
      if (!wctx) return;
      wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      wctx.strokeStyle = `rgba(${GREEN}, 0.3)`;
      wctx.lineWidth = 1;
      wctx.beginPath();
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const wv = walls[idx(cx, cy)];
          const x = cx * cell;
          const y = cy * cell;
          if (wv & T) {
            wctx.moveTo(x, y);
            wctx.lineTo(x + cell, y);
          }
          if (wv & L) {
            wctx.moveTo(x, y);
            wctx.lineTo(x, y + cell);
          }
          if (cy === rows - 1 && wv & B) {
            wctx.moveTo(x, y + cell);
            wctx.lineTo(x + cell, y + cell);
          }
          if (cx === cols - 1 && wv & R) {
            wctx.moveTo(x + cell, y);
            wctx.lineTo(x + cell, y + cell);
          }
        }
      }
      wctx.stroke();
    }

    function cellDot(i: number, style: string, size: number) {
      const cx = i % cols;
      const cy = (i / cols) | 0;
      ctx.fillStyle = style;
      const o = (cell - size) / 2;
      ctx.fillRect(cx * cell + o, cy * cell + o, size, size);
    }

    function frame() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, 0, w, h);
      if (wallCanvas) ctx.drawImage(wallCanvas, 0, 0, w, h);

      if (phase === "solve") {
        // Advance the flood so a full solve takes ~3.5s.
        revealed = Math.min(
          order.length,
          revealed + Math.max(2, Math.ceil(order.length / 210)),
        );
        if (revealed >= order.length) {
          phase = "trace";
          phaseT = 0;
        }
      } else if (phase === "trace") {
        pathLen = Math.min(path.length, pathLen + Math.max(1, path.length / 90));
        if (pathLen >= path.length) {
          phase = "hold";
          phaseT = 0;
        }
      } else {
        phaseT++;
        if (phaseT > 130) generate();
      }

      // The phosphor wash: revealed flood cells, brighter near the frontier.
      const wash = Math.floor(revealed);
      for (let k = 0; k < wash; k++) {
        const recent = k > wash - 40;
        cellDot(
          order[k],
          recent ? `rgba(${BRIGHT}, 0.65)` : `rgba(${GREEN}, 0.13)`,
          recent ? cell * 0.5 : cell * 0.42,
        );
      }

      // Solution path traced bright, entrance → exit.
      const traced = Math.floor(pathLen);
      ctx.strokeStyle = `rgba(${BRIGHT}, 0.9)`;
      ctx.lineWidth = Math.max(1.4, cell * 0.14);
      ctx.beginPath();
      for (let k = 0; k < traced; k++) {
        const i = path[k];
        const x = (i % cols) * cell + cell / 2;
        const y = ((i / cols) | 0) * cell + cell / 2;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    function renderStatic() {
      // Fully solved maze: flood wash + complete path, drawn once.
      revealed = order.length;
      pathLen = path.length;
      frame();
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
      generate();
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

    // Pointer: click restarts the cycle with a fresh maze.
    const onDown = () => {
      generate();
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

<div bind:this={host} class={`maze-solver ${className}`} aria-hidden="true"></div>

<style>
  .maze-solver {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 50%, rgba(0, 255, 65, 0.03), transparent 70%),
      #020503;
    cursor: crosshair;
  }
  .maze-solver :global(canvas) {
    display: block;
  }
</style>
