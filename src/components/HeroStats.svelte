<script lang="ts">
  /**
   * Standalone "live stats" widget that sits right under the hero.
   * Fetches GitHub stats + stars; merges in hand-tracked counts for
   * other socials. Renders 8 cards in a responsive grid.
   */
  import { onMount } from "svelte";

  const GH_USER = "rubenmarcus";
  const GH_ORGS = ["multivmlabs", "BitteProtocol", "Mintbase"];

  const ESTIMATED_FOLLOWERS = {
    linkedin: 33253,
    twitter: 480,
    devto: 45,
  };

  interface GitHubStats {
    today: number;
    month: number;
    year: number;
    lastCommit: { message: string; repo: string; url: string } | null;
  }

  let stats = $state<GitHubStats | null>(null);
  let stars = $state<number | null>(null);
  let followers = $state<number | null>(null);

  function formatCount(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k";
    return String(n);
  }

  onMount(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const month = now.getMonth();
    const year = now.getFullYear();

    Promise.all([
      fetch(`https://github-contributions-api.jogruber.de/v4/${GH_USER}?y=last`).then((r) => r.json()).catch(() => null),
      fetch(`https://api.github.com/users/${GH_USER}/events/public?per_page=30`).then((r) => r.json()).catch(() => []),
    ])
      .then(([contribData, events]) => {
        if (!contribData) return;
        const contributions: { date: string; count: number }[] = contribData.contributions || [];
        let t = 0, m = 0, y = 0;
        for (const c of contributions) {
          const d = new Date(c.date);
          if (c.date === todayStr) t = c.count;
          if (d.getMonth() === month && d.getFullYear() === year) m += c.count;
          if (d.getFullYear() === year) y += c.count;
        }

        let lastCommit: GitHubStats["lastCommit"] = null;
        if (Array.isArray(events)) {
          for (const event of events) {
            if (event?.type === "PushEvent" && event.payload?.commits?.length) {
              const commit = event.payload.commits[event.payload.commits.length - 1];
              const repo = event.repo?.name?.replace(`${GH_USER}/`, "") || "";
              lastCommit = {
                message: String(commit.message).split("\n")[0],
                repo,
                url: `https://github.com/${event.repo?.name}/commit/${commit.sha}`,
              };
              break;
            }
          }
        }
        stats = { today: t, month: m, year: y, lastCommit };
      })
      .catch(() => {});

    // Stars + followers
    (async () => {
      async function paginate(url: string): Promise<any[]> {
        const out: any[] = [];
        let page = 1;
        while (page < 4) {
          const res = await fetch(`${url}?per_page=100&page=${page}`);
          if (!res.ok) break;
          const arr = await res.json();
          if (!Array.isArray(arr) || arr.length === 0) break;
          out.push(...arr);
          if (arr.length < 100) break;
          page += 1;
        }
        return out;
      }

      try {
        const user = await fetch(`https://api.github.com/users/${GH_USER}`).then((r) => r.json());
        const ghFollowers = typeof user?.followers === "number" ? user.followers : 0;
        followers =
          ghFollowers +
          ESTIMATED_FOLLOWERS.linkedin +
          ESTIMATED_FOLLOWERS.twitter +
          ESTIMATED_FOLLOWERS.devto;

        const sources = [
          `https://api.github.com/users/${GH_USER}/repos`,
          ...GH_ORGS.map((o) => `https://api.github.com/orgs/${o}/repos`),
        ];
        const results = await Promise.allSettled(sources.map(paginate));
        let total = 0;
        for (const r of results) {
          if (r.status === "fulfilled") {
            for (const repo of r.value) total += repo?.stargazers_count ?? 0;
          }
        }
        stars = total;
      } catch {}
    })();
  });
</script>

<section class="stats" aria-label="Live stats">
  <div class="stats__grid">
    <!-- Live: commits -->
    {#if stats}
      <a
        class="stats__card stats__card--primary"
        href={stats.lastCommit?.url ?? `https://github.com/${GH_USER}`}
        target="_blank"
        rel="noopener"
      >
        <span class="stats__dot" aria-hidden="true"></span>
        <div class="stats__body">
          <span class="stats__big">{stats.today} commits today</span>
          <span class="stats__sub">{stats.month} this month · {stats.year} this year</span>
          {#if stats.lastCommit}
            <span class="stats__last">
              last: <em>{stats.lastCommit.message}</em>
              <span class="stats__repo">({stats.lastCommit.repo})</span>
            </span>
          {/if}
        </div>
      </a>
    {/if}

    {#if stars !== null}
      <a class="stats__card" href={`https://github.com/${GH_USER}?tab=repositories`} target="_blank" rel="noopener">
        <svg class="stats__icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <div class="stats__body">
          <span class="stats__big">{formatCount(stars)} stars</span>
          <span class="stats__sub">across all my projects</span>
        </div>
      </a>
    {/if}

    {#if followers !== null}
      <a class="stats__card" href="https://linkedin.com/in/rubenmarcus" target="_blank" rel="noopener">
        <svg class="stats__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <div class="stats__body">
          <span class="stats__big">{formatCount(followers)} followers</span>
          <span class="stats__sub">on all my socials</span>
        </div>
      </a>
    {/if}

    <a class="stats__card stats__card--video" href="/portfolio">
      <video
        class="stats__video"
        autoplay
        loop
        muted
        playsinline
        preload="auto"
        aria-hidden="true"
      >
        <source src="/3.webm" type="video/webm" />
      </video>
      <div class="stats__body">
        <span class="stats__big">62 projects</span>
        <span class="stats__sub">shipped in 13 years</span>
      </div>
    </a>

    <a class="stats__card" href="/ai">
      <svg class="stats__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
      </svg>
      <div class="stats__body">
        <span class="stats__big">10 AI agents</span>
        <span class="stats__sub">for DeFi across 5 chains</span>
      </div>
    </a>

    <a class="stats__card" href="/ai">
      <svg class="stats__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="4 17 10 11 4 5"/>
        <line x1="12" y1="19" x2="20" y2="19"/>
      </svg>
      <div class="stats__body">
        <span class="stats__big">5 AI tools</span>
        <span class="stats__sub">shipped open source</span>
      </div>
    </a>

    <a class="stats__card" href="/ai">
      <svg class="stats__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
      <div class="stats__body">
        <span class="stats__big">5 SDK tools</span>
        <span class="stats__sub">for Web3 + AI</span>
      </div>
    </a>

    <a class="stats__card" href="/portfolio">
      <svg class="stats__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <line x1="4" y1="22" x2="20" y2="22"/>
        <line x1="10" y1="14.66" x2="10" y2="22"/>
        <line x1="14" y1="14.66" x2="14" y2="22"/>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
      </svg>
      <div class="stats__body">
        <span class="stats__big">7 hackathons</span>
        <span class="stats__sub">joined + shipped</span>
      </div>
    </a>
  </div>
</section>

<style>
  /* Container-aligned wrapper, no longer full-width */
  .stats {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: var(--content-max);
    margin-inline: auto;
    padding-inline: var(--gutter-x);
    padding-block: 3rem;
    border-bottom: 1px solid var(--line);
  }

  .stats__grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 0.85rem;
  }
  @media (min-width: 640px) { .stats__grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 900px) { .stats__grid { grid-template-columns: repeat(4, 1fr); } }

  /* Default card: icon left, text right */
  .stats__card {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 0.9rem;
    padding: 1rem 1.15rem;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: rgba(13, 2, 33, 0.55);
    backdrop-filter: blur(var(--blur-sm));
    -webkit-backdrop-filter: blur(var(--blur-sm));
    color: var(--text);
    transition:
      border-color var(--duration-hover) var(--ease-default),
      background-color var(--duration-hover) var(--ease-default),
      transform var(--duration-hover) var(--ease-default);
  }
  .stats__card:hover {
    border-color: var(--line-bright);
    background: rgba(13, 2, 33, 0.75);
    transform: translateY(-2px);
  }

  /* Video card variant — bigger, all-black, video fills the top row */
  .stats__card--video {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    align-items: stretch;
    gap: 0;
    padding: 0;
    overflow: hidden;
    background: #000;
    border-color: rgba(76, 201, 240, 0.22);
    transition:
      border-color var(--duration-hover) var(--ease-default),
      transform var(--duration-hover) var(--ease-default),
      box-shadow var(--duration-hover) var(--ease-default);
  }
  @media (min-width: 900px) {
    .stats__card--video {
      grid-column: span 2;
    }
  }
  .stats__card--video:hover {
    background: #000;
    border-color: rgba(76, 201, 240, 0.7);
    transform: translateY(-3px);
    box-shadow:
      0 0 0 1px rgba(76, 201, 240, 0.35),
      0 18px 40px rgba(76, 201, 240, 0.18),
      0 0 60px rgba(76, 201, 240, 0.12);
  }
  .stats__card--video:hover .stats__video {
    filter: brightness(1.05) saturate(1);
  }

  .stats__icon { color: var(--accent-soft); flex-shrink: 0; }

  /* Video sits full-width on its own row at the top of the card — bigger */
  .stats__video {
    display: block;
    width: 100%;
    height: 260px;
    object-fit: cover;
    background: #000;
    border-bottom: 1px solid rgba(76, 201, 240, 0.14);
    filter: brightness(0.95) saturate(0.9);
    transition: filter var(--duration-hover) var(--ease-default);
  }
  @media (max-width: 640px) {
    .stats__video { height: 200px; }
  }
  /* Text block inside the video card needs its own padding now */
  .stats__card--video .stats__body {
    padding: 1.1rem 1.3rem 1.25rem;
    gap: 0.25rem;
  }
  .stats__card--video .stats__big {
    font-size: 1.4rem;
  }
  .stats__card--video .stats__sub {
    font-size: 0.85rem;
  }

  .stats__body {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  .stats__big {
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 500;
    line-height: 1.1;
    color: var(--text);
  }
  .stats__sub {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: var(--muted);
    letter-spacing: 0.01em;
  }
  .stats__last {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--muted-soft);
    margin-top: 0.2rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .stats__last em { color: var(--accent-soft); font-style: normal; }
  .stats__repo { color: var(--muted-soft); }

  .stats__card--primary {
    background: linear-gradient(180deg, rgba(94, 200, 255, 0.06), rgba(94, 200, 255, 0.02));
    border-color: rgba(94, 200, 255, 0.26);
  }
  .stats__card--primary:hover { border-color: rgba(94, 200, 255, 0.5); }

  .stats__card--primary .stats__dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: #5ee2a8;
    box-shadow: 0 0 0 5px rgba(94, 226, 168, 0.2);
    animation: pulse 2s infinite var(--ease-default);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.9); }
  }
</style>
