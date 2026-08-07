<script lang="ts">
  /**
   * Site-wide scroll FX bootstrap — mounted once in BaseLayout.
   * Wires GSAP reveals for every [data-reveal] block and the magnetic
   * pull on [data-magnetic] buttons. Reduced-motion users get final
   * states instantly.
   */
  import { onMount } from "svelte";
  import { initScrollFx, initMagnetic, ScrollTrigger } from "../lib/motion/scroll";

  onMount(() => {
    let cleanupFx = () => {};
    let cleanupMagnetic = () => {};
    try {
      cleanupFx = initScrollFx(document);
      cleanupMagnetic = initMagnetic(document);
    } catch {
      // Never leave content hidden if GSAP fails — force everything visible.
      document
        .querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-item]")
        .forEach((el) => {
          el.style.opacity = "1";
          el.style.transform = "none";
        });
    }

    // View transitions: kill every ScrollTrigger before the DOM is swapped
    // (their elements are about to be removed), and re-measure once the new
    // page has been wired up.
    const onBeforeSwap = () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
    const onPageLoad = () => {
      ScrollTrigger.refresh();
    };
    document.addEventListener("astro:before-swap", onBeforeSwap, { once: true });
    document.addEventListener("astro:page-load", onPageLoad);

    return () => {
      cleanupFx();
      cleanupMagnetic();
      document.removeEventListener("astro:page-load", onPageLoad);
      document.removeEventListener("astro:before-swap", onBeforeSwap);
    };
  });
</script>
