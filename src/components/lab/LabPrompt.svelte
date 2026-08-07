<script lang="ts">
  /**
   * LabPrompt — per-card "prompt" trigger for the /lab grid. Resolves the
   * demo's AI prompt from ./registry and opens it in the shared PromptModal.
   * Renders nothing for unknown slugs. Mirrors LabSource.
   */

  import { labRegistry } from "./registry";
  import PromptModal from "./PromptModal.svelte";

  interface Props {
    slug: string;
    label?: string;
    title?: string;
    copyLabel?: string;
    copiedLabel?: string;
    closeLabel?: string;
    wordsLabel?: string;
  }
  let {
    slug,
    label = "prompt",
    title = "AI prompt",
    copyLabel = "copy",
    copiedLabel = "copied",
    closeLabel = "close",
    wordsLabel = "words",
  }: Props = $props();

  const entry = labRegistry[slug];
  let open = $state(false);
</script>

{#if entry}
  <button
    type="button"
    class="lab-prompt"
    aria-haspopup="dialog"
    onclick={() => (open = true)}
  >
    <span class="lab-prompt__glyph" aria-hidden="true">✦</span>
    {label}
  </button>

  <PromptModal
    bind:open
    title={`${title} — ${entry.filename}`}
    code={entry.prompt}
    {copyLabel}
    {copiedLabel}
    {closeLabel}
    {wordsLabel}
  />
{/if}

<style>
  .lab-prompt {
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
  .lab-prompt:hover {
    color: var(--accent);
    border-color: rgba(0, 255, 65, 0.45);
    background: rgba(0, 255, 65, 0.07);
    box-shadow: 0 0 18px rgba(0, 255, 65, 0.12);
  }
  .lab-prompt__glyph {
    font-size: 0.66rem;
    color: var(--accent-deep);
    transition: color var(--duration-hover) var(--ease-default);
  }
  .lab-prompt:hover .lab-prompt__glyph {
    color: var(--accent);
  }
</style>
