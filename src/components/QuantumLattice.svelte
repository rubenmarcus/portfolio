<script lang="ts">
  /**
   * Site-wide ambient lattice — ported from quantum-website's QuantumLatticeCanvas.
   * Pure Canvas 2D, no Three.js. Renders a jittered grid of nodes with
   * sparse wireframe edges, three slowly-drifting "focus points" that send
   * ripple waves through the lattice, and the occasional pulse traveling
   * along an edge. Tuned for ice-blue.
   */

  import { onMount } from "svelte";

  interface Props {
    class?: string;
    /** Caps total node count. Lower = cheaper. */
    maxPoints?: number;
    /** Edge color tint, rgba string. */
    edgeColor?: string;
    /** Node fill color tint, rgba string. */
    nodeColor?: string;
    /** Pulse color tint, rgba string. */
    pulseColor?: string;
  }

  interface Point {
    x: number;
    y: number;
    phase: number;
    gridX: number;
    gridY: number;
  }

  interface Edge {
    a: number;
    b: number;
  }

  interface Pulse {
    edgeIndex: number;
    progress: number;
    speed: number;
  }

  let {
    class: className = "",
    maxPoints = 8000,
    edgeColor = "rgba(164, 203, 245, 1)",
    nodeColor = "rgba(190, 224, 255, 1)",
    pulseColor = "rgba(140, 202, 255, 0.65)",
  }: Props = $props();

  let canvasEl: HTMLCanvasElement | null = $state(null);
  let context: CanvasRenderingContext2D | null = null;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let points: Point[] = [];
  let edges: Edge[] = [];
  let pulses: Pulse[] = [];

  let animationFrame = 0;
  let resizeFrame = 0;
  let lastFrameTime = 0;
  let pulseTimer = 0;
  let mobileMode = false;
  let seed = 0;

  function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
  }

  function hash(value: number): number {
    const x = Math.sin(value) * 10000;
    return x - Math.floor(x);
  }

  function random(): number {
    seed += 1;
    return hash(seed * 0.00017 + 0.391);
  }

  function computeLayout(): void {
    if (!canvasEl) return;

    width = canvasEl.clientWidth;
    height = canvasEl.clientHeight;
    mobileMode = window.matchMedia("(max-width: 767px)").matches;

    dpr = Math.min(window.devicePixelRatio || 1, mobileMode ? 1.3 : 1.55);
    canvasEl.width = Math.max(1, Math.floor(width * dpr));
    canvasEl.height = Math.max(1, Math.floor(height * dpr));

    context = canvasEl.getContext("2d", { alpha: true });
    if (!context) return;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    seed = width * 0.723 + height * 1.193 + 17;
    buildLattice();
  }

  function buildLattice(): void {
    if (width <= 0 || height <= 0) return;

    const area = width * height;
    // Roughly one point per ~90px² — same heuristic as the source.
    const targetCount = mobileMode
      ? clamp(Math.round(area / 110), 2400, 5000)
      : clamp(Math.round(area / 92), 6000, maxPoints);

    const spacing = Math.sqrt(area / targetCount);
    const cols = Math.max(1, Math.floor(width / spacing) + 2);
    const rows = Math.max(1, Math.floor(height / spacing) + 2);

    const xStep = width / (cols - 1 || 1);
    const yStep = height / (rows - 1 || 1);

    points = [];
    edges = [];
    pulses = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const jitterScale = spacing * 0.2;
        const jitterX = (random() - 0.5) * jitterScale;
        const jitterY = (random() - 0.5) * jitterScale;
        points.push({
          x: col * xStep + jitterX,
          y: row * yStep + jitterY,
          phase: random() * Math.PI * 2,
          gridX: col,
          gridY: row,
        });
      }
    }

    const rightChance = mobileMode ? 0.028 : 0.04;
    const downChance = mobileMode ? 0.022 : 0.035;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const index = row * cols + col;
        if (col < cols - 1 && random() < rightChance) edges.push({ a: index, b: index + 1 });
        if (row < rows - 1 && random() < downChance) edges.push({ a: index, b: index + cols });
      }
    }

    const maxEdges = mobileMode ? 1000 : 2200;
    if (edges.length > maxEdges) {
      edges = edges.filter((_e, i) => i % Math.ceil(edges.length / maxEdges) === 0);
    }
  }

  function spawnPulse(): void {
    if (edges.length === 0) return;
    const edgeIndex = Math.floor(random() * edges.length);
    pulses.push({
      edgeIndex,
      progress: 0,
      speed: mobileMode ? 0.00018 : 0.00014,
    });
    if (pulses.length > 3) pulses.shift();
  }

  // Pre-build rgba shells for fast alpha swaps
  function rgbaWith(base: string, alpha: number): string {
    return base.replace(/,\s*[\d.]+\)$/, `, ${alpha.toFixed(3)})`);
  }

  function drawFrame(time: number): void {
    if (!context) return;
    context.clearRect(0, 0, width, height);

    const seconds = time * 0.001;
    const c1x = width * 0.28 + Math.sin(seconds * 0.07) * width * 0.05;
    const c1y = height * 0.35 + Math.cos(seconds * 0.05) * height * 0.04;
    const c2x = width * 0.72 + Math.cos(seconds * 0.04) * width * 0.06;
    const c2y = height * 0.62 + Math.sin(seconds * 0.06) * height * 0.05;
    const c3x = width * 0.52 + Math.sin(seconds * 0.03) * width * 0.04;
    const c3y = height * 0.18 + Math.cos(seconds * 0.045) * height * 0.03;

    const brightness = new Float32Array(points.length);

    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      const dx1 = point.x - c1x, dy1 = point.y - c1y;
      const dx2 = point.x - c2x, dy2 = point.y - c2y;
      const dx3 = point.x - c3x, dy3 = point.y - c3y;

      const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      const dist3 = Math.sqrt(dx3 * dx3 + dy3 * dy3);

      const wave1 = Math.sin(dist1 * 0.024 - seconds * 0.4);
      const wave2 = Math.sin(dist2 * 0.019 - seconds * 0.35);
      const wave3 = Math.sin(dist3 * 0.021 - seconds * 0.28);
      const drift =
        Math.sin(point.gridX * 0.12 + point.gridY * 0.11 + seconds * 0.18 + point.phase) * 0.5 + 0.5;

      brightness[index] = clamp(
        0.14 + wave1 * 0.16 + wave2 * 0.12 + wave3 * 0.1 + drift * 0.14,
        0.02,
        0.85,
      );
    }

    if (edges.length > 0) {
      context.strokeStyle = rgbaWith(edgeColor, mobileMode ? 0.045 : 0.06);
      context.lineWidth = 1;
      context.beginPath();
      for (let i = 0; i < edges.length; i += 1) {
        const edge = edges[i];
        const a = points[edge.a];
        const b = points[edge.b];
        if (!a || !b) continue;
        const edgeGlow = (brightness[edge.a] + brightness[edge.b]) * 0.5;
        if (edgeGlow < 0.28) continue;
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
      }
      context.stroke();
    }

    context.fillStyle = rgbaWith(nodeColor, 1);
    for (let i = 0; i < points.length; i += 1) {
      const p = points[i];
      const v = brightness[i];
      const size = 0.4 + v * 1.3;
      context.globalAlpha = 0.12 + v * 0.48;
      context.fillRect(p.x - size * 0.5, p.y - size * 0.5, size, size);
    }
    context.globalAlpha = 1;

    // Pulses
    for (let i = pulses.length - 1; i >= 0; i -= 1) {
      const pulse = pulses[i];
      const edge = edges[pulse.edgeIndex];
      if (!edge) {
        pulses.splice(i, 1);
        continue;
      }
      const a = points[edge.a];
      const b = points[edge.b];
      if (!a || !b) {
        pulses.splice(i, 1);
        continue;
      }
      pulse.progress += pulse.speed * (mobileMode ? 0.8 : 1);
      if (pulse.progress >= 1) {
        pulses.splice(i, 1);
        continue;
      }
      const x = a.x + (b.x - a.x) * pulse.progress;
      const y = a.y + (b.y - a.y) * pulse.progress;
      context.fillStyle = pulseColor;
      context.beginPath();
      context.arc(x, y, mobileMode ? 1.4 : 1.8, 0, Math.PI * 2);
      context.fill();
    }
  }

  function tick(timestamp: number): void {
    const targetDelta = mobileMode ? 1000 / 30 : 1000 / 55;
    if (!lastFrameTime) lastFrameTime = timestamp;
    const elapsed = timestamp - lastFrameTime;
    if (elapsed >= targetDelta) {
      drawFrame(timestamp);
      lastFrameTime = timestamp;
      pulseTimer += elapsed;
      const pulseInterval = mobileMode ? 4800 : 3800;
      if (pulseTimer >= pulseInterval) {
        spawnPulse();
        pulseTimer = 0;
      }
    }
    animationFrame = requestAnimationFrame(tick);
  }

  function handleResize(): void {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      computeLayout();
      drawFrame(performance.now());
    });
  }

  onMount(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    computeLayout();
    drawFrame(performance.now());
    if (!reduced) animationFrame = requestAnimationFrame(tick);
    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(resizeFrame);
      window.removeEventListener("resize", handleResize);
    };
  });
</script>

<canvas bind:this={canvasEl} class={`quantum-lattice ${className}`} aria-hidden="true"></canvas>

<style>
  .quantum-lattice {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
</style>
