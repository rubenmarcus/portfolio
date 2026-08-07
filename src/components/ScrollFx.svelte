<script lang="ts">
  /**
   * Site-wide scroll FX bootstrap — mounted once in BaseLayout.
   * Wires GSAP reveals for every [data-reveal] block and the magnetic
   * pull on [data-magnetic] buttons. Reduced-motion users get final
   * states instantly.
   */
  import { onMount } from "svelte";
  import { initScrollFx, initMagnetic } from "../lib/motion/scroll";

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

    return () => {
      cleanupFx();
      cleanupMagnetic();
    };
  });
</script>
