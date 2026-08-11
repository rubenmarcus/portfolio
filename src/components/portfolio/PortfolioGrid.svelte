<script lang="ts">
  /**
   * PortfolioGrid — the filterable /portfolio archive.
   *
   *   - filter by era/group, company/org, and technology (AND-combined),
   *     "All" reset
   *   - filter state mirrored into the URL hash (#g=…&o=…&t=…) so views
   *     are shareable
   *   - cards: generated cover or seeded DitherCover (16:9), title, org · period,
   *     description, stack chips (VoxelIcon where a glyph exists)
   *   - covers "turn on" on hover: Ken-Burns pan+zoom, a phosphor scanline
   *     sweeping the cover, and a dot shimmer — all CSS keyframes, no per-card JS
   *   - stagger rise on first scroll-into-view (IntersectionObserver, once),
   *     cursor spotlight + scanline sweep on hover — same language as HireMeFor
   *   - prefers-reduced-motion → everything settled, no sweep, no stagger
   */

  import { onMount } from "svelte";
  import DitherCover from "../DitherCover.svelte";
  import VoxelIcon from "../../lib/assets/VoxelIcon.svelte";
  import type { VoxelIconName } from "../../lib/assets/registry";

  interface ProjectItem {
    slug: string;
    title: string;
    org: string;
    period: string;
    year: number;
    description: string;
    url?: string;
    stack?: string[];
    group: string;
    highlight?: boolean;
    cover?: string;
    caseStudy?: string;
  }

  interface Props {
    projects: ProjectItem[];
    groupLabels: Record<string, string>;
    groupOrder: string[];
    lang?: string;
  }

  let { projects, groupLabels, groupOrder, lang = "en" }: Props = $props();
  const pt = lang.startsWith("pt");

  /** pt-BR UI chrome — project descriptions stay in the shared EN dataset. */
  const copy = $derived(
    pt
      ? {
          all: "Todos",
          filterEra: "Filtrar por era",
          filterCompany: "Filtrar por empresa",
          filterTech: "Filtrar por tecnologia",
          countOf: "de",
          projectsWord: "projetos",
          clearFilters: "limpar filtros",
          noMatches: "sem resultados",
          noMatchesDesc: "Nenhum projeto bate com essa combinação de filtros.",
          resetFilters: "Limpar filtros",
          visit: "visitar",
          caseStudy: "estudo de caso",
          highlighted: "Projeto em destaque",
        }
      : {
          all: "All",
          filterEra: "Filter by era",
          filterCompany: "Filter by company",
          filterTech: "Filter by technology",
          countOf: "of",
          projectsWord: "projects",
          clearFilters: "clear filters",
          noMatches: "no matches",
          noMatchesDesc: "No projects match this filter combination.",
          resetFilters: "Reset filters",
          visit: "visit",
          caseStudy: "case study",
          highlighted: "Highlighted project",
        },
  );

  /** Stack label (lowercased) → voxel icon glyph. Everything else is a text chip. */
  const ICON_MAP: Record<string, VoxelIconName> = {
    typescript: "ts",
    node: "node",
    "node.js": "node",
    react: "react",
    svelte: "svelte",
    rust: "rust",
    python: "python",
    "three.js": "threejs",
    bun: "bun",
    mcp: "mcp",
  };

  function iconFor(s: string): VoxelIconName | null {
    return ICON_MAP[s.toLowerCase()] ?? null;
  }

  let group = $state<string | null>(null);
  let org = $state<string | null>(null);
  let tech = $state<string | null>(null);

  const groups = $derived(
    groupOrder
      .map((g) => ({
        key: g,
        label: groupLabels[g] ?? g,
        count: projects.filter((p) => p.group === g).length,
      }))
      .filter((g) => g.count > 0),
  );

  /** The ~8 most common orgs — the long freelance tail stays reachable
   *  through the era filter. */
  const orgs = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const p of projects) counts.set(p.org, (counts.get(p.org) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  });

  /** The ~10 most frequent technologies across all stacks. */
  const techs = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const p of projects) {
      for (const s of p.stack ?? []) counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  });

  const filtered = $derived(
    projects.filter(
      (p) =>
        (!group || p.group === group) &&
        (!org || p.org === org) &&
        (!tech || (p.stack ?? []).includes(tech)),
    ),
  );

  function toggleGroup(g: string) {
    group = group === g ? null : g;
  }
  function toggleOrg(o: string) {
    org = org === o ? null : o;
  }
  function toggleTech(t: string) {
    tech = tech === t ? null : t;
  }
  function reset() {
    group = null;
    org = null;
    tech = null;
  }

  // ── stagger rise on first scroll-into-view ──────────────────────────
  let root = $state<HTMLElement | null>(null);
  let inView = $state(false);

  onMount(() => {
    // Restore filters from the URL hash (#g=<group>&o=<org>&t=<tech>).
    const h = new URLSearchParams(window.location.hash.slice(1));
    const hg = h.get("g");
    const ho = h.get("o");
    const ht = h.get("t");
    if (hg && groupOrder.includes(hg)) group = hg;
    if (ho && projects.some((p) => p.org === ho)) org = ho;
    if (ht && projects.some((p) => (p.stack ?? []).includes(ht))) tech = ht;

    const el = root;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      inView = true;
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          inView = true;
          io.disconnect();
        }
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  });

  // Mirror filter state into the hash (replaceState — no history spam).
  $effect(() => {
    const p = new URLSearchParams();
    if (group) p.set("g", group);
    if (org) p.set("o", org);
    if (tech) p.set("t", tech);
    const s = p.toString();
    window.history.replaceState(null, "", s ? `#${s}` : window.location.pathname);
  });

  function spotlight(e: PointerEvent) {
    const card = e.currentTarget as HTMLElement;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  }
</script>

{#snippet cardInner(p: ProjectItem)}
  <span class="pg__sweep" aria-hidden="true"></span>
  <div class="pg__cover">
    {#if p.cover}
      <img
        class="pg__img"
        src={p.cover}
        alt={p.title}
        loading="lazy"
        decoding="async"
        onload={(e) => e.currentTarget.classList.add("is-loaded")}
        {@attach (el) => {
          // SSR'd covers often finish loading before hydration — the onload
          // above never fires for them, so sweep the already-complete case.
          const img = el as HTMLImageElement;
          if (img.complete && img.naturalWidth > 0) img.classList.add("is-loaded");
        }}
      />
    {:else}
      <DitherCover class="pg__dither" seed={p.title} alt={p.title} />
    {/if}
    <span class="pg__scan" aria-hidden="true"></span>
    <span class="pg__shimmer" aria-hidden="true"></span>
    {#if p.highlight}
      <span class="pg__hl" title={copy.highlighted}>[!]</span>
    {/if}
  </div>
  <div class="pg__body">
    <span class="pg__title">{p.title}</span>
    <span class="pg__meta">{p.org} · {p.period}</span>
    <p class="pg__desc">{p.description}</p>
    {#if p.stack && p.stack.length > 0}
      <ul class="pg__chips">
        {#each p.stack as s}
          {@const icon = iconFor(s)}
          <li class="pg__chip">
            {#if icon}
              <VoxelIcon name={icon} size={13} interactive={false} />
            {/if}
            <span>{s}</span>
          </li>
        {/each}
      </ul>
    {/if}
    {#if p.caseStudy}
      <span class="pg__actions">
        <a class="pg__case" href={p.caseStudy}>{copy.caseStudy} →</a>
        {#if p.url}
          <a class="pg__cta" href={p.url} target="_blank" rel="noopener noreferrer">
            {copy.visit} <span class="pg__arrow" aria-hidden="true">↗</span>
          </a>
        {/if}
      </span>
    {:else if p.url}
      <span class="pg__cta">
        {copy.visit} <span class="pg__arrow" aria-hidden="true">↗</span>
      </span>
    {/if}
  </div>
{/snippet}

<div class="pg" class:pg--in={inView} bind:this={root}>
  <div class="pg__bar">
    <div class="pg__row" role="group" aria-label={copy.filterEra}>
      <button
        type="button"
        class="pg__f"
        class:pg__f--on={group === null && org === null && tech === null}
        aria-pressed={group === null && org === null && tech === null}
        onclick={reset}
      >
        {copy.all} <span class="pg__n">{projects.length}</span>
      </button>
      {#each groups as g}
        <button
          type="button"
          class="pg__f"
          class:pg__f--on={group === g.key}
          aria-pressed={group === g.key}
          onclick={() => toggleGroup(g.key)}
          title={g.label}
        >
          {g.label} <span class="pg__n">{g.count}</span>
        </button>
      {/each}
    </div>

    <div class="pg__row" role="group" aria-label={copy.filterCompany}>
      {#each orgs as o}
        <button
          type="button"
          class="pg__f"
          class:pg__f--on={org === o.name}
          aria-pressed={org === o.name}
          onclick={() => toggleOrg(o.name)}
        >
          {o.name} <span class="pg__n">{o.count}</span>
        </button>
      {/each}
    </div>

    <div class="pg__row" role="group" aria-label={copy.filterTech}>
      {#each techs as t}
        <button
          type="button"
          class="pg__f pg__f--tech"
          class:pg__f--on={tech === t.name}
          aria-pressed={tech === t.name}
          onclick={() => toggleTech(t.name)}
        >
          {t.name} <span class="pg__n">{t.count}</span>
        </button>
      {/each}
    </div>

    <p class="pg__count" role="status">
      {filtered.length} {copy.countOf} {projects.length} {copy.projectsWord}
      {#if group || org || tech}
        — <button type="button" class="pg__clear" onclick={reset}>{copy.clearFilters}</button>
      {/if}
    </p>
  </div>

  {#if filtered.length > 0}
    <ul class="pg__grid">
      {#each filtered as p, i (p.slug)}
        <li class="pg__item" style="--idx: {i};">
          {#if p.url && !p.caseStudy}
            <a
              class="pg__card"
              class:pg__card--hl={p.highlight}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              onpointermove={spotlight}
            >
              {@render cardInner(p)}
            </a>
          {:else}
            <article
              class="pg__card pg__card--static"
              class:pg__card--hl={p.highlight}
              onpointermove={spotlight}
            >
              {@render cardInner(p)}
            </article>
          {/if}
        </li>
      {/each}
    </ul>
  {:else}
    <div class="pg__empty">
      <span class="bracket">{copy.noMatches}</span>
      <p>{copy.noMatchesDesc}</p>
      <button type="button" class="pg__f" onclick={reset}>{copy.resetFilters}</button>
    </div>
  {/if}
</div>

<style>
  .pg {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* ── filter bar ─────────────────────────────────────────────────── */
  .pg__bar {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .pg__row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .pg__f {
    display: inline-flex;
    align-items: baseline;
    gap: 0.4rem;
    padding: 0.42rem 0.75rem;
    border: 1px solid var(--line);
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.03em;
    cursor: pointer;
    transition:
      border-color var(--duration-hover) var(--ease-default),
      color var(--duration-hover) var(--ease-default),
      background-color var(--duration-hover) var(--ease-default),
      box-shadow var(--duration-hover) var(--ease-default);
  }
  .pg__f:hover {
    border-color: rgba(0, 255, 65, 0.5);
    color: var(--text);
  }
  .pg__f--on {
    border-color: rgba(0, 255, 65, 0.65);
    background: linear-gradient(180deg, rgba(0, 255, 65, 0.12), rgba(0, 255, 65, 0.04));
    color: var(--accent-soft);
    box-shadow: 0 0 0 1px rgba(0, 255, 65, 0.18), 0 4px 18px rgba(0, 255, 65, 0.1);
  }
  .pg__n {
    color: var(--muted-soft);
    font-size: 0.62rem;
  }
  .pg__f--on .pg__n { color: var(--accent-soft); opacity: 0.7; }

  .pg__count {
    margin: 0.3rem 0 0;
    font-family: var(--font-mono);
    font-size: 0.68rem;
    color: var(--muted-soft);
    letter-spacing: 0.04em;
  }
  .pg__clear {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: var(--accent-soft);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  /* ── grid ───────────────────────────────────────────────────────── */
  .pg__grid {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
  @media (min-width: 720px) { .pg__grid { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 1080px) { .pg__grid { grid-template-columns: repeat(3, 1fr); } }

  /* ── card ───────────────────────────────────────────────────────── */
  .pg__card {
    --mx: 50%;
    --my: 50%;
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: #000;
    color: var(--text);
    text-decoration: none;
    overflow: hidden;
    isolation: isolate;
    opacity: 0;
    transform: translateY(14px);
    transition:
      border-color var(--duration-hover) var(--ease-default),
      transform var(--duration-hover) var(--ease-default),
      box-shadow var(--duration-hover) var(--ease-default);
  }
  .pg__card--static { cursor: default; }
  .pg__card--hl { border-color: rgba(0, 255, 65, 0.32); }

  .pg--in .pg__card {
    animation: pg-rise 700ms var(--ease-emphasis) forwards;
    animation-delay: calc(min(var(--idx, 0), 11) * 70ms + 100ms);
  }
  @keyframes pg-rise {
    to { opacity: 1; transform: translateY(0); }
  }

  /* cursor spotlight — radial glow tracking the pointer */
  .pg__card::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background: radial-gradient(
      220px circle at var(--mx) var(--my),
      rgba(0, 255, 65, 0.09),
      transparent 70%
    );
    opacity: 0;
    transition: opacity var(--duration-hover) var(--ease-default);
  }
  .pg__card:hover::before { opacity: 1; }

  .pg__card:hover {
    border-color: var(--line-bright);
    transform: translateY(-4px);
    box-shadow: 0 20px 52px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(0, 255, 65, 0.12);
  }
  .pg__card--hl:hover { border-color: rgba(0, 255, 65, 0.55); }

  /* scanline sweep — one phosphor line scans top→bottom on hover */
  .pg__sweep {
    position: absolute;
    left: 0;
    right: 0;
    top: -2px;
    height: 2px;
    z-index: 2;
    background: linear-gradient(90deg, transparent, rgba(0, 255, 65, 0.75), transparent);
    opacity: 0;
    pointer-events: none;
  }
  .pg__card:hover .pg__sweep {
    opacity: 1;
    animation: pg-sweep 900ms var(--ease-default) 1;
  }
  @keyframes pg-sweep {
    from { transform: translateY(0); }
    to { transform: translateY(480px); }
  }

  /* ── cover (16:9) ───────────────────────────────────────────────── */
  .pg__cover {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-bottom: 1px solid var(--line);
    background: #020403;
  }
  .pg__img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(0.85) brightness(0.92);
    transition:
      filter 640ms var(--ease-default),
      opacity 640ms var(--ease-default),
      transform 640ms var(--ease-default);
  }
  /* Blur-up: starts soft + slightly zoomed, sharpens when the lazy cover
     finishes loading (is-loaded via onload / attachment). Gated on html.js
     so a no-JS render still shows the covers. */
  html.js .pg__img:not(.is-loaded) {
    filter: saturate(0.85) brightness(0.92) blur(16px);
    opacity: 0;
    transform: scale(1.06);
  }
  .pg__dither {
    position: absolute;
    inset: 0;
    border-radius: 0;
  }

  /* The cover "turns on" on hover — three CSS-only layers:
     1. Ken-Burns pan+zoom on the cover art itself (img or DitherCover host)
     2. .pg__scan — a phosphor band sweeping down the cover, looping
     3. .pg__shimmer — a dither-dot lattice pulsing over the art        */
  .pg__card:hover .pg__img {
    filter: none;
    animation: pg-kenburns 7s var(--ease-default) infinite alternate;
  }
  .pg__card:hover .pg__dither {
    animation:
      pg-kenburns 7s var(--ease-default) infinite alternate,
      pg-pulse 1.8s ease-in-out infinite;
  }
  @keyframes pg-kenburns {
    from { transform: scale(1.02) translate(0, 0); }
    to   { transform: scale(1.12) translate(-2.2%, -2.8%); }
  }
  @keyframes pg-pulse {
    0%, 100% { filter: brightness(1); }
    50%      { filter: brightness(1.22); }
  }

  .pg__scan {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 38%;
    z-index: 1;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(0, 255, 65, 0.05) 55%,
      rgba(0, 255, 65, 0.28) 82%,
      rgba(0, 255, 65, 0.75) 96%,
      transparent 100%
    );
    mix-blend-mode: screen;
    opacity: 0;
    transform: translateY(-105%);
    pointer-events: none;
  }
  .pg__card:hover .pg__scan {
    opacity: 1;
    animation: pg-cover-scan 1.6s linear infinite;
  }
  @keyframes pg-cover-scan {
    from { transform: translateY(-105%); }
    to   { transform: translateY(270%); }
  }

  .pg__shimmer {
    position: absolute;
    inset: 0;
    z-index: 1;
    background-image: radial-gradient(rgba(0, 255, 65, 0.55) 1px, transparent 1.4px);
    background-size: 6px 6px;
    mix-blend-mode: screen;
    opacity: 0;
    pointer-events: none;
  }
  .pg__card:hover .pg__shimmer {
    animation: pg-shimmer 2.4s ease-in-out infinite;
  }
  @keyframes pg-shimmer {
    0%, 100% { opacity: 0.04; background-position: 0 0; }
    50%      { opacity: 0.16; background-position: 3px 3px; }
  }

  .pg__hl {
    position: absolute;
    top: 0.55rem;
    right: 0.65rem;
    z-index: 2;
    font-family: var(--font-mono);
    font-size: 0.66rem;
    letter-spacing: 0.05em;
    color: var(--accent);
    text-shadow: 0 0 10px rgba(0, 255, 65, 0.6);
  }

  /* ── body ───────────────────────────────────────────────────────── */
  .pg__body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1.1rem 1.2rem 1.25rem;
    flex: 1;
  }

  .pg__title {
    font-family: var(--font-display);
    font-size: 1.2rem;
    line-height: 1.15;
  }

  .pg__meta {
    font-family: var(--font-mono);
    font-size: 0.66rem;
    color: var(--muted-soft);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .pg__desc {
    margin: 0;
    color: var(--muted);
    font-size: 0.88rem;
    line-height: 1.5;
  }

  .pg__chips {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 0.4rem;
    padding: 0;
    margin: 0.15rem 0 0;
  }
  .pg__chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.18rem 0.5rem;
    border: 1px solid var(--line);
    border-radius: var(--radius-pill);
    font-family: var(--font-mono);
    font-size: 0.64rem;
    color: var(--muted-soft);
  }

  .pg__cta {
    margin-top: auto;
    padding-top: 0.6rem;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--accent-soft);
    opacity: 0.75;
    transition: opacity var(--duration-hover) var(--ease-default);
  }
  .pg__card:hover .pg__cta {
    opacity: 1;
    text-shadow: 0 0 12px rgba(0, 255, 65, 0.45);
  }
  .pg__arrow {
    display: inline-block;
    transition: transform var(--duration-hover) var(--ease-default);
  }
  .pg__card:hover .pg__arrow { transform: translate(2px, -2px); }

  .pg__case {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--accent-soft);
    opacity: 0.75;
    transition: opacity var(--duration-hover) var(--ease-default);
  }
  .pg__case:hover {
    opacity: 1;
    text-shadow: 0 0 12px rgba(0, 255, 65, 0.45);
  }
  .pg__actions {
    margin-top: auto;
    padding-top: 0.6rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.65rem 1rem;
  }
  .pg__actions .pg__cta { margin-top: 0; padding-top: 0; }

  /* ── empty state ────────────────────────────────────────────────── */
  .pg__empty {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.9rem;
    padding: 3rem 2rem;
    border: 1px dashed var(--line);
    border-radius: var(--radius-card);
    color: var(--muted);
  }
  .pg__empty p { margin: 0; }

  @media (prefers-reduced-motion: reduce) {
    .pg__card { opacity: 1; transform: none; animation: none; }
    .pg--in .pg__card { animation: none; }
    .pg__card:hover { transform: none; }
    .pg__sweep { display: none; }
    .pg__img { transition: none; }
    .pg__card:hover .pg__img,
    .pg__card:hover .pg__dither,
    .pg__card:hover .pg__scan,
    .pg__card:hover .pg__shimmer {
      animation: none;
    }
    .pg__scan,
    .pg__shimmer { display: none; }
  }
</style>
