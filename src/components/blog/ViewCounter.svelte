<script lang="ts">
  /**
   * ViewCounter — per-post view counter backed by GET/POST /api/views.
   *
   * The browser never talks to Supabase: the API route holds the service
   * role key server-side (src/lib/server/supabase.ts) and the schema lives
   * in supabase/schema.sql. First mount per browser session increments
   * (sessionStorage guards refresh double-counting); later mounts read.
   * Any failure renders nothing.
   */
  import { onMount } from "svelte";

  interface Props {
    /** Post slug — the page_views primary key (translation key, EN+PT share it). */
    slug: string;
  }
  let { slug }: Props = $props();

  let views = $state<number | null>(null);

  onMount(async () => {
    const sessionKey = `viewed:${slug}`;
    try {
      const counted = sessionStorage.getItem(sessionKey);
      const res = counted
        ? await fetch(`/api/views?slug=${encodeURIComponent(slug)}`)
        : await fetch("/api/views", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ slug }),
          });
      if (!res.ok) return;
      const data: { views?: unknown } = await res.json();
      if (typeof data.views !== "number") return;
      views = data.views;
      sessionStorage.setItem(sessionKey, "1");
    } catch {
      // Offline, blocked, misconfigured — stay invisible.
    }
  });
</script>

{#if views !== null}
  <span class="view-counter" title="Page views">
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
    <span>{views.toLocaleString("en-US")} views</span>
  </span>
{/if}

<style>
  .view-counter {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: inherit;
  }
</style>
