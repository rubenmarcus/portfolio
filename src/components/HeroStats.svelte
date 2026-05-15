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
  <div class="stats__fade" aria-hidden="true"></div>

  <header class="stats__head">
    <span class="stats__eyebrow">[ 01 ]</span>
    <h2 class="stats__title">Stats</h2>
    <span class="stats__hr" aria-hidden="true"></span>
    <span class="stats__meta">live · github + socials</span>
  </header>

  <div class="stats__grid">
    <!-- Live: commits -->
    {#if stats}
      <a
        class="stats__card"
        href={stats.lastCommit?.url ?? `https://github.com/${GH_USER}`}
        target="_blank"
        rel="noopener"
        style="--idx: 0;"
      >
        <span class="stats__corner" aria-hidden="true">+</span>
        <div class="stats__videoWrap" aria-hidden="true">
          <video class="stats__video" autoplay loop muted playsinline preload="auto">
            <source src="/3.webm" type="video/webm" />
          </video>
          <span class="stats__videoTint" aria-hidden="true"></span>
        </div>
        <div class="stats__body">
          <span class="stats__big">{stats.today}</span>
          <span class="stats__label">commits today</span>
          <span class="stats__sub">{stats.month} this month · {stats.year} this year</span>
        </div>
      </a>
    {/if}

    {#if stars !== null}
      <a class="stats__card" href={`https://github.com/${GH_USER}?tab=repositories`} target="_blank" rel="noopener" style="--idx: 1;">
        <span class="stats__corner" aria-hidden="true">*</span>
        <div class="stats__videoWrap" aria-hidden="true">
          <video class="stats__video" autoplay loop muted playsinline preload="auto">
            <source src="/3.webm" type="video/webm" />
          </video>
          <span class="stats__videoTint" aria-hidden="true"></span>
        </div>
        <div class="stats__body">
          <span class="stats__big">{formatCount(stars)}</span>
          <span class="stats__label">stars</span>
          <span class="stats__sub">across all my projects</span>
        </div>
      </a>
    {/if}

    {#if followers !== null}
      <a class="stats__card" href="https://linkedin.com/in/rubenmarcus" target="_blank" rel="noopener" style="--idx: 2;">
        <span class="stats__corner" aria-hidden="true">o</span>
        <div class="stats__videoWrap" aria-hidden="true">
          <video class="stats__video" autoplay loop muted playsinline preload="auto">
            <source src="/3.webm" type="video/webm" />
          </video>
          <span class="stats__videoTint" aria-hidden="true"></span>
        </div>
        <div class="stats__body">
          <span class="stats__big">{formatCount(followers)}</span>
          <span class="stats__label">followers</span>
          <span class="stats__sub">on all my socials</span>
        </div>
      </a>
    {/if}

    <a class="stats__card" href="/portfolio" style="--idx: 3;">
      <span class="stats__corner" aria-hidden="true">#</span>
      <div class="stats__videoWrap" aria-hidden="true">
        <video class="stats__video" autoplay loop muted playsinline preload="auto">
          <source src="/3.webm" type="video/webm" />
        </video>
        <span class="stats__videoTint" aria-hidden="true"></span>
      </div>
      <div class="stats__body">
        <span class="stats__big">62</span>
        <span class="stats__label">projects</span>
        <span class="stats__sub">shipped in 13 years</span>
      </div>
    </a>

    <a class="stats__card" href="/ai" style="--idx: 4;">
      <span class="stats__corner" aria-hidden="true">·</span>
      <div class="stats__videoWrap" aria-hidden="true">
        <video class="stats__video" autoplay loop muted playsinline preload="auto">
          <source src="/3.webm" type="video/webm" />
        </video>
        <span class="stats__videoTint" aria-hidden="true"></span>
      </div>
      <div class="stats__body">
        <span class="stats__big">10</span>
        <span class="stats__label">AI agents</span>
        <span class="stats__sub">for DeFi across 5 chains</span>
      </div>
    </a>

    <a class="stats__card" href="/ai" style="--idx: 5;">
      <span class="stats__corner" aria-hidden="true">›</span>
      <div class="stats__videoWrap" aria-hidden="true">
        <video class="stats__video" autoplay loop muted playsinline preload="auto">
          <source src="/3.webm" type="video/webm" />
        </video>
        <span class="stats__videoTint" aria-hidden="true"></span>
      </div>
      <div class="stats__body">
        <span class="stats__big">5</span>
        <span class="stats__label">AI tools</span>
        <span class="stats__sub">shipped open source</span>
      </div>
    </a>

    <a class="stats__card" href="/ai" style="--idx: 6;">
      <span class="stats__corner" aria-hidden="true">◇</span>
      <div class="stats__videoWrap" aria-hidden="true">
        <video class="stats__video" autoplay loop muted playsinline preload="auto">
          <source src="/3.webm" type="video/webm" />
        </video>
        <span class="stats__videoTint" aria-hidden="true"></span>
      </div>
      <div class="stats__body">
        <span class="stats__big">5</span>
        <span class="stats__label">SDK tools</span>
        <span class="stats__sub">for Web3 + AI</span>
      </div>
    </a>

    <a class="stats__card" href="/portfolio" style="--idx: 7;">
      <span class="stats__corner" aria-hidden="true">^</span>
      <div class="stats__videoWrap" aria-hidden="true">
        <video class="stats__video" autoplay loop muted playsinline preload="auto">
          <source src="/3.webm" type="video/webm" />
        </video>
        <span class="stats__videoTint" aria-hidden="true"></span>
      </div>
      <div class="stats__body">
        <span class="stats__big">7</span>
        <span class="stats__label">hackathons</span>
        <span class="stats__sub">joined + shipped</span>
      </div>
    </a>
  </div>
</section>

<style>
  /* Container-aligned wrapper with a deep black gradient that bleeds
     upward into the hero, bridging the two sections seamlessly. */
  .stats {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: var(--content-max);
    margin-inline: auto;
    padding-inline: var(--gutter-x);
    padding-block: 7rem 6rem;
    border-bottom: 1px solid var(--line);
  }

  /* Gradient transition that starts INSIDE the hero (negative top) and
     fades to solid black over the top of the stats section. Full-bleed. */
  .stats__fade {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: -340px;
    width: 100vw;
    height: 560px;
    pointer-events: none;
    z-index: -1;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(0, 0, 0, 0.18) 22%,
      rgba(0, 0, 0, 0.55) 44%,
      rgba(0, 0, 0, 0.85) 62%,
      #000 78%,
      #000 100%
    );
  }

  /* Section header above the grid */
  .stats__head {
    display: grid;
    grid-template-columns: auto auto 1fr auto;
    align-items: baseline;
    gap: 1.1rem;
    margin-bottom: 3rem;
  }
  .stats__eyebrow {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--muted-soft);
  }
  .stats__title {
    font-family: var(--font-serif);
    font-size: clamp(2.2rem, 4.4vw, 3.4rem);
    font-weight: 400;
    line-height: 1;
    letter-spacing: -0.01em;
    color: var(--text);
    margin: 0;
    font-style: italic;
  }
  .stats__hr {
    height: 1px;
    background: linear-gradient(90deg, var(--line) 0%, var(--line-strong) 50%, transparent 100%);
  }
  .stats__meta {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted-soft);
    white-space: nowrap;
  }
  @media (max-width: 640px) {
    .stats__head {
      grid-template-columns: auto 1fr;
      row-gap: 0.5rem;
    }
    .stats__hr, .stats__meta { display: none; }
  }

  .stats__grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1.25rem;
  }
  @media (min-width: 640px) { .stats__grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 900px) { .stats__grid { grid-template-columns: repeat(4, 1fr); } }

  /* Uniform card — every card is identical: video on top, body below.
     No special variants, no icons, no dividers. All cards same size. */
  .stats__card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: #000;
    color: var(--text);
    overflow: hidden;
    text-decoration: none;
    /* Staggered intro — applied per-card via --idx */
    opacity: 0;
    transform: translateY(14px);
    animation: stats-rise 700ms var(--ease-emphasis) forwards;
    animation-delay: calc(var(--idx, 0) * 70ms + 120ms);
    transition:
      border-color var(--duration-hover) var(--ease-default),
      transform var(--duration-hover) var(--ease-default),
      box-shadow var(--duration-hover) var(--ease-default);
  }
  .stats__card:hover {
    border-color: var(--line-bright);
    transform: translateY(-3px);
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.45);
  }
  .stats__card:hover .stats__video {
    filter: brightness(1.05) saturate(1);
    transform: scale(1.025);
  }
  .stats__card:hover .stats__corner {
    opacity: 0.85;
    transform: translate(0, 0);
  }

  /* Subtle ASCII glyph in the top-right of each card */
  .stats__corner {
    position: absolute;
    top: 0.55rem;
    right: 0.7rem;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--accent-soft);
    opacity: 0.35;
    transform: translate(3px, -1px);
    transition:
      opacity var(--duration-hover) var(--ease-default),
      transform var(--duration-hover) var(--ease-default);
    pointer-events: none;
    z-index: 2;
    mix-blend-mode: screen;
  }

  /* Square video container at the top of every card */
  .stats__videoWrap {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    background: #000;
    isolation: isolate;
  }

  .stats__video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #000;
    filter: brightness(0.85) saturate(0.7) contrast(1.05);
    transition:
      filter var(--duration-hover) var(--ease-default),
      transform 600ms var(--ease-default);
  }

  /* Ice-blue color tint overlay — sits on top of the video,
     using mix-blend-mode to tint without flattening the motion */
  .stats__videoTint {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      135deg,
      rgba(140, 200, 255, 0.65) 0%,
      rgba(96, 181, 255, 0.55) 40%,
      rgba(60, 140, 220, 0.6) 100%
    );
    mix-blend-mode: color;
    z-index: 1;
    transition: opacity var(--duration-hover) var(--ease-default);
  }
  /* A second soft glow on top — gives the ice "frost" sheen */
  .stats__videoWrap::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(
      ellipse at 35% 25%,
      rgba(200, 230, 255, 0.18) 0%,
      transparent 55%
    );
    z-index: 2;
  }

  /* Body block — centered text below video */
  .stats__body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 0.1rem;
    min-width: 0;
    padding: 1.1rem 1rem 1.35rem;
    flex: 1;
  }

  /* Big number — serif on every card, ice blue */
  .stats__big {
    font-family: var(--font-serif);
    font-size: clamp(2.4rem, 4.2vw, 3.2rem);
    font-weight: 400;
    line-height: 0.95;
    letter-spacing: -0.012em;
    color: var(--accent-soft);
    font-feature-settings: "lnum" 1, "tnum" 1;
    text-shadow: 0 0 18px rgba(168, 212, 255, 0.18);
  }
  /* Title under the number — bold + 2x size */
  .stats__label {
    font-family: var(--font-sans);
    font-size: clamp(1.25rem, 1.9vw, 1.55rem);
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.012em;
    line-height: 1.15;
    margin-top: 0.2rem;
  }
  .stats__sub {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--muted-soft);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-top: 0.35rem;
  }

  @keyframes stats-rise {
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .stats__card {
      animation: none;
      opacity: 1;
      transform: none;
    }
  }
</style>
