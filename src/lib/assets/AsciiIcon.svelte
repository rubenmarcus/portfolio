<script lang="ts">
  /**
   * AsciiIcon — flat ASCII render of a voxel grid in a <pre>.
   * SSR-friendly: used without client:* in .astro pages it ships zero JS.
   * `animate` adds a subtle CardAscii-style glyph morph (hydrated only,
   * skipped under prefers-reduced-motion).
   */

  import { onMount } from "svelte";
  import { VOXEL_ICONS, type VoxelIconName } from "./registry";
  import { getParsed, asciiRows, seededRng, HEIGHT_GLYPHS } from "./grid";
  import { GLYPH_COLOR } from "./palette";

  interface Props {
    name: VoxelIconName;
    fontSize?: string;
    color?: string;
    /** Present → role="img" with this label; absent → decorative (aria-hidden). */
    label?: string;
    animate?: boolean;
    class?: string;
  }

  let {
    name,
    fontSize = "0.62rem",
    color = GLYPH_COLOR,
    label,
    animate = false,
    class: className = "",
  }: Props = $props();

  const baseRows = $derived(asciiRows(getParsed(VOXEL_ICONS[name])));
  let morphRows = $state<string[] | null>(null);
  const rows = $derived(morphRows ?? baseRows);

  onMount(() => {
    if (!animate) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rand = seededRng(name);
    const interval = setInterval(() => {
      const src = asciiRows(getParsed(VOXEL_ICONS[name]));
      const y = Math.floor(rand() * src.length);
      const row = src[y];
      if (!row) return;
      const x = Math.floor(rand() * row.length);
      if (row[x] === " ") return; // only morph filled cells
      const glyph = HEIGHT_GLYPHS[1 + Math.floor(rand() * 4)] ?? "░";
      src[y] = row.slice(0, x) + glyph + row.slice(x + 1);
      morphRows = src;
    }, 1600);
    return () => clearInterval(interval);
  });
</script>

{#if label}
  <pre class={`ascii-icon ${className}`} style:font-size={fontSize} style:color role="img" aria-label={label}>{rows.join("\n")}</pre>
{:else}
  <pre class={`ascii-icon ${className}`} style:font-size={fontSize} style:color aria-hidden="true">{rows.join("\n")}</pre>
{/if}

<style>
  .ascii-icon {
    margin: 0;
    font-family: var(--font-mono);
    line-height: 1.05;
    letter-spacing: 0.08em;
    user-select: none;
    white-space: pre;
  }
</style>
