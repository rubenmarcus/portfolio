<script lang="ts">
  /**
   * SourceModal — shared "view source" dialog for the /lab drops. Receives
   * a demo's raw source (imported with Vite's `?raw` suffix) and renders it
   * in a scrollable <pre><code> block with a copy-to-clipboard button.
   *
   * Accessibility: Esc closes, backdrop click closes, Tab is trapped inside
   * the dialog, focus returns to the trigger on close, and body scroll is
   * locked while open (same overflow-hidden pattern as the mobile menu).
   */

  import { tick } from "svelte";

  interface Props {
    open: boolean;
    filename: string;
    code: string;
    copyLabel?: string;
    copiedLabel?: string;
    closeLabel?: string;
    linesLabel?: string;
  }
  let {
    open = $bindable(false),
    filename,
    code,
    copyLabel = "copy",
    copiedLabel = "copied",
    closeLabel = "close",
    linesLabel = "lines",
  }: Props = $props();

  let dialog: HTMLDivElement | null = null;
  let copied = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | undefined;

  const lineCount = $derived(code.replace(/\n+$/, "").split("\n").length);

  $effect(() => {
    if (!open) return;
    const restoreFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        open = false;
        return;
      }
      if (e.key === "Tab" && dialog) {
        // Focus trap-ish: cycle Tab/Shift+Tab across the dialog's controls.
        const focusables = dialog.querySelectorAll<HTMLElement>(
          'button, a[href], [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === dialog)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeydown);
    tick().then(() => dialog?.focus());

    return () => {
      window.removeEventListener("keydown", onKeydown);
      document.body.style.overflow = prevOverflow;
      copied = false;
      clearTimeout(copyTimer);
      restoreFocus?.focus?.();
    };
  });

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Non-secure-context fallback.
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    copied = true;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied = false), 1600);
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="sm"
    data-lenis-prevent
    onmousedown={(e) => {
      if (e.target === e.currentTarget) open = false;
    }}
  >
    <div
      class="sm__dialog"
      role="dialog"
      aria-modal="true"
      aria-label={filename}
      tabindex="-1"
      bind:this={dialog}
    >
      <header class="sm__head">
        <span class="sm__file">{filename}</span>
        <span class="sm__meta">{lineCount} {linesLabel}</span>
        <div class="sm__actions">
          <button type="button" class="sm__btn" class:sm__btn--done={copied} onclick={copy}>
            {copied ? copiedLabel : copyLabel}
          </button>
          <button
            type="button"
            class="sm__btn sm__btn--close"
            aria-label={closeLabel}
            title={closeLabel}
            onclick={() => (open = false)}
          >✕</button>
        </div>
      </header>
      <pre class="sm__code"><code>{code}</code></pre>
    </div>
  </div>
{/if}

<style>
  .sm {
    position: fixed;
    inset: 0;
    z-index: 1100; /* above --z-nav */
    display: grid;
    place-items: center;
    padding: 1.25rem;
    /* Dark backdrop so the page content reads as fully overlaid. */
    background: rgba(0, 2, 1, 0.92);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    animation: sm-fade var(--duration-default) var(--ease-default);
  }

  .sm__dialog {
    display: flex;
    flex-direction: column;
    width: min(880px, 100%);
    max-height: min(84vh, 84dvh);
    background: #040704;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-card);
    box-shadow:
      0 0 0 1px rgba(0, 255, 65, 0.08),
      0 24px 80px rgba(0, 0, 0, 0.6),
      0 0 120px rgba(0, 255, 65, 0.05);
    overflow: hidden;
    outline: none;
    animation: sm-pop var(--duration-default) var(--ease-emphasis);
  }

  .sm__head {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.7rem 0.9rem;
    border-bottom: 1px solid var(--line);
    background:
      repeating-linear-gradient(0deg, rgba(0, 255, 65, 0.04) 0 1px, transparent 1px 5px),
      rgba(0, 255, 65, 0.02);
  }

  .sm__file {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: var(--accent-soft);
    letter-spacing: 0.03em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sm__meta {
    font-family: var(--font-mono);
    font-size: 0.64rem;
    color: var(--muted-soft);
    letter-spacing: 0.08em;
    margin-right: auto;
    white-space: nowrap;
  }

  .sm__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sm__btn {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    color: var(--muted);
    background: transparent;
    border: 1px solid var(--line-strong);
    border-radius: 8px;
    padding: 0.32rem 0.7rem;
    cursor: pointer;
    transition:
      color var(--duration-hover) var(--ease-default),
      border-color var(--duration-hover) var(--ease-default),
      background-color var(--duration-hover) var(--ease-default);
  }
  .sm__btn:hover {
    color: var(--accent);
    border-color: rgba(0, 255, 65, 0.45);
    background: rgba(0, 255, 65, 0.06);
  }
  .sm__btn--done {
    color: var(--accent);
    border-color: rgba(0, 255, 65, 0.45);
  }
  .sm__btn--close {
    padding: 0.32rem 0.55rem;
  }

  .sm__code {
    margin: 0;
    padding: 1rem 1.1rem 1.25rem;
    /* flex item in a column dialog: min-height 0 lets it shrink below the
       content size so overflow:auto can actually scroll long sources. */
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    font-family: var(--font-mono);
    font-size: 0.76rem;
    line-height: 1.65;
    color: rgba(245, 241, 234, 0.88);
    tab-size: 2;
  }
  .sm__code code {
    font-family: inherit;
  }
  /* Green-tinted selection, matching the site's selection styling. */
  .sm__code ::selection {
    background: rgba(0, 255, 65, 0.22);
  }

  @keyframes sm-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes sm-pop {
    from { opacity: 0; transform: translateY(10px) scale(0.985); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .sm,
    .sm__dialog {
      animation: none;
    }
  }
</style>
