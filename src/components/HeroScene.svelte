<script lang="ts">
  import RotatingVerb from "./RotatingVerb.svelte";
  import CodeStream from "./CodeStream.svelte";
  import CloudField from "./CloudField.svelte";
  import AsciiField from "./AsciiField.svelte";
  import { scramble } from "../lib/motion/scramble";

  const verbs = [
    "autonomous agents",
    "post-quantum tools",
    "DeFi trading bots",
    "spec-driven loops",
    "AI search infra",
    "wallet UX",
  ];

  const GH_USER = "rubenmarcus";

  // Orgs to aggregate stars + repo counts from
  const GH_ORGS = ["multivmlabs", "BitteProtocol", "Mintbase"];

  // Platforms without a public follower API — counts the user keeps current
  // by hand. Live count from GitHub gets added on top of these.
  const ESTIMATED_FOLLOWERS = {
    linkedin: 33253,
    twitter: 480,
    devto: 45,
  };

  interface GitHubStats {
    today: number;
    month: number;
    year: number;
    total: number;
    lastCommit: { message: string; repo: string; url: string } | null;
  }

  let stats = $state<GitHubStats | null>(null);
  let stars = $state<number | null>(null);
  let followers = $state<number | null>(null);

  function formatCount(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k";
    return String(n);
  }
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

  // GitHub followers + total stars across user repos and key orgs
  $effect(() => {
    async function paginate(url: string): Promise<any[]> {
      const out: any[] = [];
      let page = 1;
      // GitHub API caps per_page at 100; 3 pages is plenty for our orgs
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

    (async () => {
      try {
        // 1) Followers
        const user = await fetch(`https://api.github.com/users/${GH_USER}`).then((r) => r.json());
        const ghFollowers = typeof user?.followers === "number" ? user.followers : 0;
        followers =
          ghFollowers +
          ESTIMATED_FOLLOWERS.twitter +
          ESTIMATED_FOLLOWERS.linkedin +
          ESTIMATED_FOLLOWERS.devto;

        // 2) Stars across rubenmarcus + key orgs
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
      } catch {
        // Soft fail — badges just hide
      }
    })();
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

  <!-- Top-right stat stack: commits / stars / followers -->
  <div class="hero__stats">
    {#if stats}
      <a
        class="hero__stat hero__stat--primary"
        href={stats.lastCommit?.url ?? `https://github.com/${GH_USER}`}
        target="_blank"
        rel="noopener"
      >
        <span class="hero__dot" aria-hidden="true"></span>
        <div class="hero__statBody">
          <span class="hero__statBig">{stats.today} commits today</span>
          <span class="hero__statSub">{stats.month} this month · {stats.year} this year</span>
          {#if stats.lastCommit}
            <span class="hero__statLast">
              last: <em>{stats.lastCommit.message}</em>
              <span class="hero__statRepo">({stats.lastCommit.repo})</span>
            </span>
          {/if}
        </div>
      </a>
    {/if}

    {#if stars !== null}
      <a class="hero__stat" href={`https://github.com/${GH_USER}?tab=repositories`} target="_blank" rel="noopener">
        <svg class="hero__statIcon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <div class="hero__statBody">
          <span class="hero__statBig">{formatCount(stars)} stars</span>
          <span class="hero__statSub">across all my projects</span>
        </div>
      </a>
    {/if}

    {#if followers !== null}
      <a class="hero__stat" href="https://linkedin.com/in/rubenmarcus" target="_blank" rel="noopener">
        <svg class="hero__statIcon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <div class="hero__statBody">
          <span class="hero__statBig">{formatCount(followers)} followers</span>
          <span class="hero__statSub">on all my socials</span>
        </div>
      </a>
    {/if}
  </div>

  <!-- Center-left lede: intro line + Build title + CTAs. No backdrop card —
       relies on the vignette + text-shadow for separation. -->
  <div class="hero__lede container-x">
    <p class="hero__intro">
      Hello, I'm <span class="hero__introName" use:scramble>Ruben Marcus</span> and I
    </p>

    <h1 class="hero__title">
      <span class="hero__titleWord" use:scramble>Build</span>
      <RotatingVerb words={verbs} interval={2800} fadeMs={340} italic={false} class="hero__verb" />
    </h1>

    <div class="hero__ctas">
      <a href="/portfolio" class="btn btn-primary">See the work</a>
      <a href="/ai" class="btn btn-secondary">AI tools I ship</a>
    </div>
  </div>

  <!-- Bottom band: stack pills row spanning the hero footer -->
  <div class="hero__stackBar container-x">
    <div class="hero__stack">
      <span class="hero__stackLabel">Stack</span>

        <span class="hero__stackItem" title="TypeScript">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.1 5.1 0 0 0-.717-.26 5.5 5.5 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.87.87 0 0 0-.14.484c0 .197.05.375.151.532.1.158.244.31.43.453s.41.286.673.427c.263.14.56.286.892.437.46.221.879.482 1.255.785s.71.673.978 1.058c.27.385.483.84.643 1.358.16.518.241 1.135.241 1.847 0 .814-.158 1.51-.473 2.087a4 4 0 0 1-1.302 1.432 5.7 5.7 0 0 1-1.953.823 12 12 0 0 1-2.382.243c-.781 0-1.5-.057-2.184-.173-.685-.117-1.276-.291-1.775-.524v-2.621a5 5 0 0 0 1.083.621 7 7 0 0 0 1.226.36 6.4 6.4 0 0 0 1.255.13c.471 0 .863-.038 1.184-.124.32-.085.57-.213.755-.385.184-.171.31-.376.385-.617a2 2 0 0 0 .102-.624 1.4 1.4 0 0 0-.198-.741 2.2 2.2 0 0 0-.51-.617 5.5 5.5 0 0 0-.793-.51c-.305-.16-.682-.327-1.083-.494a8.9 8.9 0 0 1-1.165-.585 4.6 4.6 0 0 1-.94-.726c-.27-.27-.482-.575-.642-.927a2.95 2.95 0 0 1-.234-1.222c0-.69.155-1.275.466-1.755.31-.48.72-.886 1.226-1.222.51-.336 1.083-.575 1.74-.726a8.4 8.4 0 0 1 1.997-.226zM3.31 9.945h11.13v2.082h-4.244v12.001H7.625V12.027H3.31z"/>
          </svg>
          TypeScript
        </span>

        <span class="hero__stackItem" title="Node.js">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M11.998 24c-.321 0-.641-.084-.922-.247l-2.936-1.737c-.438-.245-.224-.332-.08-.383.585-.203.703-.25 1.328-.604.065-.037.151-.023.218.017l2.256 1.339a.29.29 0 0 0 .272 0l8.795-5.076a.276.276 0 0 0 .134-.238V6.921a.283.283 0 0 0-.137-.242l-8.791-5.072a.278.278 0 0 0-.271 0L3.075 6.68a.284.284 0 0 0-.139.241v10.15c0 .093.054.183.137.229l2.409 1.392c1.307.654 2.108-.117 2.108-.89V7.787c0-.142.114-.253.256-.253h1.115c.139 0 .255.112.255.253v10.021c0 1.745-.95 2.745-2.604 2.745-.508 0-.909 0-2.026-.551L2.28 18.675a1.856 1.856 0 0 1-.922-1.604V6.921a1.85 1.85 0 0 1 .922-1.603L11.075.236a1.92 1.92 0 0 1 1.85 0l8.794 5.082a1.86 1.86 0 0 1 .923 1.603v10.15a1.86 1.86 0 0 1-.923 1.604l-8.794 5.078A1.93 1.93 0 0 1 11.998 24zm2.715-6.99c-3.844 0-4.65-1.766-4.65-3.244 0-.14.114-.253.255-.253h1.137c.127 0 .234.092.254.218.171 1.16.683 1.747 3.004 1.747 1.844 0 2.633-.418 2.633-1.398 0-.563-.224-.984-3.094-1.265-2.398-.237-3.881-.764-3.881-2.682 0-1.766 1.49-2.82 3.987-2.82 2.804 0 4.192.972 4.367 3.06a.255.255 0 0 1-.254.278h-1.141a.254.254 0 0 1-.247-.198c-.273-1.221-.94-1.611-2.726-1.611-2.001 0-2.235.696-2.235 1.219 0 .631.276.815 2.998 1.176 2.694.359 3.974.866 3.974 2.755 0 1.906-1.587 2.998-4.357 2.998z"/>
          </svg>
          Node.js
        </span>

        <span class="hero__stackItem" title="Python">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/>
          </svg>
          Python
        </span>

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
    padding-bottom: 2rem;
    display: flex;
    flex-direction: column;
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

  /* Vignette — sides nearly black, soft center clean, plus a gentle darken
     behind the lede zone so the H1 reads against any background motion. */
  .hero__vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      /* Soft darken behind the lede zone (center-left) — purely additive,
         shouldn't blot out the rotating ASCII head */
      radial-gradient(ellipse 42% 55% at 22% 52%, rgba(6, 8, 15, 0.5) 0%, rgba(6, 8, 15, 0.18) 55%, transparent 80%),
      /* Side bars — pure black columns fading inward */
      linear-gradient(90deg, rgba(6, 8, 15, 0.95) 0%, rgba(6, 8, 15, 0.7) 6%, transparent 22%, transparent 82%, rgba(6, 8, 15, 0.7) 94%, rgba(6, 8, 15, 0.95) 100%),
      /* Top and bottom darkening */
      linear-gradient(180deg, rgba(6, 8, 15, 0.78) 0%, transparent 18%, transparent 62%, rgba(6, 8, 15, 0.82) 100%);
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

  /* ── Top-right stat stack: commits / stars / followers ── */
  .hero__stats {
    position: absolute;
    top: 6.5rem;
    right: clamp(1rem, 3vw, 2rem);
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    max-width: 340px;
  }

  .hero__stat {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 0.65rem;
    padding: 0.7rem 0.95rem;
    border-radius: 12px;
    background: rgba(6, 8, 15, 0.78);
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
    color: var(--text);
    text-align: left;
    transition:
      background-color var(--duration-hover) var(--ease-default),
      transform var(--duration-hover) var(--ease-default);
  }
  .hero__stat:hover {
    background: rgba(6, 8, 15, 0.9);
    transform: translateX(-2px);
  }

  .hero__statIcon {
    color: var(--accent-soft);
    flex-shrink: 0;
  }

  .hero__statBody {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }

  .hero__statBig {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.15;
    color: var(--text);
  }
  .hero__statSub {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--muted);
    letter-spacing: 0.01em;
  }
  .hero__statLast {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--muted-soft);
    margin-top: 0.2rem;
    max-width: 260px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hero__statLast em { color: var(--accent-soft); font-style: normal; }
  .hero__statRepo { color: var(--muted-soft); }

  /* Primary (commits) stat — green pulsing dot replaces the icon */
  .hero__stat--primary .hero__dot {
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

  /* ── Center-left lede ──
     No backdrop card — text floats over the bg, relies on vignette + text-shadow. */
  .hero__lede {
    position: relative;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.4rem;
    max-width: 820px;
    margin-block: auto;
    /* Subtle drop-shadow for separation against the bg */
    filter: drop-shadow(0 4px 24px rgba(0, 0, 0, 0.55));
  }

  .hero__intro {
    margin: 0;
    font-family: var(--font-sans);
    font-size: clamp(1.05rem, 1.4vw, 1.35rem);
    color: var(--muted);
    line-height: 1.4;
    text-shadow: 0 2px 18px rgba(0, 0, 0, 0.6);
  }
  .hero__introName {
    color: var(--accent-soft);
    font-weight: 500;
    cursor: default;
    transition: color var(--duration-hover) var(--ease-default);
  }
  .hero__introName:hover { color: #c8def0; }

  .hero__title {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(2.8rem, 7vw, 5.6rem);
    line-height: 0.98;
    letter-spacing: -0.025em;
    font-weight: 500;
    color: var(--text);
    display: inline-flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.4rem 0.7rem;
    text-wrap: balance;
    text-shadow: 0 2px 28px rgba(0, 0, 0, 0.6);
  }

  .hero__titleWord {
    color: var(--text);
    cursor: default;
  }

  :global(.hero__verb) {
    color: var(--accent-soft);
  }

  .hero__ctas {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 0.4rem;
  }

  /* Bottom band hosting the stack pills */
  .hero__stackBar {
    position: relative;
    z-index: 3;
    margin-top: auto;
  }

  /* Stack row with inline tech icons */
  .hero__stack {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(245, 241, 234, 0.08);
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
