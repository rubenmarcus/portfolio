<script lang="ts">
  import { onMount } from "svelte";
  import { fetchGithubStars } from "../lib/stats-live";

  const GH_USER = "rubenmarcus";
  const ESTIMATED_FOLLOWERS = { linkedin: 33253, twitter: 480, devto: 45 };

  let commits = $state<{ today: number; month: number; year: number } | null>(null);
  let stars = $state<number | null>(null);
  let followers = $state<number | null>(null);

  // ── HUD reveal state ─────────────────────────────────────────────────
  // Blocks materialise sequentially (COMMITS → STARS → FOLLOWERS, ~250ms
  // apart), each value scrambling for ~400ms as it lands. Once on mount —
  // never loops. Reduced motion → everything settles instantly.
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let shownBlocks = $state(reduced ? 3 : 0);
  let disp = $state({ year: "———", stars: "———", followers: "———" });
  const scrambled = { commits: false, stars: false, followers: false };

  const GLYPHS = "ABCDEFGHKMNPRSTUVWXYZ0123456789#$%&/<>";

  function scrambleTo(key: keyof typeof disp, final: string, duration = 400) {
    if (reduced) {
      disp[key] = final;
      return;
    }
    const start = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - start) / duration);
      const keep = Math.floor(p * final.length);
      let out = final.slice(0, keep);
      for (let i = keep; i < final.length; i++) {
        out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      disp[key] = out;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function fmt(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k";
    return String(n);
  }

  // Scramble each value in once — either when its block is revealed (data
  // already here) or when the data lands (block already revealed).
  $effect(() => {
    if (commits && shownBlocks >= 1 && !scrambled.commits) {
      scrambled.commits = true;
      scrambleTo("year", fmt(commits.year));
    }
  });
  $effect(() => {
    if (stars !== null && shownBlocks >= 2 && !scrambled.stars) {
      scrambled.stars = true;
      scrambleTo("stars", fmt(stars));
    }
  });
  $effect(() => {
    if (followers !== null && shownBlocks >= 3 && !scrambled.followers) {
      scrambled.followers = true;
      scrambleTo("followers", fmt(followers));
    }
  });

  // Resource meters — commit throughput, each bar relative to the largest
  // of the three windows (so the year bar always reads full-scale).
  const meters = $derived.by(() => {
    const t = commits?.today ?? 0;
    const m = commits?.month ?? 0;
    const y = commits?.year ?? 0;
    const max = Math.max(t, m, y, 1);
    return [
      { label: "TDY", value: commits ? String(t) : "—", pct: (t / max) * 100 },
      { label: "MON", value: commits ? String(m) : "—", pct: (m / max) * 100 },
      { label: "YER", value: commits ? String(y) : "—", pct: (y / max) * 100 },
    ];
  });

  onMount(() => {
    // Sequential block reveal — 250ms apart
    if (!reduced) {
      const timers = [0, 250, 500].map((d, i) =>
        setTimeout(() => {
          shownBlocks = i + 1;
        }, d),
      );
      void timers;
    }

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const month = now.getMonth();
    const year = now.getFullYear();

    fetch(`https://github-contributions-api.jogruber.de/v4/${GH_USER}?y=last`)
      .then((r) => r.json())
      .then((data) => {
        const contributions: { date: string; count: number }[] = data?.contributions ?? [];
        let t = 0, m = 0, y = 0;
        for (const c of contributions) {
          const d = new Date(c.date);
          if (c.date === todayStr) t = c.count;
          if (d.getMonth() === month && d.getFullYear() === year) m += c.count;
          if (d.getFullYear() === year) y += c.count;
        }
        commits = { today: t, month: m, year: y };
      })
      .catch(() => {});

    (async () => {
      try {
        const user = await fetch(`https://api.github.com/users/${GH_USER}`).then((r) => r.json());
        const ghFollowers = typeof user?.followers === "number" ? user.followers : 0;
        followers = ghFollowers + ESTIMATED_FOLLOWERS.linkedin + ESTIMATED_FOLLOWERS.twitter + ESTIMATED_FOLLOWERS.devto;

        const total = await fetchGithubStars();
        if (total !== null) stars = total;
      } catch {}
    })();
  });
</script>

<div class="hud" aria-label="Live stats">
  <div class="hud__block" class:hud__block--on={shownBlocks >= 1}>
    <div class="hud__labelRow">
      <span class="hud__label">commits</span>
      <span class="hud__value">{disp.year}<span class="hud__sub"> /yr</span></span>
    </div>
    <div class="hud__meters">
      {#each meters as meter}
        <div class="hud__meter">
          <span class="hud__meterLabel">{meter.label}</span>
          <span class="hud__track">
            <span class="hud__fill" style={`width: ${meter.pct.toFixed(1)}%`}></span>
          </span>
          <span class="hud__meterVal">{meter.value}</span>
        </div>
      {/each}
    </div>
  </div>

  <div class="hud__block" class:hud__block--on={shownBlocks >= 2}>
    <div class="hud__labelRow">
      <span class="hud__label">stars</span>
      <span class="hud__value">{disp.stars}</span>
    </div>
  </div>

  <div class="hud__block" class:hud__block--on={shownBlocks >= 3}>
    <div class="hud__labelRow">
      <span class="hud__label">followers</span>
      <span class="hud__value">{disp.followers}</span>
    </div>
  </div>

  <div class="hud__cursorLine" class:hud__block--on={shownBlocks >= 3}>
    <span class="hud__prompt">&gt;</span>
    <span class="hud__cursor" aria-hidden="true">▌</span>
  </div>
</div>

<style>
  .hud {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 236px;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    line-height: 1.4;
    color: var(--muted-soft);
    /* bare lines on the black stage — no card, no border, no blur */
    padding: 0.2rem 0;
  }

  .hud__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0.45rem;
    border-bottom: 1px solid rgba(0, 255, 65, 0.18);
  }

  .hud__title {
    color: rgba(0, 255, 65, 0.55);
    font-size: 0.62rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .hud__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 6px rgba(0, 255, 65, 0.8);
  }

  /* Blocks are always laid out (no footprint shift); they materialise via
     opacity + a 2px settle, staggered by the reveal timers. */
  .hud__block {
    opacity: 0;
    transform: translateY(2px);
    transition:
      opacity 240ms var(--ease-default),
      transform 240ms var(--ease-default);
  }
  .hud__block--on {
    opacity: 1;
    transform: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .hud__block { transition: none; }
  }

  .hud__labelRow {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.6rem;
  }

  .hud__label {
    color: rgba(0, 255, 65, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.62rem;
  }

  .hud__value {
    color: var(--text);
    font-size: 0.85rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .hud__sub {
    color: var(--muted-soft);
    font-size: 0.66rem;
  }

  .hud__meters {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    margin-top: 0.4rem;
  }

  .hud__meter {
    display: grid;
    grid-template-columns: 2.1rem 1fr 2.2rem;
    align-items: center;
    gap: 0.5rem;
  }

  .hud__meterLabel {
    color: rgba(0, 255, 65, 0.4);
    font-size: 0.58rem;
    letter-spacing: 0.1em;
  }

  .hud__track {
    height: 4px;
    background: rgba(0, 255, 65, 0.1);
    border: 1px solid rgba(0, 255, 65, 0.16);
    overflow: hidden;
  }

  .hud__fill {
    display: block;
    height: 100%;
    background: var(--accent);
    box-shadow: 0 0 6px rgba(0, 255, 65, 0.55);
    transition: width 700ms var(--ease-emphasis);
  }
  @media (prefers-reduced-motion: reduce) {
    .hud__fill { transition: none; }
  }

  .hud__meterVal {
    color: var(--muted);
    font-size: 0.64rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .hud__cursorLine {
    display: flex;
    gap: 0.35rem;
    align-items: baseline;
    padding-top: 0.35rem;
    border-top: 1px solid rgba(0, 255, 65, 0.18);
    color: rgba(0, 255, 65, 0.6);
  }

  .hud__prompt { font-size: 0.66rem; }

  .hud__cursor {
    font-size: 0.72rem;
    animation: hud-blink 1.1s steps(1) infinite;
  }
  @keyframes hud-blink {
    0%, 55% { opacity: 1; }
    56%, 100% { opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .hud__cursor { animation: none; }
  }
</style>
