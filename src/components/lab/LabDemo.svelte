<script lang="ts">
  /**
   * LabDemo — hydration shim for the /lab grid. Astro can't hydrate
   * dynamically-selected components, so the page passes a slug and this
   * island resolves it from the shared registry (./registry.ts), the same
   * map LabSource reads from for the per-card "source" modal.
   */

  import { labRegistry } from "./registry";

  interface Props {
    slug: string;
  }
  let { slug }: Props = $props();

  const Demo = labRegistry[slug]?.component;
</script>

{#if Demo}
  <Demo />
{/if}
