<script lang="ts">
  interface Props {
    /** Words to rotate through. */
    words: string[];
    /** Milliseconds each word remains visible. */
    interval?: number;
    /** Crossfade duration in ms. */
    fadeMs?: number;
    /** Apply italic emphasis (Nillion-style serif italic accent). */
    italic?: boolean;
    /** Class on the rotating span. */
    class?: string;
  }

  let {
    words,
    interval = 2400,
    fadeMs = 320,
    italic = true,
    class: className = "",
  }: Props = $props();

  let index = $state(0);
  let visible = $state(true);

  $effect(() => {
    const tick = () => {
      // fade out
      visible = false;
      const swap = setTimeout(() => {
        index = (index + 1) % words.length;
        visible = true;
      }, fadeMs);
      return () => clearTimeout(swap);
    };

    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  });

  const current = $derived(words[index]);
</script>

<span
  class:rotating={true}
  class:italic
  class={className}
  aria-live="polite"
>
  <span
    class="rotating__inner"
    class:rotating__inner--in={visible}
    style:transition-duration={`${fadeMs}ms`}
  >
    {current}
  </span>
</span>

<style>
  .rotating {
    display: inline-block;
    position: relative;
    color: var(--accent-soft);
  }

  .italic {
    font-style: italic;
    font-family: var(--font-display);
  }

  .rotating__inner {
    display: inline-block;
    opacity: 0;
    transform: translateY(8px);
    transition-property: opacity, transform;
    transition-timing-function: var(--ease-default);
  }

  .rotating__inner--in {
    opacity: 1;
    transform: translateY(0);
  }
</style>
