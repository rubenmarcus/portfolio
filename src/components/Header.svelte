<script lang="ts">
  import { navItems } from "../lib/navigation";

  interface Props {
    currentPath?: string;
  }

  let { currentPath = "/" }: Props = $props();

  let scrolled = $state(false);
  let menuOpen = $state(false);

  // Track scroll for navbar shrink
  $effect(() => {
    const onScroll = () => {
      scrolled = window.scrollY > 24;
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

<header
  class="header"
  class:header--scrolled={scrolled}
>
  <div class="container-x header__inner">
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
          <span class="header__index">{item.index}</span>
          <span>{item.label}</span>
        </a>
      {/each}
    </nav>

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
            <span class="header__index">{item.index}</span>
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
    padding-block: 1.1rem;
    background: transparent;
    border-bottom: 1px solid transparent;
    transition:
      padding-block 280ms var(--ease-default),
      background-color var(--duration-hover) var(--ease-default),
      border-color var(--duration-hover) var(--ease-default),
      backdrop-filter var(--duration-hover) var(--ease-default);
  }

  .header--scrolled {
    padding-block: 0.7rem;
    background: rgba(12, 13, 16, 0.72);
    border-bottom-color: var(--line);
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
  }

  .header__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
  }

  .header__brand {
    display: inline-flex;
    align-items: center;
    color: var(--text);
    font-family: var(--font-mono);
    letter-spacing: 0.02em;
    transition: color var(--duration-hover) var(--ease-default);
  }
  .header__brand:hover {
    color: var(--accent-soft);
  }

  .header__name {
    font-size: 1.1rem;
    font-weight: 500;
    letter-spacing: 0.01em;
  }

  .header__nav {
    display: none;
    gap: 2rem;
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
    gap: 0.5rem;
    font-family: var(--font-sans);
    font-size: 1.02rem;
  }

  .header__index {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    letter-spacing: 0.06em;
    color: var(--muted-soft);
    transition: color var(--duration-hover) var(--ease-default);
  }

  .header__link:hover .header__index,
  .header__link[aria-current="page"] .header__index {
    color: var(--accent-soft);
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
