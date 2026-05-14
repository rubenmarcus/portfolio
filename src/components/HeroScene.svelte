<script lang="ts">
  import RotatingVerb from "./RotatingVerb.svelte";

  const verbs = [
    "autonomous agents",
    "post-quantum tools",
    "NFT infrastructure",
    "AI tooling",
    "spec-driven loops",
  ];

  // GitHub stats — same source as before
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

  // Mouse + wheel for parallax and zoom
  $effect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      mouse = { x, y };
    };
    const onWheel = (e: WheelEvent) => {
      // gentle parallax zoom — don't preventDefault so smooth scroll still works
      zoom = Math.min(Math.max(zoom + e.deltaY * 0.0008, 1.1), 1.4);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("wheel", onWheel);
    };
  });

  // GitHub stats fetch
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
        let today = 0,
          month = 0,
          year = 0;
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
  // Mouse coords mapped to 0–100% for the halo CSS vars
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

    <!-- Blue tint over the video — applies hue/saturation, preserves luminance -->
    <div class="hero__blueTint" aria-hidden="true"></div>

    <!-- Mouse-tracked halo, like the flashlight effect in the quantum-website ASCII shader -->
    <div
      class="hero__halo"
      aria-hidden="true"
      style:--mx={haloX}
      style:--my={haloY}
    ></div>

    <div class="hero__vignette" aria-hidden="true"></div>
    <div class="hero__grid" aria-hidden="true"></div>
  </div>

  <!-- Top marquee strip with GitHub stats / status -->
  <div class="hero__top container-x">
    <div class="hero__status">
      <span class="hero__dot" aria-hidden="true"></span>
      <span class="hero__statusText">
        <span class="bracket hero__statusBracket">[ Available — selectively ]</span>
        <span class="hero__statusBase">Lisbon · Worldwide</span>
      </span>
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

  <!-- Center content -->
  <div class="hero__center container-x">
    <span class="bracket hero__overline">[ 00 / Index ]</span>

    <h1 class="hero__title">
      <span class="hero__titlePrefix">Ruben builds</span>
      <RotatingVerb words={verbs} interval={2600} fadeMs={320} italic={true} class="hero__verb" />
      <span class="hero__cursor" aria-hidden="true">_</span>
    </h1>

    <p class="hero__desc">
      Senior AI Fullstack Engineer at <a href="https://multivmlabs.com" target="_blank" rel="noopener" class="link-inline">MultiVM Labs</a>.
      I ship CLIs, agents, and product surfaces — from spec-to-PR autonomy to post-quantum infrastructure.
    </p>

    <div class="hero__ctas">
      <a href="/portfolio" class="btn btn-primary">See the work</a>
      <a href="/ai" class="btn btn-secondary">AI tools I ship</a>
      <a href="/contact" class="btn btn-ghost">Get in touch →</a>
    </div>
  </div>

  <!-- Bottom row: identity tags -->
  <div class="hero__bottom container-x">
    <div class="hero__tagRow">
      <span class="bracket">[ Stack ]</span>
      <span class="hero__tag">Astro</span>
      <span class="hero__tag">Svelte</span>
      <span class="hero__tag">TypeScript</span>
      <span class="hero__tag">Next.js</span>
      <span class="hero__tag">Node</span>
      <span class="hero__tag">Three.js</span>
      <span class="hero__tag">Rust</span>
      <span class="hero__tag">NEAR</span>
      <span class="hero__tag">EVM</span>
    </div>
    <div class="hero__scrollHint">
      <span class="overline">Scroll</span>
      <span class="hero__arrow" aria-hidden="true">↓</span>
    </div>
  </div>

  <!-- Social column -->
  <div class="hero__socials">
    <a href="https://github.com/rubenmarcus" target="_blank" rel="noopener" class="nav-link">GitHub</a>
    <a href="https://x.com/rubenmarcus_dev" target="_blank" rel="noopener" class="nav-link">X</a>
    <a href="https://linkedin.com/in/rubenmarcus" target="_blank" rel="noopener" class="nav-link">LinkedIn</a>
    <a href="https://dev.to/rubenmarcus" target="_blank" rel="noopener" class="nav-link">dev.to</a>
  </div>
</section>

<style>
  .hero {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    isolation: isolate;
    padding-top: 7rem;
    padding-bottom: 3rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 2rem;
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
    /* Slight desaturation + lift so the blue tint reads cleanly */
    filter: brightness(0.78) contrast(1.05) saturate(0.4);
  }

  /* Blue color wash — sits on top of the video. `mix-blend-mode: color` applies
     the hue and saturation of this gradient while preserving the video's
     luminance, so the ASCII head reads as a deep electric-blue rendering. */
  .hero__blueTint {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      135deg,
      rgba(42, 92, 255, 0.62) 0%,
      rgba(20, 50, 160, 0.55) 50%,
      rgba(10, 25, 70, 0.7) 100%
    );
    mix-blend-mode: color;
  }

  /* Mouse-tracked halo — additive light wash that follows the cursor.
     Mimics the flashlight effect from the quantum-website ASCII shader. */
  .hero__halo {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(
        circle 360px at var(--mx, 50%) var(--my, 50%),
        rgba(120, 170, 255, 0.32) 0%,
        rgba(60, 110, 230, 0.18) 28%,
        transparent 65%
      );
    mix-blend-mode: screen;
    transition: background 90ms linear;
    opacity: 0.85;
  }

  .hero__vignette {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at center, transparent 35%, rgba(12, 13, 16, 0.55) 75%, var(--bg-0) 100%),
      linear-gradient(180deg, rgba(12, 13, 16, 0.55) 0%, transparent 25%, transparent 65%, rgba(12, 13, 16, 0.85) 100%);
    pointer-events: none;
  }

  .hero__grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.18;
    background-image:
      linear-gradient(rgba(245, 241, 234, 0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(245, 241, 234, 0.06) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: radial-gradient(ellipse at center, #000 30%, transparent 80%);
  }

  /* Top stats strip */
  .hero__top {
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
    font-family: var(--font-mono);
    font-size: 0.78rem;
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

  .hero__statusText {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
  }
  .hero__statusBase {
    color: var(--muted-soft);
  }

  .hero__stats {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.45rem 0.55rem;
    font-family: var(--font-mono);
    font-size: 0.74rem;
    color: var(--muted-soft);
  }
  .hero__sep { color: var(--muted-soft); opacity: 0.6; }
  .hero__commit { color: var(--muted); transition: color var(--duration-hover) var(--ease-default); }
  .hero__commit:hover { color: var(--accent-soft); }
  .hero__commitRepo { color: var(--muted-soft); }

  /* Center block */
  .hero__center {
    display: flex;
    flex-direction: column;
    gap: 1.3rem;
    flex: 1;
    justify-content: center;
    padding-block: 4rem;
  }

  .hero__overline {
    color: var(--muted);
  }

  .hero__title {
    font-family: var(--font-display);
    font-size: clamp(2.75rem, 8vw, 7.5rem);
    line-height: 0.96;
    letter-spacing: -0.015em;
    color: var(--text);
    text-wrap: balance;
    display: inline-flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.4rem 0.55rem;
  }

  .hero__titlePrefix {
    color: var(--text);
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
    max-width: 56ch;
    color: var(--muted);
    font-size: 1.05rem;
  }

  .hero__ctas {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    margin-top: 0.8rem;
  }

  /* Bottom row */
  .hero__bottom {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    justify-content: space-between;
  }
  @media (min-width: 720px) {
    .hero__bottom { flex-direction: row; align-items: center; }
  }

  .hero__tagRow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.6rem;
    font-family: var(--font-mono);
    font-size: 0.74rem;
    color: var(--muted);
  }

  .hero__tag {
    padding: 0.22rem 0.55rem;
    border: 1px solid var(--line);
    border-radius: var(--radius-pill);
    color: var(--muted);
    background: rgba(245, 241, 234, 0.02);
  }

  .hero__scrollHint {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    color: var(--muted-soft);
  }

  .hero__arrow {
    animation: arrow-bob 2s ease-in-out infinite;
  }

  @keyframes arrow-bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(4px); }
  }

  /* Side socials */
  .hero__socials {
    display: none;
    position: absolute;
    left: 1.5rem;
    top: 50%;
    transform: translateY(-50%) rotate(-90deg);
    transform-origin: left center;
    gap: 1.6rem;
    font-family: var(--font-mono);
    font-size: 0.74rem;
  }
  @media (min-width: 1100px) {
    .hero__socials { display: inline-flex; }
  }
</style>
