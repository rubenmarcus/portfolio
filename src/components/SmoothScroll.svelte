<script lang="ts">
  import { onMount } from "svelte";
  import Lenis from "lenis";

  onMount(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
      // Lenis swallows wheel events for the whole document, so any overlay
      // with its own scroll container never receives them — the page scrolls
      // behind the open panel instead. The aeo.js widget is injected by the
      // integration and cannot know about Lenis, so opt its scroller out here.
      // Measured: with Lenis the panel stayed at scrollTop 0 while the page
      // moved 1500px; opted out, the panel scrolls and the page holds.
      prevent: (node: HTMLElement) => node.closest?.("[data-lenis-prevent], .aeo-content-area") != null,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // This island is persisted across view transitions, so Lenis keeps its
    // internal scroll position after a route change — the new page then
    // renders scrolled into empty space. Snap back to top on every swap.
    const resetScroll = () => lenis.scrollTo(0, { immediate: true, force: true });
    document.addEventListener("astro:after-swap", resetScroll);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("astro:after-swap", resetScroll);
      lenis.destroy();
    };
  });
</script>
