<script lang="ts">
  import { onMount } from "svelte";
  import Lenis from "lenis";
  import { registerLenis } from "../lib/motion/scroll";

  onMount(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    // Keep GSAP ScrollTrigger in sync with Lenis-driven scroll positions.
    registerLenis(lenis);

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
