<script lang="ts">
  import { onMount } from "svelte";
  import SvgIcon from "../lib/assets/SvgIcon.svelte";
  import type { GithubCommitStats } from "../lib/github-stats";

  interface Props {
    lang?: string;
  }

  let { lang = "en" }: Props = $props();
  const pt = $derived(lang.startsWith("pt"));
  let stats = $state<GithubCommitStats | null>(null);
  let unavailable = $state(false);

  const copy = $derived(pt ? {
    label: "Atividade pública no GitHub",
    total: "total",
    month: "este mês",
    today: "hoje",
    latest: "Último commit público",
    unavailable: "GitHub temporariamente indisponível",
  } : {
    label: "Public GitHub activity",
    total: "total",
    month: "this month",
    today: "today",
    latest: "Latest public commit",
    unavailable: "GitHub temporarily unavailable",
  });

  const formatNumber = (value: number | null | undefined) =>
    typeof value === "number" ? value.toLocaleString(pt ? "pt-BR" : "en-US") : "—";

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(pt ? "pt-BR" : "en-US", {
      timeZone: "Europe/Lisbon",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));

  onMount(async () => {
    try {
      const response = await fetch("/api/github-stats.json");
      if (!response.ok) throw new Error(String(response.status));
      stats = await response.json();
      unavailable = stats.total === null && stats.month === null && stats.today === null;
    } catch {
      unavailable = true;
    }
  });
</script>

<section class="github-stats" aria-label={copy.label} aria-live="polite">
  <div class="github-stats__head">
    <span class="github-stats__title">
      <SvgIcon name="github" size={14} />
      {copy.label}
    </span>
    <span class="github-stats__live" class:github-stats__live--off={unavailable} aria-hidden="true"></span>
  </div>

  <dl class="github-stats__grid">
    <div class="github-stats__metric">
      <dt>{copy.total}</dt>
      <dd>{formatNumber(stats?.total)}</dd>
    </div>
    <div class="github-stats__metric">
      <dt>{copy.month}</dt>
      <dd>{formatNumber(stats?.month)}</dd>
    </div>
    <div class="github-stats__metric">
      <dt>{copy.today}</dt>
      <dd>{formatNumber(stats?.today)}</dd>
    </div>
  </dl>

  {#if stats?.latest}
    <a class="github-stats__commit" href={stats.latest.url} target="_blank" rel="noopener noreferrer">
      <span class="github-stats__commitLabel">{copy.latest}</span>
      <span class="github-stats__commitMessage">{stats.latest.message}</span>
      <span class="github-stats__commitMeta">
        {stats.latest.repository} · {stats.latest.sha} ·
        <time datetime={stats.latest.authoredAt}>{formatDate(stats.latest.authoredAt)}</time>
      </span>
    </a>
  {:else if unavailable}
    <p class="github-stats__fallback">{copy.unavailable}</p>
  {:else}
    <div class="github-stats__commit github-stats__commit--loading" aria-hidden="true">
      <span></span><span></span><span></span>
    </div>
  {/if}
</section>

<style>
  .github-stats {
    width: 100%;
    font-family: var(--font-mono);
    color: var(--muted);
  }

  .github-stats__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding-bottom: 0.55rem;
    border-bottom: 1px solid rgba(0, 255, 65, 0.2);
  }

  .github-stats__title {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: rgba(0, 255, 65, 0.72);
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .github-stats__live {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 7px rgba(0, 255, 65, 0.8);
  }
  .github-stats__live--off {
    background: var(--muted-soft);
    box-shadow: none;
  }

  .github-stats__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin: 0;
    border-bottom: 1px solid rgba(0, 255, 65, 0.15);
  }

  .github-stats__metric {
    min-width: 0;
    padding: 0.65rem 0.55rem 0.65rem 0;
  }
  .github-stats__metric + .github-stats__metric {
    padding-left: 0.65rem;
    border-left: 1px solid rgba(0, 255, 65, 0.12);
  }
  .github-stats__metric dt {
    color: var(--muted-soft);
    font-size: 0.56rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .github-stats__metric dd {
    margin: 0.18rem 0 0;
    color: var(--text);
    font-size: 1rem;
    font-variant-numeric: tabular-nums;
  }

  .github-stats__commit {
    display: grid;
    gap: 0.18rem;
    padding-top: 0.7rem;
    transition: color var(--duration-hover) var(--ease-default);
  }
  .github-stats__commit:hover .github-stats__commitMessage { color: var(--accent-soft); }
  .github-stats__commitLabel {
    color: rgba(0, 255, 65, 0.52);
    font-size: 0.56rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .github-stats__commitMessage {
    overflow: hidden;
    color: var(--muted);
    font-size: 0.7rem;
    line-height: 1.45;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color var(--duration-hover) var(--ease-default);
  }
  .github-stats__commitMeta {
    overflow: hidden;
    color: var(--muted-soft);
    font-size: 0.58rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .github-stats__commit--loading span {
    display: block;
    width: 100%;
    height: 0.45rem;
    background: rgba(0, 255, 65, 0.08);
  }
  .github-stats__commit--loading span:nth-child(2) { width: 82%; }
  .github-stats__commit--loading span:nth-child(3) { width: 58%; }

  .github-stats__fallback {
    margin: 0;
    padding-top: 0.7rem;
    color: var(--muted-soft);
    font-size: 0.62rem;
  }

  @media (min-width: 720px) {
    .github-stats {
      display: grid;
      grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    }
    .github-stats__head {
      grid-column: 1 / -1;
    }
    .github-stats__grid {
      border-right: 1px solid rgba(0, 255, 65, 0.15);
      border-bottom: 0;
    }
    .github-stats__commit,
    .github-stats__fallback {
      align-content: center;
      min-width: 0;
      padding: 0.65rem 0 0.65rem 1.25rem;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .github-stats__commit--loading span {
      animation: github-pulse 1.4s ease-in-out infinite alternate;
    }
  }
  @keyframes github-pulse {
    to { opacity: 0.35; }
  }
</style>
