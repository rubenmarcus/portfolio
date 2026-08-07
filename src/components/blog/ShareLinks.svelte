<script lang="ts">
  /**
   * ShareLinks — post share row: X intent, LinkedIn shareArticle, and a
   * copy-link button with transient clipboard feedback. Ghost buttons in
   * mono to match the post meta row. SSR-safe: the links work without
   * hydration; only "Copy link" needs JS (falls back to prompt-select).
   */

  import SvgIcon from "../../lib/assets/SvgIcon.svelte";

  interface Props {
    /** Absolute post URL. */
    url: string;
    /** Post title, used as share text. */
    title: string;
  }
  let { url, title }: Props = $props();

  const xHref = $derived(
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  );
  const linkedInHref = $derived(
    `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  );

  let copied = $state(false);
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API unavailable (permissions, non-secure context) — fall
      // back to the legacy execCommand path before giving up.
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        document.body.removeChild(ta);
        return;
      }
      document.body.removeChild(ta);
    }
    copied = true;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => (copied = false), 2000);
  }
</script>

<div class="share-links" aria-label="Share this post">
  <span class="share-links__label">Share</span>

  <a class="share-btn" href={xHref} target="_blank" rel="noopener noreferrer" aria-label="Share on X">
    <SvgIcon name="xTwitter" size={13} />
    <span>X</span>
  </a>

  <a class="share-btn" href={linkedInHref} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">
    <SvgIcon name="linkedin" size={13} />
    <span>LinkedIn</span>
  </a>

  <button class="share-btn" class:share-btn--copied={copied} type="button" onclick={copyLink} aria-live="polite">
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {#if copied}
        <polyline points="20 6 9 17 4 12" />
      {:else}
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      {/if}
    </svg>
    <span>{copied ? "Copied" : "Copy link"}</span>
  </button>
</div>

<style>
  .share-links {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
    font-family: var(--font-mono);
    font-size: 0.72rem;
  }

  .share-links__label {
    color: var(--muted-soft);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-size: 0.66rem;
    margin-right: 0.15rem;
  }

  .share-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.32rem 0.7rem;
    border: 1px solid var(--line);
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--muted);
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
    transition:
      color var(--duration-hover) var(--ease-default),
      border-color var(--duration-hover) var(--ease-default),
      background-color var(--duration-hover) var(--ease-default);
  }
  .share-btn:hover {
    color: var(--text);
    border-color: var(--line-bright);
    background: rgba(245, 241, 234, 0.04);
  }

  .share-btn--copied {
    color: var(--accent-soft);
    border-color: var(--line-strong);
  }
  .share-btn--copied:hover {
    color: var(--accent-soft);
  }
</style>
