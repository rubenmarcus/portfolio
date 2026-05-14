<script lang="ts">
  import { onMount } from "svelte";

  let el: HTMLDivElement | null = $state(null);
  let visible = $state(false);
  let enabled = $state(false);

  onMount(() => {
    // Desktop only — halo is desktop polish
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (coarse || reduced) return;
    enabled = true;

    let x = 0, y = 0, tx = 0, ty = 0;
    let rafId = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        x = tx;
        y = ty;
        visible = true;
      }
    };

    const onLeave = () => {
      visible = false;
    };

    const tick = () => {
      const ease = 0.18;
      x += (tx - x) * ease;
      y += (ty - y) * ease;
      if (el) {
        el.style.setProperty("--cx", `${x}px`);
        el.style.setProperty("--cy", `${y}px`);
      }
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafId);
    };
  });
</script>

{#if enabled}
  <div
    bind:this={el}
    class="cursor-halo"
    class:visible
    aria-hidden="true"
  ></div>
{/if}

<style>
  .cursor-halo {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    opacity: 0;
    transition: opacity 400ms var(--ease-default);
    background:
      radial-gradient(
        circle 340px at var(--cx, 50%) var(--cy, 50%),
        rgba(58, 109, 255, 0.22) 0%,
        rgba(80, 130, 240, 0.1) 30%,
        transparent 65%
      );
    mix-blend-mode: screen;
  }

  .cursor-halo.visible {
    opacity: 1;
  }
</style>
