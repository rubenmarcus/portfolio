<script lang="ts">
  import { onMount } from "svelte";
  import { navItems, navLabelsPt } from "../lib/navigation";
  import SvgIcon from "../lib/assets/SvgIcon.svelte";

  interface Props {
    currentPath?: string;
    alternatePaths?: { en: string; pt: string };
  }

  let { currentPath = "/", alternatePaths }: Props = $props();

  let menuOpen = $state(false);
  let scrolled = $state(false);

  // Language routing — PT pages live under /pt. The Header derives everything
  // from currentPath so no extra prop is needed.
  const isPt = $derived(currentPath === "/pt" || currentPath.startsWith("/pt/"));
  const items = $derived(
    navItems.map((item) => ({
      ...item,
      href: isPt ? `/pt${item.href === "/" ? "" : item.href}` : item.href,
      label: isPt ? (navLabelsPt[item.href] ?? item.label) : item.label,
    })),
  );
  // Language toggle target — /x ↔ /pt/x. Blog posts mirror one-to-one, so
  // the toggle deep-links to the same post in the other language.
  const enPath = $derived(
    alternatePaths?.en ?? (isPt ? currentPath.replace(/^\/pt/, "") || "/" : currentPath),
  );
  const ptPath = $derived(
    alternatePaths?.pt ?? (isPt
      ? currentPath
      : `/pt${currentPath === "/" ? "" : currentPath}`),
  );
  const homeHref = $derived(isPt ? "/pt" : "/");

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
    // View transitions don't run onMount cleanups — unbind before the swap.
    const unbind = () => window.removeEventListener("scroll", onScroll);
    document.addEventListener("astro:before-swap", unbind, { once: true });
    return () => {
      unbind();
      document.removeEventListener("astro:before-swap", unbind);
    };
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
    if (href === "/" || href === "/pt") return currentPath === href;
    return currentPath.startsWith(href);
  }
</script>

<header class="header" class:header--scrolled={scrolled}>
  <div class="header__inner">
    <a href={homeHref} class="header__brand" aria-label="rubenmarcus.dev — home">
      <span class="header__name">rubenmarcus.dev</span>
    </a>

    <nav class="header__nav" aria-label="Primary">
      {#each items as item}
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
      <div class="header__lang" aria-label="Language / Idioma">
        <a
          href={enPath}
          class="header__langLink"
          aria-current={!isPt ? "true" : undefined}
          hreflang="en"
          lang="en"
        >EN</a>
        <span class="header__langSep" aria-hidden="true">/</span>
        <a
          href={ptPath}
          class="header__langLink"
          aria-current={isPt ? "true" : undefined}
          hreflang="pt-br"
          lang="pt-br"
        >PT</a>
      </div>

      <div class="header__socials" aria-label="Social links">
        <a href="https://github.com/rubenmarcus" target="_blank" rel="noopener" aria-label="GitHub" class="header__socialIcon">
          <SvgIcon name="github" size={18} />
        </a>
        <a href="https://x.com/rubenmarcus_dev" target="_blank" rel="noopener" aria-label="X / Twitter" class="header__socialIcon">
          <SvgIcon name="xTwitter" size={16} />
        </a>
        <a href="https://linkedin.com/in/rubenmarcus" target="_blank" rel="noopener" aria-label="LinkedIn" class="header__socialIcon">
          <SvgIcon name="linkedin" size={18} />
        </a>
        <a href="https://www.npmjs.com/~rmarcus" target="_blank" rel="noopener" aria-label="npm" class="header__socialIcon">
          <SvgIcon name="npm" size={18} stroke={1.7} />
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

</header>

<!-- Kept OUTSIDE <header>: the scrolled header's backdrop-filter creates a
     containing block for fixed descendants, which would trap this overlay
     inside the header's 70px box instead of the viewport. -->
{#if menuOpen}
  <div class="header__overlay" role="dialog" aria-modal="true" aria-label="Site navigation">
    <nav class="header__overlay-nav">
      {#each items as item, i}
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

<style>
  .header {
    position: fixed;
    top: 32px; /* clears the fixed availability marquee above */
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
    font-family: var(--font-rounded);
    letter-spacing: -0.01em;
  }

  .header__name {
    font-size: 1.65rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .header__nav {
    display: none;
    gap: 2.4rem;
    justify-content: center;
  }

  @media (min-width: 1220px) {
    .header__nav {
      display: inline-flex;
      align-items: center;
      gap: clamp(1rem, 1.55vw, 2rem);
    }
  }

  .header__link {
    position: relative;
    display: inline-flex;
    align-items: baseline;
    font-family: var(--font-rounded);
    font-size: 1rem;
    font-weight: 500;
    letter-spacing: -0.005em;
  }

  /* ASCII caret that types in on hover — ">_" prefixes the link label in
     stepped ch-width increments, like a terminal prompt appearing. */
  .header__link::before {
    content: ">_";
    display: inline-block;
    width: 0;
    margin-right: 0;
    overflow: hidden;
    white-space: pre;
    font-family: var(--font-mono);
    font-size: 0.72em;
    color: var(--accent-soft);
    opacity: 0;
    transition:
      width 260ms steps(2, end),
      margin-right 260ms steps(2, end),
      opacity 140ms var(--ease-default);
  }
  .header__link:hover::before {
    width: 1.7ch;
    margin-right: 0.45ch;
    opacity: 1;
  }

  /* Active-page indicator — a green underline that slides in; hover previews
     it at lower contrast for non-active links. */
  .header__link::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: -7px;
    height: 1.5px;
    background: var(--accent-soft);
    box-shadow: 0 0 8px rgba(0, 255, 65, 0.5);
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 320ms var(--ease-default), opacity 320ms var(--ease-default);
    opacity: 0.45;
  }
  .header__link:hover::after {
    transform: scaleX(1);
  }
  .header__link[aria-current="page"]::after {
    transform: scaleX(1);
    opacity: 1;
  }
  @media (prefers-reduced-motion: reduce) {
    .header__link::before,
    .header__link::after { transition: none; }
  }

  /* Right cluster: lang toggle + socials + burger */
  .header__right {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    justify-self: end;
  }

  /* Language toggle — mono, subtle; the active locale gets the accent. */
  .header__lang {
    display: inline-flex;
    align-items: baseline;
    gap: 0.3rem;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.1em;
  }

  .header__langLink {
    color: var(--muted-soft);
    transition: color var(--duration-hover) var(--ease-default);
  }
  .header__langLink:hover {
    color: var(--text);
  }
  .header__langLink[aria-current="true"] {
    color: var(--accent-soft);
  }

  .header__langSep {
    color: var(--muted-soft);
    opacity: 0.55;
  }

  .header__socials {
    display: none;
    align-items: center;
    gap: 0.4rem;
  }
  @media (min-width: 1220px) {
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

  @media (min-width: 1220px) {
    .header__burger { display: none; }
  }

  .header__overlay {
    position: fixed;
    inset: 0;
    /* Solid — this lives outside <header>, so there's no backdrop-filter
       chain anymore; full opacity guarantees readability over the shader. */
    background: #06080f;
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
