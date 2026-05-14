<script lang="ts">
  import { onMount } from "svelte";
  import { navItems } from "../lib/navigation";

  interface Props {
    currentPath?: string;
  }

  let { currentPath = "/" }: Props = $props();

  let menuOpen = $state(false);
  let scrolled = $state(false);

  // Use a vanilla scroll listener with a generous threshold + hysteresis so
  // tiny scroll deltas around the boundary don't toggle the state.
  onMount(() => {
    const ENTER = 60;
    const EXIT = 20;
    const onScroll = () => {
      const y = window.scrollY;
      if (!scrolled && y > ENTER) scrolled = true;
      else if (scrolled && y < EXIT) scrolled = false;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  });

  // Lock body scroll while mobile menu is open
  $effect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  });

  function isCurrent(href: string): boolean {
    if (href === "/") return currentPath === "/";
    return currentPath.startsWith(href);
  }
</script>

<header class="header" class:header--scrolled={scrolled}>
  <div class="header__inner">
    <a href="/" class="header__brand" aria-label="rubenmarcus.dev — home">
      <span class="header__name">rubenmarcus.dev</span>
    </a>

    <nav class="header__nav" aria-label="Primary">
      {#each navItems as item}
        <a
          href={item.href}
          class="nav-link header__link"
          aria-current={isCurrent(item.href) ? "page" : undefined}
        >
          {item.label}
        </a>
      {/each}
    </nav>

    <div class="header__right">
      <div class="header__socials" aria-label="Social links">
        <a href="https://github.com/rubenmarcus" target="_blank" rel="noopener" aria-label="GitHub" class="header__socialIcon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2A10 10 0 0 0 8.84 21.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.69.92.69 1.85V21c0 .27.16.59.67.5A10 10 0 0 0 12 2z"/>
          </svg>
        </a>
        <a href="https://x.com/rubenmarcus_dev" target="_blank" rel="noopener" aria-label="X / Twitter" class="header__socialIcon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2H21.5l-7.5 8.572L23 22h-6.91l-4.81-6.288L5.7 22H2.44l8.02-9.166L1.5 2h7.05l4.34 5.745L18.244 2zm-1.21 18h1.91L7.06 4H5.05l11.985 16z"/>
          </svg>
        </a>
        <a href="https://linkedin.com/in/rubenmarcus" target="_blank" rel="noopener" aria-label="LinkedIn" class="header__socialIcon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M4 4h4v16H4zM6 2.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM10 8h3.8v2.2h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V20h-4v-5.7c0-1.36-.03-3.1-1.9-3.1-1.9 0-2.2 1.48-2.2 3v5.8h-4V8z"/>
          </svg>
        </a>
        <a href="mailto:rubenmarcus.dev@gmail.com" aria-label="Email" class="header__socialIcon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2"/>
            <path d="M3 7l9 6 9-6"/>
          </svg>
        </a>
        <a href="https://dev.to/rubenmarcus" target="_blank" rel="noopener" aria-label="dev.to" class="header__socialIcon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="2.5" y="4.5" width="19" height="15" rx="2"/>
            <path d="M7 9v6M5.5 9h3M5.5 12h2.5M5.5 15h3"/>
            <path d="M11 9l1.7 6L14.4 9"/>
            <path d="M17 9v6h2.5M17 12h1.8"/>
          </svg>
        </a>
      </div>

      <button
        class="header__burger"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onclick={() => (menuOpen = !menuOpen)}
      >
        <span class:open={menuOpen}></span>
        <span class:open={menuOpen}></span>
      </button>
    </div>
  </div>

  {#if menuOpen}
    <div class="header__overlay" role="dialog" aria-modal="true" aria-label="Site navigation">
      <nav class="header__overlay-nav">
        {#each navItems as item, i}
          <a
            href={item.href}
            class="header__overlay-link"
            style="--delay: {i * 40}ms"
            aria-current={isCurrent(item.href) ? "page" : undefined}
            onclick={() => (menuOpen = false)}
          >
            <span class="header__overlay-label">{item.label}</span>
          </a>
        {/each}
      </nav>
    </div>
  {/if}
</header>

<style>
  .header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: var(--z-nav);
    padding-block: 1rem;
    background: transparent;
    border-bottom: 1px solid transparent;
    transition:
      background-color 220ms var(--ease-default),
      border-color 220ms var(--ease-default),
      backdrop-filter 220ms var(--ease-default);
  }

  .header--scrolled {
    background: rgba(6, 8, 15, 0.72);
    border-bottom-color: var(--line);
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
  }

  .header__inner {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 2rem;
    width: 100%;
    /* Full-width — no container, small edge padding only */
    padding-inline: clamp(1rem, 2.5vw, 2rem);
  }

  .header__brand {
    display: inline-flex;
    align-items: center;
    color: var(--text);
    font-family: var(--font-mono);
    letter-spacing: 0.02em;
  }

  .header__name {
    font-size: 1.65rem;
    font-weight: 500;
    letter-spacing: 0.01em;
  }

  .header__nav {
    display: none;
    gap: 2.4rem;
    justify-content: center;
  }

  @media (min-width: 880px) {
    .header__nav {
      display: inline-flex;
      align-items: center;
    }
  }

  .header__link {
    display: inline-flex;
    align-items: baseline;
    font-family: var(--font-sans);
    font-size: 1.45rem;
    font-weight: 500;
  }

  /* Right cluster: socials + burger */
  .header__right {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    justify-self: end;
  }

  .header__socials {
    display: none;
    align-items: center;
    gap: 0.4rem;
  }
  @media (min-width: 880px) {
    .header__socials {
      display: inline-flex;
    }
  }

  .header__socialIcon {
    display: inline-grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 999px;
    color: var(--muted);
  }
  .header__socialIcon:hover {
    color: var(--text);
  }

  .header__burger {
    appearance: none;
    background: transparent;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-pill);
    width: 44px;
    height: 36px;
    display: inline-flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    transition: border-color var(--duration-hover) var(--ease-default);
  }

  .header__burger:hover {
    border-color: var(--line-bright);
  }

  .header__burger span {
    display: block;
    width: 16px;
    height: 1.5px;
    background: var(--text);
    transition: transform 240ms var(--ease-default), opacity 240ms var(--ease-default);
  }

  .header__burger span.open:first-child {
    transform: translateY(3.2px) rotate(45deg);
  }
  .header__burger span.open:last-child {
    transform: translateY(-3.2px) rotate(-45deg);
  }

  @media (min-width: 880px) {
    .header__burger { display: none; }
  }

  .header__overlay {
    position: fixed;
    inset: 0;
    background: rgba(12, 13, 16, 0.96);
    backdrop-filter: blur(var(--blur-lg));
    -webkit-backdrop-filter: blur(var(--blur-lg));
    display: grid;
    place-items: center;
    padding: 5rem 1.5rem 3rem;
    z-index: calc(var(--z-nav) - 1);
  }

  .header__overlay-nav {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 420px;
  }

  .header__overlay-link {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    padding-block: 0.6rem;
    border-bottom: 1px solid var(--line);
    color: var(--text);
    font-family: var(--font-display);
    font-size: 2rem;
    line-height: 1;
    opacity: 0;
    transform: translateY(8px);
    animation: overlay-in 500ms var(--ease-default) forwards;
    animation-delay: var(--delay, 0ms);
  }

  .header__overlay-link[aria-current="page"] {
    color: var(--accent-soft);
  }

  .header__overlay-label {
    line-height: 1;
  }

  @keyframes overlay-in {
    to { opacity: 1; transform: translateY(0); }
  }
</style>
