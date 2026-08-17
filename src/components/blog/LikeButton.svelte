<script lang="ts">
  /**
   * LikeButton — per-post likes via GET/POST /api/likes. One like per
   * browser (localStorage); optimistic toggle that reverts on failure.
   * Hidden entirely until the first read succeeds, like ViewCounter.
   */
  import { onMount } from "svelte";

  interface Props {
    /** Post slug — the post_likes primary key (translation key, EN+PT share it). */
    slug: string;
  }
  let { slug }: Props = $props();

  let likes = $state<number | null>(null);
  let liked = $state(false);
  let busy = $state(false);

  const storageKey = `liked:${slug}`;

  onMount(async () => {
    try {
      liked = Boolean(localStorage.getItem(storageKey));
      const res = await fetch(`/api/likes?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) return;
      const data: { likes?: unknown } = await res.json();
      if (typeof data.likes !== "number") return;
      likes = data.likes;
    } catch {
      // Offline, blocked, misconfigured — stay invisible.
    }
  });

  const toggle = async () => {
    if (likes === null || busy) return;
    busy = true;
    const delta = liked ? -1 : 1;
    liked = !liked;
    likes = Math.max(likes + delta, 0);
    try {
      if (liked) localStorage.setItem(storageKey, "1");
      else localStorage.removeItem(storageKey);
    } catch {
      // Private mode — the optimistic state still applies for this visit.
    }
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, delta }),
      });
      if (res.ok) {
        const data: { likes?: unknown } = await res.json();
        if (typeof data.likes === "number") likes = data.likes;
      } else {
        liked = !liked;
        likes = Math.max(likes - delta, 0);
      }
    } catch {
      liked = !liked;
      likes = Math.max(likes - delta, 0);
    }
    busy = false;
  };
</script>

{#if likes !== null}
  <button
    class="like-button"
    class:liked
    onclick={toggle}
    aria-pressed={liked}
    title={liked ? "Unlike" : "Like this post"}
  >
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill={liked ? "currentColor" : "none"}
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      />
    </svg>
    <span>{likes.toLocaleString("en-US")}</span>
  </button>
{/if}

<style>
  .like-button {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    transition: color 0.18s ease;
  }
  .like-button:hover {
    color: var(--accent-soft, #4ade80);
  }
  .like-button.liked {
    color: var(--accent-soft, #4ade80);
    text-shadow: 0 0 12px rgba(0, 255, 65, 0.35);
  }
</style>
