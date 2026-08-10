<script lang="ts">
  /**
   * Bottom-left audio deck — YouTube IFrame API playing a fixed playlist,
   * terminal-styled to match the site. Persisted across view transitions.
   *
   * Persist caveat: Astro moves persisted elements into the new document,
   * and moving an <iframe> reloads it (the YT player dies silently). So on
   * every astro:page-load after the first we rebuild the player and restore
   * track + position + playing state.
   */
  import { onMount } from "svelte";

  interface Track {
    id: string;
    artist: string;
    title: string;
  }

  const TRACKS: Track[] = [
    { id: "5ldRQ3nbFTU", artist: "Autechre", title: "latentcall" },
    { id: "7KN_lc-rJIo", artist: "Autechre", title: "slip" },
    { id: "jCMi9_6vnxk", artist: "Oneohtrix Point Never", title: "Ships Without Meaning" },
    { id: "DvQj8dT0Ctg", artist: "Oneohtrix Point Never", title: "Stress Waves" },
    { id: "DrmpZtxr0kY", artist: "Nostalgic Soundscapes", title: "S01E02 Forgotten (Win95 Ambient)" },
    { id: "QShW2JV2ne8", artist: "Aphex Twin", title: "T08 dx1+5 (London 03.06.17)" },
    { id: "PLarr8-o0RI", artist: "London Elektricity", title: "Just One Second" },
    { id: "d_31KWy7WPE", artist: "Underworld", title: "Second Hand Man" },
    { id: "vZexE7wAvBE", artist: "Kosheen", title: "Hide U" },
    { id: "xyBi-omSdGY", artist: "Sasha", title: "Xpander" },
    { id: "yH274q_7H9U", artist: "London Elektricity", title: "Bare Religion" },
    { id: "z4LJ8OuGjSY", artist: "VHS LOGOS", title: "FREQ" },
    { id: "0wU53rnCWlI", artist: "Infinite Frequencies", title: "Implanted Memories" },
  ];

  let player: any = null;
  let ready = $state(false);
  let playing = $state(false);
  let current = $state(0);
  let time = $state(0);
  let duration = $state(0);
  let minimized = $state(true);
  let pendingPlay = false;
  let tick: ReturnType<typeof setInterval> | undefined;
  let booted = false;

  const track = $derived(TRACKS[current]);
  const progress = $derived(duration > 0 ? time / duration : 0);

  function fmt(s: number) {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  function load(i: number, autoplay: boolean) {
    current = i;
    time = 0;
    duration = 0;
    if (!player) return;
    if (autoplay) player.loadVideoById(TRACKS[i].id);
    else player.cueVideoById(TRACKS[i].id);
  }

  function toggle() {
    if (!ready || !player) return;
    if (playing) player.pauseVideo();
    else if (player.getPlayerState?.() === 5 || duration === 0) {
      // cued or never started: begin the current track
      load(current, true);
    } else player.playVideo();
  }

  function step(dir: 1 | -1) {
    load((current + dir + TRACKS.length) % TRACKS.length, playing);
  }

  /** Random track ≠ current — the deck's default order is shuffle. */
  function randIndex() {
    if (TRACKS.length < 2) return 0;
    let i = current;
    while (i === current) i = Math.floor(Math.random() * TRACKS.length);
    return i;
  }

  function random() {
    load(randIndex(), true);
  }

  function open() {
    minimized = false;
    // Opening the deck is the play gesture — and it always starts on a
    // random track, never the top of the list.
    if (!playing) {
      current = randIndex();
      if (ready && player) load(current, true);
      else pendingPlay = true;
    }
  }

  function seek(e: MouseEvent) {
    if (!ready || !player || duration === 0) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    player.seekTo(ratio * duration, true);
    time = ratio * duration;
  }

  function buildPlayer(restore: boolean) {
    const host = document.getElementById("yt-deck");
    if (!host || !(window as any).YT?.Player) return;
    host.innerHTML = '<div id="yt-deck-frame"></div>';
    const startAt = Math.floor(time);
    player = new (window as any).YT.Player("yt-deck-frame", {
      videoId: TRACKS[current].id,
      playerVars: {
        autoplay: restore && playing ? 1 : 0,
        start: restore ? startAt : 0,
        controls: 0,
        disablekb: 1,
        playsinline: 1,
        rel: 0,
      },
      events: {
        onReady: (e: any) => {
          ready = true;
          duration = e.target.getDuration() ?? 0;
          if (restore && playing) e.target.playVideo();
          if (pendingPlay) {
            pendingPlay = false;
            load(current, true);
          }
        },
        onStateChange: (e: any) => {
          const YT = (window as any).YT;
          if (e.data === YT.PlayerState.PLAYING) {
            playing = true;
            duration = player.getDuration() ?? duration;
          } else if (e.data === YT.PlayerState.PAUSED) {
            playing = false;
          } else if (e.data === YT.PlayerState.ENDED) {
            load(randIndex(), true); // shuffle auto-advance
          } else if (e.data === YT.PlayerState.CUED) {
            duration = player.getDuration() ?? duration;
          }
        },
        onError: () => step(1), // embedding-disabled or removed video: skip
      },
    });
  }

  onMount(() => {
    const ensureApi = (cb: () => void) => {
      if ((window as any).YT?.Player) return cb();
      const prev = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        prev?.();
        cb();
      };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement("script");
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
    };

    // Boot once on mount; on every ClientRouter swap the persisted iframe
    // has been reloaded by the DOM move, so rebuild and resume.
    ensureApi(() => buildPlayer(false));
    booted = true;
    const onSwap = () => {
      if (booted) ensureApi(() => buildPlayer(true));
    };
    document.addEventListener("astro:after-swap", onSwap);

    tick = setInterval(() => {
      if (player && playing) {
        time = player.getCurrentTime?.() ?? time;
        duration = player.getDuration?.() ?? duration;
      }
    }, 500);

    return () => {
      clearInterval(tick);
      document.removeEventListener("astro:after-swap", onSwap);
    };
  });

  // Keep the footer clear of the expanded floating deck.
  $effect(() => {
    document.body.style.paddingBottom = minimized ? "0" : "150px";
    return () => {
      document.body.style.paddingBottom = "0";
    };
  });
</script>

<!-- Hidden YT host — audio only, the deck below is the real UI. -->
<div class="yt-hidden" aria-hidden="true"><div id="yt-deck"></div></div>

{#if minimized}
  <button class="deck-fab" onclick={open} aria-label="Abrir player e tocar">
    <span class="deck-fab__glyph" class:pulse={playing}>♪</span>
  </button>
{:else}
  <div class="deck" role="region" aria-label="Audio player">
    <div class="deck__top">
      <span class="deck__tag">&gt;_ radio</span>
      <span class="deck__eq" class:on={playing} aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <button class="deck__btn deck__btn--min" onclick={() => (minimized = true)} aria-label="Minimizar player">_</button>
    </div>

    <span class="deck__title" title={`${track.artist} — ${track.title}`}>{track.artist} — {track.title}</span>

    <div
      class="deck__bar"
      role="slider"
      tabindex="0"
      aria-label="Progresso"
      aria-valuemin={0}
      aria-valuemax={Math.floor(duration)}
      aria-valuenow={Math.floor(time)}
      onclick={seek}
      onkeydown={(e) => {
        if (!player || duration === 0) return;
        if (e.key === "ArrowRight") player.seekTo(Math.min(duration, time + 10), true);
        if (e.key === "ArrowLeft") player.seekTo(Math.max(0, time - 10), true);
      }}
    >
      <div class="deck__fill" style:width={`${progress * 100}%`}></div>
    </div>

    <div class="deck__bottom">
      <div class="deck__controls">
        <button class="deck__btn" onclick={() => step(-1)} aria-label="Faixa anterior">‹</button>
        <button class="deck__btn deck__btn--play" onclick={toggle} aria-label={playing ? "Pausar" : "Tocar"}>
          {playing ? "❚❚" : "▶"}
        </button>
        <button class="deck__btn" onclick={() => step(1)} aria-label="Próxima faixa">›</button>
        <button class="deck__btn deck__btn--rand" onclick={random} aria-label="Faixa aleatória">rand</button>
      </div>
      <span class="deck__index">[{String(current + 1).padStart(2, "0")}/{String(TRACKS.length).padStart(2, "0")}]</span>
      <span class="deck__time">{fmt(time)}/{fmt(duration)}</span>
    </div>
  </div>
{/if}

<style>
  .yt-hidden {
    position: fixed;
    bottom: 0;
    right: 0;
    width: 1px;
    height: 1px;
    overflow: hidden;
    opacity: 0.01;
    pointer-events: none;
    z-index: -1;
  }

  .deck {
    position: fixed;
    right: auto;
    bottom: max(1rem, env(safe-area-inset-bottom));
    left: max(1rem, env(safe-area-inset-left));
    z-index: 999;
    width: min(340px, calc(100vw - 2rem));
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    padding: 0.7rem 0.85rem 0.75rem;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: rgba(0, 0, 0, 0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    font-family: var(--font-mono);
    color: var(--muted);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.55);
  }

  .deck__top {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .deck__tag {
    color: var(--accent);
    font-size: 0.7rem;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .deck__eq {
    display: inline-flex;
    align-items: flex-end;
    gap: 2px;
    height: 12px;
    margin-left: auto;
  }
  .deck__eq i {
    width: 3px;
    height: 3px;
    background: var(--accent-deep);
  }
  .deck__eq.on i {
    background: var(--accent);
    animation: eq 0.9s ease-in-out infinite;
  }
  .deck__eq.on i:nth-child(2) { animation-delay: 0.22s; }
  .deck__eq.on i:nth-child(3) { animation-delay: 0.44s; }
  .deck__eq.on i:nth-child(4) { animation-delay: 0.11s; }
  @keyframes eq {
    0%, 100% { height: 3px; }
    50% { height: 12px; }
  }

  .deck__title {
    font-size: 0.76rem;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .deck__bar {
    height: 7px;
    border: 1px solid var(--line);
    border-radius: 999px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    background: rgba(134, 239, 172, 0.04);
  }
  .deck__fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: linear-gradient(90deg, var(--accent-deep), var(--accent));
    opacity: 0.85;
    transition: width 0.4s linear;
  }

  .deck__bottom {
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }

  .deck__controls {
    display: flex;
    align-items: center;
    gap: 0.1rem;
  }

  .deck__btn {
    appearance: none;
    background: none;
    border: 1px solid transparent;
    border-radius: 6px;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 1rem;
    line-height: 1;
    padding: 0.3rem 0.45rem;
    cursor: pointer;
    transition:
      color var(--duration-hover) var(--ease-default),
      border-color var(--duration-hover) var(--ease-default),
      background-color var(--duration-hover) var(--ease-default);
  }
  .deck__btn:hover {
    color: var(--accent-soft);
    border-color: rgba(0, 255, 65, 0.32);
    background: rgba(0, 255, 65, 0.06);
  }
  .deck__btn--play {
    color: var(--accent);
    font-size: 0.8rem;
    min-width: 2rem;
  }
  .deck__btn--min {
    font-size: 0.8rem;
    padding: 0.2rem 0.4rem;
  }
  .deck__btn--rand {
    font-size: 0.62rem;
    letter-spacing: 0.06em;
    color: var(--muted-soft);
  }

  .deck__index {
    font-size: 0.68rem;
    color: var(--muted-soft);
    white-space: nowrap;
  }

  .deck__time {
    margin-left: auto;
    font-size: 0.68rem;
    color: var(--muted-soft);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .deck-fab {
    position: fixed;
    right: auto;
    bottom: max(1rem, env(safe-area-inset-bottom));
    left: max(1rem, env(safe-area-inset-left));
    z-index: 999;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid rgba(0, 255, 65, 0.32);
    background: rgba(0, 0, 0, 0.88);
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: 1.1rem;
    cursor: pointer;
    transition:
      border-color var(--duration-hover) var(--ease-default),
      background-color var(--duration-hover) var(--ease-default);
  }
  .deck-fab:hover {
    border-color: var(--accent);
    background: rgba(0, 255, 65, 0.08);
  }
  .deck-fab__glyph.pulse {
    display: inline-block;
    animation: pulse-note 1.2s ease-in-out infinite;
  }
  @keyframes pulse-note {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }
</style>
