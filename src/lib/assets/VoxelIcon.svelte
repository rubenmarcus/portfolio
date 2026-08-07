<script lang="ts">
  /**
   * VoxelIcon — Tier A pseudo-3D icon. Renders the voxel grid once on a 2D
   * canvas (no continuous rAF); hovering tweens the projection angle ~180ms.
   * Cheap enough for dozens per page.
   */

  import { onMount } from "svelte";
  import { VOXEL_ICONS, type VoxelIconName } from "./registry";
  import { getParsed } from "./grid";
  import { renderIso } from "./render-iso";

  interface Props {
    name: VoxelIconName;
    /** CSS pixel size of the (square) icon. */
    size?: number;
    /** Present → role="img"; absent → decorative aria-hidden. */
    label?: string;
    interactive?: boolean;
    class?: string;
  }

  let { name, size = 48, label, interactive = true, class: className = "" }: Props = $props();

  let canvasEl: HTMLCanvasElement | null = $state(null);
  let painted = $state(false);

  let angle = 0;
  let raf = 0;
  let reducedMotion = false;

  function paint() {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.round(size * dpr);
    if (canvasEl.width !== px) {
      canvasEl.width = px;
      canvasEl.height = px;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderIso(ctx, getParsed(VOXEL_ICONS[name]), size, angle);
  }

  function tweenTo(target: number) {
    cancelAnimationFrame(raf);
    if (reducedMotion) {
      angle = target;
      paint();
      return;
    }
    const from = angle;
    const start = performance.now();
    const DURATION = 180;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - (1 - t) * (1 - t); // ease-out quad
      angle = from + (target - from) * eased;
      paint();
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  onMount(() => {
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    paint();
    painted = true;
    return () => cancelAnimationFrame(raf);
  });

  $effect(() => {
    // Re-render when the icon name changes after mount.
    void name;
    if (painted) paint();
  });
</script>

{#if label}
  <span
    class={`voxel-icon ${className}`}
    class:voxel-icon--painted={painted}
    style:width={`${size}px`}
    style:height={`${size}px`}
    role="img"
    aria-label={label}
    onpointerenter={interactive ? () => tweenTo(1) : undefined}
    onpointerleave={interactive ? () => tweenTo(0) : undefined}
  >
    <canvas bind:this={canvasEl}></canvas>
  </span>
{:else}
  <span
    class={`voxel-icon ${className}`}
    class:voxel-icon--painted={painted}
    style:width={`${size}px`}
    style:height={`${size}px`}
    aria-hidden="true"
    onpointerenter={interactive ? () => tweenTo(1) : undefined}
    onpointerleave={interactive ? () => tweenTo(0) : undefined}
  >
    <canvas bind:this={canvasEl}></canvas>
  </span>
{/if}

<style>
  /* Fixed box + fade-in so hydration never causes layout shift or flash. */
  .voxel-icon {
    display: inline-block;
    flex: none;
  }
  .voxel-icon canvas {
    display: block;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 150ms var(--ease-default);
  }
  .voxel-icon--painted canvas {
    opacity: 1;
  }
  @media (prefers-reduced-motion: reduce) {
    .voxel-icon canvas {
      transition: none;
    }
  }
</style>
