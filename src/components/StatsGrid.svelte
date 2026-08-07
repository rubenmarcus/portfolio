<script lang="ts">
  /**
   * StatsGrid — the "proof in numbers" band. Eight cells of shipped,
   * measured outcomes across shipped work (GitHub and npm live):
   *
   *   - count-up — every number eases 0 → target (~1.4s, easeOutCubic) the
   *     first time the band scrolls into view; once only, never loops
   *   - live cells — GitHub stars and npm downloads fetch client-side;
   *     late arrivals get their own short count-up, failures stay "———"
   *   - all values come from src/lib/data/stats.ts (single editable source)
   *
   * prefers-reduced-motion → final values instantly, no animation.
   */

  import { onMount } from "svelte";
  import { STATS, STATS_FOOTNOTE, NPM_PACKAGES, type Stat } from "../lib/data/stats";
  import { fetchGithubStars, fetchNpmDownloads } from "../lib/stats-live";
  import VoxelIcon from "../lib/assets/VoxelIcon.svelte";
  import type { VoxelIconName } from "../lib/assets/registry";

  /** Small voxel accent per stat cell, keyed by stat id. */
  const STAT_ICONS: Record<string, VoxelIconName> = {
    "bitte-messages": "chat",
    "bitte-users": "smiley",
    "agents-built": "mcp",
    "aeo-scans": "eye",
    "aeo-sites": "globe",
    "career-loc": "skull",
    "github-stars": "star",
    "npm-downloads": "folder",
  };

  interface Props {
    /** Resolved at build time — skips the client fetch entirely. */
    initialStars?: number | null;
    initialNpm?: number | null;
    lang?: string;
  }
  let { initialStars = null, initialNpm = null, lang = "en" }: Props = $props();
  const pt = lang.startsWith("pt");

  /** pt-BR stat labels keyed by stat id — EN stays the data default. */
  const LABELS_PT: Record<string, string> = {
    "bitte-messages": "mensagens de agents processadas",
    "bitte-users": "usuários únicos em AI agents",
    "agents-built": "agents de IA que eu construí",
    "aeo-scans": "scans de AEO rodados",
    "aeo-sites": "sites únicos escaneados",
    "career-loc": "linhas de código, estimativa de carreira",
    "github-stars": "GitHub stars",
    "npm-downloads": "npm downloads, total",
  };
  const FOOTNOTE_PT =
    "33K+ seguidores no LinkedIn · 3M+ de pessoas alcançadas por posts no X";

  const copy = $derived(
    pt
      ? { bracket: "02 / Prova em números", title: "Entregue, medido.", foot: FOOTNOTE_PT }
      : { bracket: "02 / Proof in numbers", title: "Shipped, measured.", foot: STATS_FOOTNOTE },
  );
  const labelOf = (s: Stat) => (pt ? (LABELS_PT[s.id] ?? s.label) : s.label);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Numeric targets — live cells start at 0 (= unknown → placeholder).
  let targets = $state<Record<string, number>>(
    Object.fromEntries(STATS.map((s) => [s.id, s.value])),
  );
  if (initialStars) targets["github-stars"] = initialStars;
  if (initialNpm) targets["npm-downloads"] = initialNpm;
  // Current displayed values — undefined until the cell has something to show.
  let shown = $state<Record<string, number>>({});
  let revealed = $state(reduced);

  function fmt(s: Stat, v: number): string {
    const n = v / (s.divisor ?? 1);
    const out = s.divisor
      ? n.toFixed(s.decimals ?? 0)
      : Math.round(n).toLocaleString("en-US");
    return out + (s.suffix ?? "");
  }

  function display(s: Stat): string {
    const v = shown[s.id];
    if (v === undefined) return "———";
    return fmt(s, v);
  }

  const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);

  /** Animate every cell that has a real target from 0 to it. */
  function countUp(ids: string[], duration: number) {
    const start = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - start) / duration);
      const e = easeOut(p);
      for (const id of ids) shown[id] = targets[id] * e;
      if (p < 1) requestAnimationFrame(tick);
      else for (const id of ids) shown[id] = targets[id];
    };
    requestAnimationFrame(tick);
  }

  let root = $state<HTMLElement | null>(null);

  onMount(() => {
    const staticIds = STATS.filter((s) => !s.live).map((s) => s.id);
    const reveal = () => {
      if (reduced) {
        for (const s of STATS) if (!s.live || targets[s.id] > 0) shown[s.id] = targets[s.id];
        return;
      }
      // Cells with a target ride the group count-up; live cells still
      // waiting on the network join later via their own short count-up.
      countUp([...staticIds, ...STATS.filter((s) => s.live && targets[s.id] > 0).map((s) => s.id)], 1400);
    };

    let io: IntersectionObserver | null = null;
    if (root && !reduced) {
      io = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            revealed = true;
            reveal();
            io?.disconnect();
          }
        },
        { threshold: 0.25 },
      );
      io.observe(root);
    } else {
      reveal();
    }

    const liveFetchers = {
      "github-stars": fetchGithubStars,
      "npm-downloads": () => fetchNpmDownloads(NPM_PACKAGES),
    } as const;
    for (const s of STATS) {
      if (!s.live) continue;
      // Build-time value already set → no client fetch needed.
      if (targets[s.id] > 0) continue;
      liveFetchers[s.live]().then((v) => {
        if (v === null) return; // silent failure — placeholder stays
        targets[s.id] = v;
        if (reduced) shown[s.id] = v;
        else if (revealed && shown[s.id] === undefined) countUp([s.id], 900);
      });
    }

    return () => io?.disconnect();
  });
</script>

<section class="stats" bind:this={root} aria-label="Stats">
  <div class="stats__inner">
    <header class="stats__head">
      <span class="bracket">{copy.bracket}</span>
      <h2 class="stats__title">{copy.title}</h2>
    </header>

    <div class="stats__grid">
      {#each STATS as s, i}
        <div class="stats__cell" style="--idx: {i};">
          <span class="stats__value">{display(s)}</span>
          <span class="stats__labelRow">
            {#if STAT_ICONS[s.id]}
              <VoxelIcon name={STAT_ICONS[s.id]} size={16} interactive={false} class="stats__icon" />
            {/if}
            <span class="stats__label">{labelOf(s)}</span>
          </span>
        </div>
      {/each}
    </div>

    <p class="stats__foot">{copy.foot}</p>
  </div>
</section>

<style>
  .stats {
    position: relative;
    z-index: 2;
    width: 100%;
    border-bottom: 1px solid var(--line);
    background: #000;
  }

  .stats__inner {
    width: 100%;
    max-width: var(--content-max);
    margin-inline: auto;
    padding-inline: var(--gutter-x);
    padding-block: 3.5rem 4rem;
  }

  .stats__head {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2.25rem;
  }

  .stats__title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 3.8vw, 3rem);
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.01em;
    color: var(--text);
    margin: 0;
  }

  .stats__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1px;
    background: var(--line);
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    overflow: hidden;
  }
  @media (min-width: 640px) { .stats__grid { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 1080px) { .stats__grid { grid-template-columns: repeat(4, 1fr); } }

  .stats__cell {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 1.5rem 1.4rem 1.6rem;
    background: #000;
    transition: background-color var(--duration-hover) var(--ease-default);
  }
  .stats__cell:hover { background: rgba(0, 255, 65, 0.03); }

  .stats__value {
    font-family: var(--font-display);
    font-size: clamp(1.9rem, 3vw, 2.6rem);
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.02em;
    color: var(--text);
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 18px rgba(0, 255, 65, 0.18);
  }

  .stats__labelRow {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .stats__labelRow :global(.stats__icon) {
    opacity: 0.55;
  }

  .stats__label {
    color: var(--muted);
    font-size: 0.88rem;
    line-height: 1.35;
  }

  .stats__foot {
    margin: 1.2rem 0 0;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.04em;
    color: var(--muted-soft);
    text-align: center;
    /* full width, wraps instead of clipping */
    width: 100%;
  }
</style>
