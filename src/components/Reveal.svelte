<script lang="ts">
  import type { Snippet } from "svelte";
  import { useInView } from "../lib/motion/useInView";
  import { reveal as revealMotion } from "../lib/motion/reveal";

  interface Props {
    children?: Snippet;
    /** Stagger between children in ms */
    stagger?: number;
    /** Delay before first child reveals in ms */
    delay?: number;
    /** Translate offset in px */
    offset?: number;
    /** Visible threshold (0-1) */
    threshold?: number;
    /** Wrapper class */
    class?: string;
    /** Wrapper element tag */
    as?: keyof HTMLElementTagNameMap;
  }

  let {
    children,
    stagger = 90,
    delay = 0,
    offset = 16,
    threshold = 0.16,
    class: className = "",
    as = "div",
  }: Props = $props();

  function fire(node: HTMLElement) {
    revealMotion(node, { stagger, delay, offset });
  }
</script>

<svelte:element
  this={as}
  class={className}
  data-reveal
  use:useInView={{ threshold, once: true, onEnter: fire }}
>
  {@render children?.()}
</svelte:element>
