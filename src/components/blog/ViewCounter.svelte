<script lang="ts">
  /**
   * ViewCounter — per-post view counter backed by Supabase PostgREST.
   *
   * Behavior:
   *   - Reads PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY from
   *     import.meta.env. If either is missing the component renders
   *     NOTHING (no placeholder, no network calls).
   *   - First mount per browser session calls the `increment_view` RPC and
   *     displays the returned count; a sessionStorage flag prevents a
   *     refresh from double-counting. Later mounts in the same session
   *     fetch the current count read-only instead.
   *   - Any network/API failure renders nothing.
   *
   * ── Supabase setup (run once in the SQL editor) ──────────────────────
   *
   *   -- 1. Counter table: one row per post slug.
   *   create table if not exists public.page_views (
   *     slug  text   primary key,
   *     views bigint not null default 0
   *   );
   *
   *   -- 2. Atomic increment-and-return RPC (called from the client).
   *   create or replace function public.increment_view(page_slug text)
   *   returns bigint
   *   language plpgsql
   *   as $$
   *   declare
   *     new_views bigint;
   *   begin
   *     insert into public.page_views (slug, views)
   *     values (page_slug, 1)
   *     on conflict (slug)
   *     do update set views = page_views.views + 1
   *     returning views into new_views;
   *     return new_views;
   *   end;
   *   $$;
   *
   *   -- 3. Anonymous access: read counts + call the RPC. No insert/update
   *   --    on the table itself — all writes go through the function.
   *   alter table public.page_views enable row level security;
   *
   *   create policy "page_views are publicly readable"
   *     on public.page_views for select
   *     using (true);
   *
   *   grant execute on function public.increment_view(text) to anon;
   *   grant execute on function public.increment_view(text) to authenticated;
   *
   * ──────────────────────────────────────────────────────────────────────
   */

  import { onMount } from "svelte";

  interface Props {
    /** Post slug — used as the page_views primary key. */
    slug: string;
  }
  let { slug }: Props = $props();

  const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
  const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
  const enabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

  let views = $state<number | null>(null);

  onMount(async () => {
    if (!enabled) return;

    const base = SUPABASE_URL!.replace(/\/+$/, "");
    const headers = {
      apikey: SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${SUPABASE_ANON_KEY!}`,
      "Content-Type": "application/json",
    };
    const sessionKey = `viewed:${slug}`;

    try {
      if (!sessionStorage.getItem(sessionKey)) {
        // First view this session — increment and read back the new count.
        const res = await fetch(`${base}/rest/v1/rpc/increment_view`, {
          method: "POST",
          headers,
          body: JSON.stringify({ page_slug: slug }),
        });
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (typeof data !== "number") return;
        views = data;
        sessionStorage.setItem(sessionKey, "1");
      } else {
        // Already counted this session — read-only fetch of the current count.
        const res = await fetch(
          `${base}/rest/v1/page_views?slug=eq.${encodeURIComponent(slug)}&select=views`,
          { headers },
        );
        if (!res.ok) return;
        const rows: Array<{ views: number }> = await res.json();
        if (typeof rows?.[0]?.views !== "number") return;
        views = rows[0].views;
      }
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
