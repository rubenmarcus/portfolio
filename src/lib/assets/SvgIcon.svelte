<script lang="ts">
  /**
   * SvgIcon — utility/brand SVG tier of the asset lib. Bodies live in the
   * typed registry (svg/ui.ts, svg/logos.ts); rendering via {@html} follows
   * the previous Footer pattern (internal, versioned strings only).
   * SSR-friendly: zero JS when used without client:* in .astro pages.
   */

  import { SVG_ICONS, type SvgIconName } from "./registry";

  interface Props {
    name: SvgIconName;
    size?: number;
    stroke?: number;
    /** Present → role="img"; absent → decorative aria-hidden. */
    label?: string;
    class?: string;
  }

  let { name, size = 16, stroke = 1.6, label, class: className = "" }: Props = $props();

  const def = $derived(SVG_ICONS[name]);
</script>

{#if label}
  <svg
    class={`svg-icon ${className}`}
    width={size}
    height={size}
    viewBox={def.viewBox ?? "0 0 24 24"}
    fill="none"
    stroke="currentColor"
    stroke-width={stroke}
    stroke-linecap="round"
    stroke-linejoin="round"
    role="img"
    aria-label={label}
  >
    {@html def.body}
  </svg>
{:else}
  <svg
    class={`svg-icon ${className}`}
    width={size}
    height={size}
    viewBox={def.viewBox ?? "0 0 24 24"}
    fill="none"
    stroke="currentColor"
    stroke-width={stroke}
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    {@html def.body}
  </svg>
{/if}

<style>
  /* Same base behavior the old Icon.astro provided — call sites animate
     transform/color on hover and rely on this transition. */
  .svg-icon {
    flex-shrink: 0;
    transition:
      transform var(--duration-hover) var(--ease-default),
      color var(--duration-hover) var(--ease-default);
  }
</style>

