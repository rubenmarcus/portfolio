<script lang="ts">
  /**
   * PromptModal — companion to SourceModal for the /lab drops. Shows the
   * AI prompt that regenerates the demo (imported as a string from the
   * registry), in a scrollable, wrapping block with copy-to-clipboard.
   *
   * Same accessibility contract as SourceModal: Esc closes, backdrop click
   * closes, Tab is trapped, focus returns to the trigger, body scroll locked.
   */

  import { tick } from "svelte";

  interface Props {
    open: boolean;
    title?: string;
    code: string;
    copyLabel?: string;
    copiedLabel?: string;
    closeLabel?: string;
    wordsLabel?: string;
  }
  let {
    open = $bindable(false),
    title = "AI prompt",
    code,
    copyLabel = "copy",
    copiedLabel = "copied",
    closeLabel = "close",
    wordsLabel = "words",
  }: Props = $props();

  let dialog: HTMLDivElement | null = null;
  let copied = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | undefined;

  const wordCount = $derived(code.trim() ? code.trim().split(/\s+/).length : 0);

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
    class="pm"
    data-lenis-prevent
    onmousedown={(e) => {
      if (e.target === e.currentTarget) open = false;
    }}
  >
    <div
      class="pm__dialog"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabindex="-1"
      bind:this={dialog}
    >
      <header class="pm__head">
        <span class="pm__glyph" aria-hidden="true">✦</span>
        <span class="pm__title">{title}</span>
        <span class="pm__meta">{wordCount} {wordsLabel}</span>
        <div class="pm__actions">
          <button type="button" class="pm__btn" class:pm__btn--done={copied} onclick={copy}>
            {copied ? copiedLabel : copyLabel}
          </button>
          <button
            type="button"
            class="pm__btn pm__btn--close"
            aria-label={closeLabel}
            title={closeLabel}
            onclick={() => (open = false)}
          >✕</button>
        </div>
      </header>
      <div class="pm__code"><p>{code}</p></div>
    </div>
  </div>
{/if}

<style>
  .pm {
    position: fixed;
    inset: 0;
    z-index: 1100;
    display: grid;
    place-items: center;
    padding: 1.25rem;
    /* Darker than SourceModal so the page content reads as fully overlaid. */
    background: rgba(0, 2, 1, 0.93);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    animation: pm-fade var(--duration-default) var(--ease-default);
  }

  .pm__dialog {
    display: flex;
    flex-direction: column;
    width: min(720px, 100%);
    max-height: min(84vh, 84dvh);
    background: #040704;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-card);
    box-shadow:
      0 0 0 1px rgba(0, 255, 65, 0.1),
      0 24px 80px rgba(0, 0, 0, 0.7),
      0 0 140px rgba(0, 255, 65, 0.07);
    overflow: hidden;
    outline: none;
    animation: pm-pop var(--duration-default) var(--ease-emphasis);
  }

  .pm__head {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.7rem 0.9rem;
    border-bottom: 1px solid var(--line);
    background:
      repeating-linear-gradient(0deg, rgba(0, 255, 65, 0.04) 0 1px, transparent 1px 5px),
      rgba(0, 255, 65, 0.02);
  }

  .pm__glyph {
    color: var(--accent-deep);
    font-size: 0.8rem;
  }

  .pm__title {
    font-family: var(--font-mono);
    font-size: 0.74rem;
    color: var(--accent-soft);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pm__meta {
    font-family: var(--font-mono);
    font-size: 0.64rem;
    color: var(--muted-soft);
    letter-spacing: 0.08em;
    margin-right: auto;
    white-space: nowrap;
  }

  .pm__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .pm__btn {
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
  .pm__btn:hover {
    color: var(--accent);
    border-color: rgba(0, 255, 65, 0.45);
    background: rgba(0, 255, 65, 0.06);
  }
  .pm__btn--done {
    color: var(--accent);
    border-color: rgba(0, 255, 65, 0.45);
  }
  .pm__btn--close {
    padding: 0.32rem 0.55rem;
  }

  .pm__code {
    /* flex item in a column dialog: min-height 0 lets it shrink below the
       content size so overflow:auto can actually scroll long prompts. */
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    padding: 1.1rem 1.25rem 1.3rem;
  }
  .pm__code p {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 0.84rem;
    line-height: 1.7;
    color: rgba(245, 241, 234, 0.9);
    white-space: pre-wrap;
    word-break: break-word;
  }
  .pm__code ::selection {
    background: rgba(0, 255, 65, 0.22);
  }

  @keyframes pm-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes pm-pop {
    from { opacity: 0; transform: translateY(10px) scale(0.985); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .pm,
    .pm__dialog {
      animation: none;
    }
  }
</style>
