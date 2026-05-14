<script lang="ts">
  import RotatingVerb from "./RotatingVerb.svelte";
  import HeroParticles from "./HeroParticles.svelte";
  import CodeStream from "./CodeStream.svelte";
  import CloudField from "./CloudField.svelte";

  const verbs = [
    "autonomous agents",
    "post-quantum tools",
    "DeFi trading bots",
    "spec-driven loops",
    "AI search infra",
    "wallet UX",
  ];

  const GH_USER = "rubenmarcus";

  interface GitHubStats {
    today: number;
    month: number;
    year: number;
    total: number;
    lastCommit: { message: string; repo: string; url: string } | null;
  }

  let stats = $state<GitHubStats | null>(null);
  let mouse = $state({ x: 0, y: 0 });
  let zoom = $state(1.15);
  let video: HTMLVideoElement | null = $state(null);
  let hovering = $state(false);

  $effect(() => {
    if (video) {
      try { video.playbackRate = 1.15; } catch {}
    }
  });

  $effect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      mouse = { x, y };
    };
    const onWheel = (e: WheelEvent) => {
      zoom = Math.min(Math.max(zoom + e.deltaY * 0.0008, 1.1), 1.4);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("wheel", onWheel);
    };
  });

  $effect(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    Promise.all([
      fetch(`https://github-contributions-api.jogruber.de/v4/${GH_USER}?y=last`).then((r) => r.json()).catch(() => null),
      fetch(`https://api.github.com/users/${GH_USER}/events/public?per_page=30`).then((r) => r.json()).catch(() => []),
      fetch(`https://github-contributions-api.jogruber.de/v4/${GH_USER}`).then((r) => r.json()).catch(() => null),
    ])
      .then(([contribData, events, allData]) => {
        if (!contribData) return;
        const contributions: { date: string; count: number }[] = contribData.contributions || [];
        let today = 0, month = 0, year = 0;
        for (const c of contributions) {
          const d = new Date(c.date);
          if (c.date === todayStr) today = c.count;
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) month += c.count;
          if (d.getFullYear() === currentYear) year += c.count;
        }
        const totalByYear: Record<string, number> = allData?.total || {};
        const total = Object.values(totalByYear).reduce<number>((sum, n) => sum + (n as number), 0);

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

        stats = { today, month, year, total, lastCommit };
      })
      .catch(() => {});
  });

  const inCenter = $derived(hovering && Math.abs(mouse.x) < 0.3 && Math.abs(mouse.y) < 0.3);
  const activeZoom = $derived(inCenter ? zoom + 0.08 : zoom);
  const parallaxX = $derived(mouse.x * 22);
  const parallaxY = $derived(mouse.y * 22);
  const haloX = $derived(((mouse.x + 1) * 50).toFixed(1) + "%");
  const haloY = $derived(((mouse.y + 1) * 50).toFixed(1) + "%");
</script>

<section
  class="hero"
  onmouseenter={() => (hovering = true)}
  onmouseleave={() => (hovering = false)}
  role="region"
  aria-label="Intro"
>
  <!-- Background ASCII head video, with mouse parallax + scroll zoom -->
  <div
    class="hero__bg"
    style:transform={`translate(${parallaxX}px, ${parallaxY}px)`}
  >
    <video
      bind:this={video}
      autoplay
      loop
      muted
      playsinline
      preload="auto"
      class="hero__video"
      style:transform={`scale(${activeZoom})`}
    >
      <source src="/videobg.webm" type="video/webm" />
    </video>

    <!-- Ice-blue tint over the video — preserves luminance, applies hue -->
    <div class="hero__iceTint" aria-hidden="true"></div>

    <!-- Drifting cloud blobs, like the quantum-website FBM cloud field -->
    <CloudField client:load blobs={6} class="hero__clouds" />

    <!-- Live code feed — real snippets from his open-source projects -->
    <CodeStream client:load count={5} class="hero__code" />

    <!-- Mouse-tracked halo — quantum-style flashlight beam -->
    <div
      class="hero__halo"
      aria-hidden="true"
      style:--mx={haloX}
      style:--my={haloY}
    ></div>

    <!-- Ice-blue particle emitter that follows the cursor -->
    <HeroParticles client:load rate={2.6} life={1200} class="hero__particles" />

    <!-- Edge-darkening vignette — radial dark from edges in, plus a heavier
         lower-right gradient where the text card sits -->
    <div class="hero__vignette" aria-hidden="true"></div>
    <div class="hero__grid" aria-hidden="true"></div>
  </div>

  <!-- Top row: GitHub stats marquee + status pill -->
  <div class="hero__top container-x">
    <div class="hero__status">
      <span class="hero__dot" aria-hidden="true"></span>
      <span class="bracket hero__statusBracket">[ Available — selectively ]</span>
      <span class="hero__statusBase">Lisbon · Worldwide</span>
    </div>

    {#if stats}
      <div class="hero__stats">
        <span>{stats.today} commits today</span>
        <span class="hero__sep">·</span>
        <span>{stats.month} this month</span>
        <span class="hero__sep">·</span>
        <span>{stats.year} this year</span>
        {#if stats.lastCommit}
          <span class="hero__sep">·</span>
          <a class="hero__commit" href={stats.lastCommit.url} target="_blank" rel="noopener">
            last: {stats.lastCommit.message} <span class="hero__commitRepo">({stats.lastCommit.repo})</span>
          </a>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Bottom-right: heavy dark card carrying the main text (Defined VC style) -->
  <div class="hero__cardWrap container-x">
    <div class="hero__card">
      <div class="hero__cardHead">
        <span class="bracket">[ 00 / Index ]</span>
        <span class="hero__cardName">Ruben Marcus</span>
      </div>

      <h1 class="hero__title">
        Building
        <RotatingVerb words={verbs} interval={2800} fadeMs={340} italic={true} class="hero__verb" />
        <span class="hero__cursor" aria-hidden="true">_</span>
      </h1>

      <p class="hero__desc">
        Senior AI Fullstack Engineer at <a href="https://multivmlabs.com" target="_blank" rel="noopener" class="link-inline">MultiVM Labs</a>.
        13 years shipping across web3, fintech, and e-commerce — most recently 10+ AI agents for DeFi on Solana, EVM, SUI, NEAR, and Cardano.
      </p>

      <div class="hero__ctas">
        <a href="/portfolio" class="btn btn-primary">See the work</a>
        <a href="/ai" class="btn btn-secondary">AI tools I ship</a>
      </div>

      <div class="hero__tagRow">
        <span class="bracket">[ Stack ]</span>
        <span>React</span><span>·</span>
        <span>Next.js</span><span>·</span>
        <span>TypeScript</span><span>·</span>
        <span>Svelte</span><span>·</span>
        <span>Rust</span><span>·</span>
        <span>EVM</span><span>·</span>
        <span>NEAR</span><span>·</span>
        <span>SUI</span>
      </div>
    </div>
  </div>

  <!-- Side icon column (desktop only) -->
  <div class="hero__sideIcons" aria-label="Social links">
    <a href="https://github.com/rubenmarcus" target="_blank" rel="noopener" aria-label="GitHub" class="hero__iconLink">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2A10 10 0 0 0 8.84 21.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.69.92.69 1.85V21c0 .27.16.59.67.5A10 10 0 0 0 12 2z"/>
      </svg>
    </a>
    <a href="https://x.com/rubenmarcus_dev" target="_blank" rel="noopener" aria-label="X / Twitter" class="hero__iconLink">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2H21.5l-7.5 8.572L23 22h-6.91l-4.81-6.288L5.7 22H2.44l8.02-9.166L1.5 2h7.05l4.34 5.745L18.244 2zm-1.21 18h1.91L7.06 4H5.05l11.985 16z"/>
      </svg>
    </a>
    <a href="https://linkedin.com/in/rubenmarcus" target="_blank" rel="noopener" aria-label="LinkedIn" class="hero__iconLink">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M4 4h4v16H4zM6 2.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM10 8h3.8v2.2h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V20h-4v-5.7c0-1.36-.03-3.1-1.9-3.1-1.9 0-2.2 1.48-2.2 3v5.8h-4V8z"/>
      </svg>
    </a>
    <a href="mailto:rubenmarcus.dev@gmail.com" aria-label="Email" class="hero__iconLink">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2"/>
        <path d="M3 7l9 6 9-6"/>
      </svg>
    </a>
  </div>
</section>

<style>
  .hero {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    isolation: isolate;
    padding-top: 6rem;
    padding-bottom: 2.5rem;
  }

  .hero__bg {
    position: absolute;
    inset: -4%;
    z-index: -2;
    transition: transform 0.8s var(--ease-default);
  }

  .hero__video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform-origin: center center;
    transition: transform 0.8s var(--ease-default);
    /* Lift luminance + heavy desaturation so the ice tint reads cleanly */
    filter: brightness(0.86) contrast(1.04) saturate(0.18);
  }

  /* Ice-blue tint over the video */
  .hero__iceTint {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      135deg,
      rgba(200, 235, 255, 0.5) 0%,
      rgba(150, 210, 245, 0.45) 35%,
      rgba(100, 180, 230, 0.45) 65%,
      rgba(60, 140, 200, 0.5) 100%
    );
    mix-blend-mode: color;
  }

  :global(.hero__clouds) {
    position: absolute !important;
    inset: 0;
    z-index: 0;
    opacity: 0.75;
  }

  :global(.hero__code) {
    position: absolute !important;
    inset: 0;
    z-index: 0;
    color: rgba(190, 230, 255, 0.55) !important;
  }

  /* Quantum-style flashlight halo */
  .hero__halo {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(
        circle 90px at var(--mx, 50%) var(--my, 50%),
        rgba(255, 255, 255, 0.5) 0%,
        rgba(220, 240, 255, 0.28) 60%,
        transparent 100%
      ),
      radial-gradient(
        circle 300px at var(--mx, 50%) var(--my, 50%),
        rgba(190, 230, 255, 0.2) 0%,
        rgba(120, 185, 235, 0.08) 40%,
        transparent 72%
      );
    mix-blend-mode: screen;
    transition: background 70ms linear;
    opacity: 1;
  }

  :global(.hero__particles) {
    z-index: 1;
  }

  /* Vignette — darker at edges + heavier under the bottom-right card */
  .hero__vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(ellipse 110% 90% at 50% 45%, transparent 0%, rgba(6, 8, 15, 0.45) 70%, rgba(6, 8, 15, 0.85) 100%),
      radial-gradient(circle at 90% 88%, rgba(6, 8, 15, 0.65) 0%, transparent 55%);
  }

  .hero__grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.14;
    background-image:
      linear-gradient(rgba(245, 241, 234, 0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(245, 241, 234, 0.06) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: radial-gradient(ellipse at center, #000 30%, transparent 80%);
  }

  /* ── Top row ── */
  .hero__top {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    align-items: flex-start;
    justify-content: space-between;
  }
  @media (min-width: 720px) {
    .hero__top { flex-direction: row; align-items: center; }
  }

  .hero__status {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.4rem 0.7rem;
    border-radius: var(--radius-pill);
    background: rgba(6, 8, 15, 0.6);
    backdrop-filter: blur(var(--blur-sm));
    -webkit-backdrop-filter: blur(var(--blur-sm));
    border: 1px solid var(--line);
    font-family: var(--font-mono);
    font-size: 0.74rem;
    color: var(--muted);
  }

  .hero__dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #5ee2a8;
    box-shadow: 0 0 0 4px rgba(94, 226, 168, 0.18);
    animation: pulse 2s infinite var(--ease-default);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
  }

  .hero__statusBase { color: var(--muted-soft); }

  .hero__stats {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.45rem 0.55rem;
    padding: 0.4rem 0.75rem;
    border-radius: var(--radius-pill);
    background: rgba(6, 8, 15, 0.5);
    backdrop-filter: blur(var(--blur-sm));
    -webkit-backdrop-filter: blur(var(--blur-sm));
    border: 1px solid var(--line);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--muted-soft);
  }
  .hero__sep { color: var(--muted-soft); opacity: 0.6; }
  .hero__commit { color: var(--muted); transition: color var(--duration-hover) var(--ease-default); }
  .hero__commit:hover { color: var(--accent-soft); }
  .hero__commitRepo { color: var(--muted-soft); }

  /* ── Bottom-right text card (Defined VC inspired) ── */
  .hero__cardWrap {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 2.5rem;
    z-index: 3;
    display: flex;
    justify-content: flex-end;
  }

  .hero__card {
    width: 100%;
    max-width: 540px;
    padding: 1.8rem 1.8rem 1.6rem;
    border: 1px solid var(--line-strong);
    border-radius: 18px;
    background: rgba(6, 8, 15, 0.92);
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
    box-shadow:
      0 0 0 1px rgba(58, 109, 255, 0.18),
      0 24px 60px rgba(0, 0, 0, 0.55);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  @media (min-width: 720px) {
    .hero__card { padding: 2.2rem 2.2rem 2rem; }
  }

  .hero__cardHead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
  }

  .hero__cardName {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--muted-soft);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .hero__title {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(2rem, 4.5vw, 3.4rem);
    line-height: 0.98;
    letter-spacing: -0.012em;
    color: var(--text);
    display: inline-flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35rem 0.55rem;
    text-wrap: balance;
  }

  :global(.hero__verb) {
    color: var(--accent-soft);
  }

  .hero__cursor {
    display: inline-block;
    color: var(--accent-soft);
    animation: blink 1.1s steps(1) infinite;
    transform: translateY(-0.05em);
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  .hero__desc {
    color: var(--muted);
    font-size: 0.96rem;
    line-height: 1.55;
    max-width: 48ch;
  }

  .hero__ctas {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 0.4rem;
  }

  .hero__tagRow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.6rem;
    padding-top: 1rem;
    border-top: 1px dashed var(--line);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--muted-soft);
  }
  .hero__tagRow > span:not(.bracket) {
    padding: 0.18rem 0.5rem;
    border: 1px solid var(--line);
    border-radius: var(--radius-pill);
    color: var(--muted);
    background: rgba(160, 195, 255, 0.04);
  }
  .hero__tagRow > span:nth-child(even):not(.bracket) {
    border: none;
    padding: 0;
    background: transparent;
    color: var(--muted-soft);
    opacity: 0.45;
  }

  /* ── Side icon column ── */
  .hero__sideIcons {
    display: none;
    position: absolute;
    left: 1.5rem;
    top: 50%;
    transform: translateY(-50%);
    flex-direction: column;
    gap: 1.1rem;
    align-items: center;
    z-index: 3;
  }
  @media (min-width: 1100px) {
    .hero__sideIcons { display: inline-flex; }
  }

  .hero__iconLink {
    display: inline-grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border: 1px solid var(--line);
    border-radius: 999px;
    color: var(--muted);
    background: rgba(6, 8, 15, 0.55);
    backdrop-filter: blur(var(--blur-sm));
    -webkit-backdrop-filter: blur(var(--blur-sm));
    transition:
      color var(--duration-hover) var(--ease-default),
      border-color var(--duration-hover) var(--ease-default),
      background-color var(--duration-hover) var(--ease-default),
      transform var(--duration-hover) var(--ease-default);
  }
  .hero__iconLink:hover {
    color: var(--accent-soft);
    border-color: rgba(58, 109, 255, 0.45);
    background: rgba(58, 109, 255, 0.12);
    transform: translateX(2px);
  }
</style>
