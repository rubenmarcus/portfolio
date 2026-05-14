<script lang="ts">
  import RotatingVerb from "./RotatingVerb.svelte";
  import CodeStream from "./CodeStream.svelte";
  import CloudField from "./CloudField.svelte";
  import AsciiField from "./AsciiField.svelte";

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

    <!-- Sparse reactive ASCII field — glyphs brighten + condense in a halo
         around the cursor (quantum-website density-boost flashlight) -->
    <AsciiField
      client:load
      cell={14}
      density={0.08}
      morphRate={1.4}
      opacity={0.16}
      reactive={true}
      color="rgba(200, 230, 255, 1)"
      class="hero__asciiHalo"
    />

    <!-- Live code feed — real snippets from his open-source projects -->
    <CodeStream client:load count={7} class="hero__code" />

    <!-- Mouse-tracked halo — quantum-style flashlight beam -->
    <div
      class="hero__halo"
      aria-hidden="true"
      style:--mx={haloX}
      style:--my={haloY}
    ></div>

    <!-- Edge-darkening vignette — pushed darker so all text reads clearly -->
    <div class="hero__vignette" aria-hidden="true"></div>
    <div class="hero__grid" aria-hidden="true"></div>
  </div>

  <!-- Top-right: live GitHub commits badge with the green pulse dot -->
  {#if stats}
    <a
      class="hero__commitsBadge"
      href={stats.lastCommit?.url ?? `https://github.com/${GH_USER}`}
      target="_blank"
      rel="noopener"
    >
      <span class="hero__dot" aria-hidden="true"></span>
      <span class="hero__commitsBig">{stats.today} commits today</span>
      <span class="hero__commitsSub">
        {stats.month} this month · {stats.year} this year
      </span>
      {#if stats.lastCommit}
        <span class="hero__commitsLast">
          last: <em>{stats.lastCommit.message}</em>
          <span class="hero__commitsRepo">({stats.lastCommit.repo})</span>
        </span>
      {/if}
    </a>
  {/if}

  <!-- Bottom-right: heavy dark card carrying the main text (Defined VC style).
       Intentionally OUT of the page container — hugs the right edge of the
       viewport with a small inset gap. -->
  <div class="hero__cardWrap">
    <div class="hero__card">
      <div class="hero__cardHead">
        <span class="hero__indexLabel">00 / Index</span>
        <span class="hero__cardName">Ruben Marcus</span>
      </div>

      <h1 class="hero__title">
        Building
        <RotatingVerb words={verbs} interval={2800} fadeMs={340} italic={false} class="hero__verb" />
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

      <!-- Stack row with inline brand icons -->
      <div class="hero__stack">
        <span class="hero__stackLabel">Stack</span>

        <span class="hero__stackItem" title="React">
          <svg width="14" height="14" viewBox="-11.5 -10.232 23 20.463" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
            <circle r="2.05" fill="currentColor"/>
            <g stroke="currentColor" fill="none">
              <ellipse rx="11" ry="4.2"/>
              <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
              <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
            </g>
          </svg>
          React
        </span>

        <span class="hero__stackItem" title="Next.js">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M11.572 0c-.176.01-.722.054-1.235.106C6.394.473 2.831 2.622 1.057 5.949A12.39 12.39 0 0 0 .15 8.366c-.25.844-.36 1.518-.394 2.451-.025.728-.012 1.072.039 1.747.166 2.213.95 4.346 2.231 6.066.273.368.929 1.124 1.298 1.497.732.74 1.451 1.297 2.39 1.81.99.541 1.857.892 2.873 1.16.516.137 1.123.241 1.602.273.276.018 1.21.018 1.473 0 .728-.05 1.218-.144 1.937-.371.85-.268 1.69-.673 2.39-1.16 1.61-1.12 2.95-2.71 3.853-4.553a12.06 12.06 0 0 0 .77-2.215c.298-1.32.42-2.685.353-3.973-.103-1.991-.62-3.86-1.553-5.535-.745-1.34-1.762-2.486-2.998-3.38C16.927.957 14.99.275 13.084.106 12.864.087 11.91.011 11.572 0zm4.665 7.51c.27.034.49.137.626.292.06.067.21.36.21.413 0 .015-.073.013-.123 0l-.117-.04c-.31-.073-.66-.044-.96.08-.31.13-.51.34-.624.65-.146.4-.043.81.27 1.084.083.077.18.13.516.291l.18.087c.45.215.752.523.86.876.029.097.043.224.043.355 0 .447-.221.83-.628 1.087-.452.286-1.114.354-1.7.176-.484-.147-.95-.491-1.158-.86l-.123-.21c.024-.013.06-.034.07-.044l.085-.05.16-.094.07.107a.99.99 0 0 0 .268.282c.337.218.83.193 1.18-.063.197-.142.293-.31.293-.51 0-.179-.063-.31-.234-.485-.124-.127-.205-.176-.59-.36-.5-.243-.795-.467-1.027-.79a1.34 1.34 0 0 1-.23-.748c-.018-.422.117-.776.4-1.058.343-.34.84-.51 1.452-.484zm-7.42 1.045v6.05c0 .117-.005.227-.013.245-.026.058-.087.118-.16.157-.058.029-.108.034-.376.034H7.992v-.166c0-.092.005-.166.012-.166.007 0 .078-.007.158-.015.236-.025.388-.16.45-.395.016-.06.025-.225.025-1.66V8.555zm-.026.184l1.572 2.07.788 1.034c.013-.013.044-.234.073-.49.013-.117.026-.252.026-.295V8.738z"/>
          </svg>
          Next.js
        </span>

        <span class="hero__stackItem" title="TypeScript">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.1 5.1 0 0 0-.717-.26 5.5 5.5 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.87.87 0 0 0-.14.484c0 .197.05.375.151.532.1.158.244.31.43.453s.41.286.673.427c.263.14.56.286.892.437.46.221.879.482 1.255.785s.71.673.978 1.058c.27.385.483.84.643 1.358.16.518.241 1.135.241 1.847 0 .814-.158 1.51-.473 2.087a4 4 0 0 1-1.302 1.432 5.7 5.7 0 0 1-1.953.823 12 12 0 0 1-2.382.243c-.781 0-1.5-.057-2.184-.173-.685-.117-1.276-.291-1.775-.524v-2.621a5 5 0 0 0 1.083.621 7 7 0 0 0 1.226.36 6.4 6.4 0 0 0 1.255.13c.471 0 .863-.038 1.184-.124.32-.085.57-.213.755-.385.184-.171.31-.376.385-.617a2 2 0 0 0 .102-.624 1.4 1.4 0 0 0-.198-.741 2.2 2.2 0 0 0-.51-.617 5.5 5.5 0 0 0-.793-.51c-.305-.16-.682-.327-1.083-.494a8.9 8.9 0 0 1-1.165-.585 4.6 4.6 0 0 1-.94-.726c-.27-.27-.482-.575-.642-.927a2.95 2.95 0 0 1-.234-1.222c0-.69.155-1.275.466-1.755.31-.48.72-.886 1.226-1.222.51-.336 1.083-.575 1.74-.726a8.4 8.4 0 0 1 1.997-.226zM3.31 9.945h11.13v2.082h-4.244v12.001H7.625V12.027H3.31z"/>
          </svg>
          TypeScript
        </span>

        <span class="hero__stackItem" title="Svelte">
          <svg width="14" height="14" viewBox="0 0 98.1 118" fill="currentColor" aria-hidden="true">
            <path d="M91.8 15.6C80.9-.1 59.2-4.7 43.6 5.2L16.1 22.8C8.6 27.5 3.4 35.2 1.9 43.9c-1.3 7.3-.2 14.8 3.3 21.3-2.4 3.6-4 7.6-4.7 11.8-1.6 8.9.5 18 5.7 25.3 11 15.7 32.6 20.3 48.2 10.4l27.5-17.5c7.5-4.7 12.7-12.4 14.2-21.1 1.3-7.3.2-14.8-3.3-21.3 2.4-3.6 4-7.6 4.7-11.8 1.7-9-.4-18.1-5.6-25.4M40.9 103.9c-7.9 2-16.3-1.1-21-7.7-3.1-4.4-4.4-9.9-3.4-15.3.2-.9.4-1.7.7-2.6l.5-1.7 1.5 1.1c3.5 2.6 7.4 4.5 11.6 5.8l1.1.3-.1 1.1c-.1 1.6.3 3.2 1.2 4.5 1.4 2 3.9 2.9 6.2 2.3.5-.1 1-.3 1.5-.6l27.5-17.5c1.2-.8 2-2 2.3-3.4.3-1.4 0-2.9-.8-4.1-1.4-2-3.9-2.9-6.2-2.3-.5.1-1 .3-1.5.6L52 70.1c-1.6.9-3.3 1.7-5 2.2-7.9 2-16.3-1.1-21-7.7-2.9-4.4-4.2-9.9-3.4-15.3 1-8.7 7.8-15.1 16.4-17.8 1.7-.5 3.4-.9 5.2-1 7.9-2 16.3 1.1 21 7.7 3.1 4.4 4.4 9.9 3.4 15.3-.2.9-.4 1.7-.7 2.6l-.5 1.7-1.5-1c-3.5-2.6-7.4-4.5-11.6-5.8L51 50.7l.1-1.1c.1-1.6-.3-3.2-1.2-4.5-1.4-2-3.9-2.9-6.2-2.3-.5.1-1 .3-1.5.6L14.6 60.8c-1.2.8-2 2-2.3 3.4-.3 1.4 0 2.9.8 4.1 1.4 2 3.9 2.9 6.2 2.3.5-.1 1-.3 1.5-.6L31.4 64c1.6-.9 3.3-1.7 5-2.2 1.7-.5 3.4-.9 5.2-1z"/>
          </svg>
          Svelte
        </span>

        <span class="hero__stackItem" title="Rust">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 8h5a2.5 2.5 0 0 1 0 5H8zM8 8v8M12 13l3 3"/>
          </svg>
          Rust
        </span>

        <span class="hero__stackItem" title="EVM / Ethereum">
          <svg width="12" height="14" viewBox="0 0 256 417" fill="currentColor" aria-hidden="true">
            <path opacity="0.7" d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"/>
            <path d="M127.962 0L0 212.32l127.962 75.639V154.158z"/>
            <path opacity="0.7" d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.6L256 236.587z"/>
            <path d="M127.962 416.905v-104.72L0 236.585z"/>
            <path opacity="0.4" d="M127.961 287.958l127.96-75.637-127.96-58.162z"/>
            <path opacity="0.5" d="M0 212.32l127.96 75.638v-133.8z"/>
          </svg>
          EVM
        </span>

        <span class="hero__stackItem" title="NEAR">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.97 2.51l-4.93 7.32a.43.43 0 0 0 .65.55l4.84-4.2c.16-.13.39-.02.39.18v11.31c0 .21-.27.31-.41.15L4.43 1.45A2.18 2.18 0 0 0 2.78.69h-.5a2.27 2.27 0 0 0-2.27 2.27v18.07a2.27 2.27 0 0 0 2.27 2.27 2.27 2.27 0 0 0 1.94-1.07l4.93-7.32a.43.43 0 0 0-.65-.55l-4.84 4.2c-.16.13-.39.02-.39-.18V7.05c0-.21.27-.31.41-.15L19.6 22.55a2.18 2.18 0 0 0 1.65.76h.5a2.27 2.27 0 0 0 2.27-2.27V2.97A2.27 2.27 0 0 0 21.74.7a2.27 2.27 0 0 0-1.94 1.07z"/>
          </svg>
          NEAR
        </span>

        <span class="hero__stackItem" title="SUI">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C7 9 5 12.5 5 16a7 7 0 0 0 14 0c0-3.5-2-7-7-14zm0 5.6c1.4 2 2.7 3.9 3.6 5.3.9 1.4 1.4 2.3 1.4 3.1a5 5 0 0 1-10 0c0-.8.5-1.7 1.4-3.1.9-1.4 2.2-3.3 3.6-5.3z"/>
          </svg>
          SUI
        </span>
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

  :global(.hero__asciiHalo) {
    position: absolute !important;
    inset: 0;
    z-index: 0;
    mix-blend-mode: screen;
  }

  :global(.hero__code) {
    position: absolute !important;
    inset: 0;
    z-index: 0;
    color: rgba(190, 230, 255, 0.62) !important;
  }

  /* Quantum-style flashlight halo — bright near-white core + cyan-frost falloff */
  .hero__halo {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(
        circle 90px at var(--mx, 50%) var(--my, 50%),
        rgba(255, 255, 255, 0.55) 0%,
        rgba(220, 240, 255, 0.3) 60%,
        transparent 100%
      ),
      radial-gradient(
        circle 320px at var(--mx, 50%) var(--my, 50%),
        rgba(190, 230, 255, 0.22) 0%,
        rgba(120, 185, 235, 0.1) 40%,
        transparent 72%
      );
    mix-blend-mode: screen;
    transition: background 70ms linear;
    opacity: 1;
  }

  /* Vignette — pushed darker so the text card and any overlaid text always
     reads cleanly. Three layers: top fade, bottom fade, edge ellipse. */
  .hero__vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(180deg, rgba(6, 8, 15, 0.55) 0%, transparent 22%, transparent 60%, rgba(6, 8, 15, 0.65) 100%),
      radial-gradient(ellipse 110% 95% at 50% 45%, rgba(6, 8, 15, 0.25) 0%, rgba(6, 8, 15, 0.75) 72%, rgba(6, 8, 15, 0.98) 100%),
      radial-gradient(circle at 90% 90%, rgba(6, 8, 15, 0.78) 0%, transparent 55%);
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

  /* ── Top-right commits badge ── */
  .hero__commitsBadge {
    position: absolute;
    top: 6.5rem;
    right: clamp(1rem, 3vw, 2rem);
    z-index: 3;
    display: inline-flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
    padding: 0.85rem 1.1rem;
    border-radius: 14px;
    background: rgba(6, 8, 15, 0.78);
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
    color: var(--text);
    text-align: right;
    max-width: 320px;
    transition: background-color var(--duration-hover) var(--ease-default), transform var(--duration-hover) var(--ease-default);
  }
  .hero__commitsBadge:hover {
    background: rgba(6, 8, 15, 0.88);
    transform: translateY(-1px);
  }

  .hero__dot {
    position: absolute;
    top: 1.05rem;
    left: 0.95rem;
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: #5ee2a8;
    box-shadow: 0 0 0 5px rgba(94, 226, 168, 0.2);
    animation: pulse 2s infinite var(--ease-default);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.9); }
  }

  .hero__commitsBig {
    font-family: var(--font-display);
    font-size: clamp(1rem, 1.4vw, 1.25rem);
    font-weight: 500;
    line-height: 1;
    color: var(--text);
    padding-left: 1.1rem;
  }

  .hero__commitsSub {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--muted);
    letter-spacing: 0.02em;
  }

  .hero__commitsLast {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    color: var(--muted-soft);
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hero__commitsLast em {
    color: var(--accent-soft);
    font-style: normal;
  }
  .hero__commitsRepo { color: var(--muted-soft); }

  /* ── Bottom-right text card (Defined VC inspired) ──
     Sits OUT of the content container — pinned to the right viewport edge with
     a small gap, so it extends visually further right than the page grid. */
  .hero__cardWrap {
    position: absolute;
    right: clamp(0.75rem, 2vw, 1.5rem);
    left: 1rem;
    bottom: 2.25rem;
    z-index: 3;
    display: flex;
    justify-content: flex-end;
  }

  .hero__card {
    width: 100%;
    max-width: 680px;
    padding: 2rem 2rem 1.75rem;
    border: none;
    border-radius: 20px;
    background: rgba(6, 8, 15, 0.94);
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
    box-shadow:
      0 32px 72px rgba(0, 0, 0, 0.65),
      0 12px 32px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }

  @media (min-width: 720px) {
    .hero__card { padding: 2.4rem 2.4rem 2.1rem; }
  }
  @media (min-width: 1100px) {
    .hero__card { max-width: 720px; }
  }

  .hero__cardHead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
  }

  .hero__indexLabel {
    font-family: var(--font-mono);
    font-size: 0.74rem;
    color: var(--muted-soft);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .hero__cardName {
    font-family: var(--font-mono);
    font-size: 0.74rem;
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

  /* Stack row with inline tech icons */
  .hero__stack {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
    margin-top: 0.55rem;
    padding-top: 1.05rem;
    border-top: 1px solid rgba(245, 241, 234, 0.07);
  }

  .hero__stackLabel {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--muted-soft);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-right: 0.35rem;
  }

  .hero__stackItem {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.7rem;
    border-radius: var(--radius-pill);
    border: 1px solid rgba(245, 241, 234, 0.08);
    background: rgba(160, 195, 255, 0.05);
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.01em;
    transition:
      color var(--duration-hover) var(--ease-default),
      border-color var(--duration-hover) var(--ease-default),
      background-color var(--duration-hover) var(--ease-default);
  }
  .hero__stackItem:hover {
    color: var(--accent-soft);
    border-color: rgba(58, 109, 255, 0.4);
    background: rgba(58, 109, 255, 0.08);
  }
  .hero__stackItem svg {
    flex-shrink: 0;
    color: var(--accent-soft);
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
