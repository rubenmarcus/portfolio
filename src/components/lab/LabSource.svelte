<script lang="ts">
  /**
   * LabSource — per-card "source" trigger for the /lab grid. Resolves the
   * demo's raw source from ./registry and opens it in the shared
   * SourceModal. Renders nothing for unknown slugs.
   */

  import { labRegistry } from "./registry";
  import SourceModal from "./SourceModal.svelte";

  interface Props {
    slug: string;
    label?: string;
    copyLabel?: string;
    copiedLabel?: string;
    closeLabel?: string;
    linesLabel?: string;
  }
  let {
    slug,
    label = "source",
    copyLabel = "copy",
    copiedLabel = "copied",
    closeLabel = "close",
    linesLabel = "lines",
  }: Props = $props();

  const entry = labRegistry[slug];
  let open = $state(false);
</script>

{#if entry}
  <button
    type="button"
    class="lab-source"
    aria-haspopup="dialog"
    onclick={() => (open = true)}
  >
    <span class="lab-source__glyph" aria-hidden="true">{"</>"}</span>
    {label}
  </button>

  <SourceModal
    bind:open
    filename={entry.filename}
    code={entry.source}
    {copyLabel}
    {copiedLabel}
    {closeLabel}
    {linesLabel}
  />
{/if}

<style>
  .lab-source {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    font-family: var(--font-mono);
    font-size: 0.66rem;
    letter-spacing: 0.1em;
    color: var(--muted-soft);
    background: rgba(2, 6, 3, 0.55);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 0.28rem 0.6rem;
    cursor: pointer;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    transition:
      color var(--duration-hover) var(--ease-default),
      border-color var(--duration-hover) var(--ease-default),
      background-color var(--duration-hover) var(--ease-default),
      box-shadow var(--duration-hover) var(--ease-default);
  }
  .lab-source:hover {
    color: var(--accent);
    border-color: rgba(0, 255, 65, 0.45);
    background: rgba(0, 255, 65, 0.07);
    box-shadow: 0 0 18px rgba(0, 255, 65, 0.12);
  }
  .lab-source__glyph {
    font-size: 0.62rem;
    color: var(--accent-deep);
    transition: color var(--duration-hover) var(--ease-default);
  }
  .lab-source:hover .lab-source__glyph {
    color: var(--accent);
  }
</style>
