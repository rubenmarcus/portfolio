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

  type ToolCall = { client: string | null; tool: string; at: string };
  type Stats = {
    mcp_events_total?: number;
    mcp_events_7d?: number;
    mcp_clients?: Record<string, number>;
    mcp_tool_calls?: Record<string, number>;
    agent_hits_by_surface?: Record<string, number>;
    recent_tool_calls?: ToolCall[];
    views_total?: number;
    likes_total?: number;
  };

  let stats = $state<Stats | null>(null);
  let failed = $state(false);
  // Tool filter for the log — null shows every tool's calls.
  let selectedTool = $state<string | null>(null);

  const labels = pt
    ? {
        mcp: "chamadas MCP",
        week: "últimos 7 dias",
        agents: "agents distintos",
        curl: "resumes via curl",
        views: "views no blog",
        likes: "likes no blog",
        filter: "filtrar por tool",
        log: "últimas tool calls",
        live: "ao vivo — direto do banco",
      }
    : {
        mcp: "MCP calls",
        week: "last 7 days",
        agents: "distinct agents",
        curl: "resumes served to curl",
        views: "blog views",
        likes: "blog likes",
        filter: "filter by tool",
        log: "last tool calls",
        live: "live — straight from the store",
      };

  const fmt = (n: number | undefined) => (typeof n === "number" ? n.toLocaleString("en-US") : "—");

  const ago = (iso: string) => {
    const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return pt ? "agora" : "now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  // curl resumes arrive under two surfaces: "terminal-resume" (middleware on
  // SSR pages) and "resume-txt" (Vercel route rewrite on static pages, plus
  // direct /api/resume.txt hits). Both are resumes served to curl.
  const curlResumes = $derived(
    stats
      ? (stats.agent_hits_by_surface?.["terminal-resume"] ?? 0) +
        (stats.agent_hits_by_surface?.["resume-txt"] ?? 0)
      : undefined,
  );

  const topTools = $derived(
    Object.entries(stats?.mcp_tool_calls ?? {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3),
  );

  // Always five rows — padded with blanks — so the box never jumps when the
  // log arrives (same invariant as the fixed-height skeleton).
  const LOG_ROWS = 5;
  const logRows = $derived.by(() => {
    if (!stats) return Array.from({ length: LOG_ROWS }, () => null);
    const rows = (stats.recent_tool_calls ?? [])
      .filter((call) => !selectedTool || call.tool === selectedTool)
      .slice(0, LOG_ROWS);
    return [...rows, ...Array.from({ length: LOG_ROWS - rows.length }, () => null)];
  });

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
        <dd>{fmt(curlResumes)}</dd>
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
    <div class="stats__log">
      <div class="stats__log-head">
        <p class="stats__log-title">{labels.log}</p>
        <div class="stats__log-filters" role="group" aria-label={labels.filter}>
          <button
            class="stats__chip"
            class:stats__chip--active={selectedTool === null}
            aria-pressed={selectedTool === null}
            onclick={() => (selectedTool = null)}
          >
            <code>{pt ? "todas" : "all"}</code>
          </button>
          {#each topTools as [tool, count]}
            <button
              class="stats__chip"
              class:stats__chip--active={selectedTool === tool}
              aria-pressed={selectedTool === tool}
              onclick={() => (selectedTool = selectedTool === tool ? null : tool)}
            >
              <code>{tool}</code><span class="stats__count">×{count}</span>
            </button>
          {/each}
        </div>
      </div>
      {#each logRows as row, i (i)}
        {#if row}
          <p class="stats__log-row">
            <span class="stats__log-at">{ago(row.at)}</span>
            <span class="stats__log-agent" class:stats__log-agent--unknown={!row.client}>{row.client ?? (pt ? "desconhecido" : "unknown")}</span>
            <span class="stats__log-sep" aria-hidden="true">→</span>
            <span class="stats__log-call">{row.tool}</span>
          </p>
        {:else}
          <p class="stats__log-row stats__log-row--empty" aria-hidden="true"></p>
        {/if}
      {/each}
    </div>
  </div>
{/if}

<style>
  .stats {
    border: 1px solid var(--line);
    border-radius: var(--radius-card, 12px);
    background: #06080c;
    padding: 1.1rem 1.2rem;
    font-family: var(--font-mono);
    /* Grid (2 rows) + tools line + 5-row agent log: reserve the full final
       height so the skeleton never jumps when data lands. */
    min-height: 296px;
  }
  .stats--loading dd,
  .stats--loading .stats__count,
  .stats--loading .stats__log-row {
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

  .stats__count { color: var(--muted); }

  .stats__chip {
    background: none;
    border: 0;
    padding: 0;
    font: inherit;
    font-size: 0.75rem;
    color: inherit;
    cursor: pointer;
    white-space: nowrap;
  }
  .stats__chip code { text-decoration: underline dotted; text-decoration-color: transparent; }
  .stats__chip:hover code { text-decoration-color: var(--muted-soft); }
  .stats__chip:focus-visible {
    outline: 1px dashed var(--accent, #00ff41);
    outline-offset: 3px;
  }
  .stats__chip--active code {
    color: var(--accent, #00ff41);
    text-shadow: 0 0 10px rgba(0, 255, 65, 0.4);
    text-decoration-color: var(--accent, #00ff41);
  }

  .stats__log {
    margin-top: 1.1rem;
    padding-top: 0.9rem;
    border-top: 1px dashed var(--line);
  }
  .stats__log-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.8rem;
    margin-bottom: 0.6rem;
  }
  .stats__log-title {
    margin: 0;
    font-size: 0.68rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted-soft);
    white-space: nowrap;
  }
  .stats__log-filters {
    display: flex;
    align-items: baseline;
    gap: 0.9rem;
    flex-wrap: wrap;
    justify-content: flex-end;
    min-width: 0;
  }
  .stats__log-row {
    display: grid;
    grid-template-columns: 3rem minmax(0, 1fr) auto minmax(0, auto);
    gap: 0.6rem;
    align-items: baseline;
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.5;
  }
  .stats__log-at {
    color: var(--muted-soft);
    white-space: nowrap;
  }
  .stats__log-agent {
    color: var(--accent-soft, #4ade80);
    overflow-wrap: anywhere;
  }
  .stats__log-agent--unknown { color: var(--muted); font-style: italic; }
  .stats__log-sep { color: var(--muted-soft); }
  .stats__log-call {
    color: var(--muted);
    overflow-wrap: anywhere;
    text-align: right;
  }
  .stats__log-row--empty { min-height: 1.125rem; }
</style>
