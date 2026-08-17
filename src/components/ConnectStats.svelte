<script lang="ts">
  /**
   * ConnectStats — live telemetry from GET /api/stats: how many agents have
   * connected over MCP, what they called, and which machine surfaces get
   * consumed. Social proof for the agent-first pitch, fed by the same
   * Supabase store as everything else.
   *
   * Renders a fixed-height skeleton first so the numbers arriving never
   * shift the page (the layout-jump bug this section must not reintroduce);
   * collapses only if the stats API is unavailable.
   */
  import { onMount } from "svelte";

  interface Props {
    lang?: string;
  }
  let { lang = "en" }: Props = $props();
  const pt = lang.startsWith("pt");

  type Stats = {
    mcp_events_total?: number;
    mcp_events_7d?: number;
    mcp_clients?: Record<string, number>;
    mcp_tool_calls?: Record<string, number>;
    agent_hits_by_surface?: Record<string, number>;
    views_total?: number;
    likes_total?: number;
  };

  let stats = $state<Stats | null>(null);
  let failed = $state(false);

  const labels = pt
    ? {
        mcp: "chamadas MCP",
        week: "últimos 7 dias",
        agents: "agents distintos",
        curl: "resumes via curl",
        views: "views no blog",
        likes: "likes no blog",
        tools: "tools mais chamadas",
        live: "ao vivo — direto do banco",
      }
    : {
        mcp: "MCP calls",
        week: "last 7 days",
        agents: "distinct agents",
        curl: "resumes served to curl",
        views: "blog views",
        likes: "blog likes",
        tools: "most-called tools",
        live: "live — straight from the store",
      };

  const fmt = (n: number | undefined) => (typeof n === "number" ? n.toLocaleString("en-US") : "—");

  const topTools = $derived(
    Object.entries(stats?.mcp_tool_calls ?? {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3),
  );

  const load = async () => {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) {
        failed = stats === null;
        return;
      }
      const data: Stats & { mcp_events_total?: unknown } = await res.json();
      if (typeof data.mcp_events_total !== "number") {
        failed = stats === null;
        return;
      }
      stats = data;
      failed = false;
    } catch {
      failed = stats === null;
    }
  };

  onMount(() => {
    void load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  });
</script>

{#if !failed}
  <div class="stats" class:stats--loading={stats === null}>
    <div class="stats__bar">
      <span class="stats__dot" aria-hidden="true"></span>
      <span class="stats__live">{labels.live}</span>
    </div>
    <dl class="stats__grid">
      <div class="stats__cell">
        <dt>{labels.mcp}</dt>
        <dd>{fmt(stats?.mcp_events_total)}</dd>
      </div>
      <div class="stats__cell">
        <dt>{labels.week}</dt>
        <dd>{fmt(stats?.mcp_events_7d)}</dd>
      </div>
      <div class="stats__cell">
        <dt>{labels.agents}</dt>
        <dd>{fmt(stats ? Object.keys(stats.mcp_clients ?? {}).length : undefined)}</dd>
      </div>
      <div class="stats__cell">
        <dt>{labels.curl}</dt>
        <dd>{fmt(stats?.agent_hits_by_surface?.["terminal-resume"] ?? (stats ? 0 : undefined))}</dd>
      </div>
      <div class="stats__cell">
        <dt>{labels.views}</dt>
        <dd>{fmt(stats?.views_total)}</dd>
      </div>
      <div class="stats__cell">
        <dt>{labels.likes}</dt>
        <dd>{fmt(stats?.likes_total)}</dd>
      </div>
    </dl>
    <p class="stats__tools">
      <span class="stats__tools-label">{labels.tools}:</span>
      {#if topTools.length > 0}
        {#each topTools as [tool, count], i}
          <code>{tool}</code><span class="stats__count">×{count}</span>{i < topTools.length - 1 ? " · " : ""}
        {/each}
      {:else}
        <span class="stats__count">—</span>
      {/if}
    </p>
  </div>
{/if}

<style>
  .stats {
    border: 1px solid var(--line);
    border-radius: var(--radius-card, 12px);
    background: #06080c;
    padding: 1.1rem 1.2rem;
    font-family: var(--font-mono);
    min-height: 172px;
  }
  .stats--loading dd,
  .stats--loading .stats__count {
    animation: stats-pulse 1.2s ease-in-out infinite;
  }
  @keyframes stats-pulse {
    50% { opacity: 0.35; }
  }

  .stats__bar {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .stats__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent, #00ff41);
    box-shadow: 0 0 10px rgba(0, 255, 65, 0.6);
    animation: stats-pulse 1.6s ease-in-out infinite;
  }
  .stats__live {
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted-soft);
  }

  .stats__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.9rem 1.4rem;
    margin: 0;
  }
  @media (min-width: 720px) {
    .stats__grid { grid-template-columns: repeat(3, 1fr); }
  }
  .stats__cell dt {
    font-size: 0.68rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted-soft);
  }
  .stats__cell dd {
    margin: 0.15rem 0 0;
    font-size: 1.35rem;
    color: var(--accent-soft, #4ade80);
    text-shadow: 0 0 14px rgba(0, 255, 65, 0.25);
  }

  .stats__tools {
    margin: 1rem 0 0;
    font-size: 0.75rem;
    color: var(--muted);
  }
  .stats__tools-label {
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted-soft);
    margin-right: 0.4rem;
  }
  .stats__tools code { color: var(--accent-soft, #4ade80); }
  .stats__count { color: var(--muted); }
</style>
