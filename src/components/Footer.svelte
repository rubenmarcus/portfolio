<script lang="ts">
  import { navItems, navLabelsPt, siteMeta } from "../lib/navigation";
  import HeroLiveStats from "./HeroLiveStats.svelte";
  import SvgIcon from "../lib/assets/SvgIcon.svelte";
  import AsciiIcon from "../lib/assets/AsciiIcon.svelte";
  import type { SvgIconName } from "../lib/assets/registry";
  const year = new Date().getFullYear();

  interface Props {
    lang?: string;
  }
  let { lang = "en" }: Props = $props();
  const pt = lang.startsWith("pt");

  // pt-BR inline strings — EN default stays on siteMeta.
  const role = pt ? "Engenheiro AI Fullstack Sênior" : siteMeta.role;
  const base = pt ? "Lisboa · Mundial" : siteMeta.base;
  const pagesLabel = pt ? "Páginas" : "Pages";
  const reach = pt ? "Contato" : "Reach";

  const pages = navItems.map((item) => ({
    label: pt ? (navLabelsPt[item.href] ?? item.label) : item.label,
    href: (pt ? "/pt" : "") + (item.href === "/" ? "" : item.href) || "/",
  }));

  const socials: { label: string; href: string; icon: SvgIconName }[] = [
    { label: "GitHub",   href: "https://github.com/rubenmarcus",       icon: "github" },
    { label: "X",        href: "https://x.com/rubenmarcus_dev",        icon: "xTwitter" },
    { label: "LinkedIn", href: "https://linkedin.com/in/rubenmarcus",  icon: "linkedin" },
    { label: "npm",      href: "https://www.npmjs.com/~rmarcus",       icon: "npm" },
    { label: "Email",    href: "mailto:ruben@rubenmarcus.dev",     icon: "mail" },
    { label: "Telegram", href: "https://t.me/rubenmarcus",             icon: "telegram" },
  ];
</script>

<footer class="footer">
  <div class="container-x footer__inner">
    <div class="footer__col">
      <div class="footer__brand">
        <AsciiIcon name="terminal" fontSize="0.5rem" animate />
        <p class="footer__line">
          <span class="footer__name">{siteMeta.name}</span>
          <span class="footer__role">{role}</span>
        </p>
        <p class="footer__loc">{base}</p>
      </div>
      <div class="footer__telemetry">
        <HeroLiveStats />
      </div>
    </div>

    <nav class="footer__col" aria-label={pagesLabel}>
      <div class="bracket">{pagesLabel}</div>
      <ul class="footer__pages">
        {#each pages as p}
          <li><a href={p.href} class="footer__page">{p.label}</a></li>
        {/each}
      </ul>
    </nav>

    <div class="footer__col footer__col--right">
      <div class="bracket">{reach}</div>
      <ul class="footer__socials">
        {#each socials as s}
          <li>
            <a href={s.href} class="footer__social" target="_blank" rel="noopener" aria-label={s.label}>
              <SvgIcon name={s.icon} size={15} />
              <span>{s.label}</span>
            </a>
          </li>
        {/each}
      </ul>
    </div>
  </div>

  <div class="container-x footer__bottom">
    <span class="overline">© {year} Ruben Marcus</span>
    <span class="overline">
      Built with Astro · Svelte · Three.js · GSAP ·
      <a class="footer__aeo" href="https://aeojs.org" target="_blank" rel="noopener">AEO by aeo.js ↗</a>
    </span>
    <span class="overline footer__kimi">This website was made using Kimi K3</span>
  </div>
</footer>

<style>
  .footer {
    border-top: 1px solid var(--line);
    margin-top: 4rem;
    padding-block: 3rem 1.75rem;
    position: relative;
    z-index: 2;
    /* Opaque ground — the animated shader bg shows through otherwise and
       swallows the small mono links (REACH column was unreadable). */
    background: var(--bg-0);
  }

  .footer__inner {
    display: grid;
    gap: 2.25rem;
    grid-template-columns: 1fr;
  }

  @media (min-width: 720px) {
    .footer__inner {
      grid-template-columns: 1.5fr 0.8fr 1fr;
      align-items: start;
      gap: 2rem;
    }
  }

  .footer__col {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .footer__brand {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    opacity: 0.9;
  }

  .footer__line {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    color: var(--text);
    font-family: var(--font-display);
    line-height: 1.05;
  }

  .footer__name {
    font-size: clamp(1.35rem, 2.5vw, 1.8rem);
  }

  .footer__role {
    color: var(--muted);
    font-size: clamp(0.9rem, 1.5vw, 1.05rem);
  }

  .footer__loc { color: var(--muted-soft); font-size: 0.88rem; }

  .footer__pages {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.15rem 1rem;
  }

  .footer__page {
    display: inline-block;
    padding: 0.28rem 0;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.8rem;
    transition: color var(--duration-hover) var(--ease-default);
  }
  .footer__page:hover { color: var(--accent-soft); }

  .footer__socials {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 0.8rem;
  }
  @media (min-width: 720px) {
    .footer__col--right { justify-self: end; text-align: right; }
    .footer__socials { justify-content: flex-end; }
  }

  .footer__social {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    padding: 0.3rem 0.6rem;
    border-radius: var(--radius-pill);
    border: 1px solid transparent;
    transition:
      color var(--duration-hover) var(--ease-default),
      border-color var(--duration-hover) var(--ease-default),
      background-color var(--duration-hover) var(--ease-default);
  }
  .footer__social:hover {
    color: var(--accent-soft);
    border-color: rgba(0, 255, 65, 0.32);
    background: rgba(0, 255, 65, 0.06);
  }

  .footer__telemetry {
    margin-top: 0.9rem;
  }

  .footer__bottom {
    margin-top: 2.25rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    justify-content: space-between;
  }
  @media (min-width: 720px) {
    .footer__bottom { flex-direction: row; align-items: center; }
  }

  .footer__kimi {
    color: var(--accent-soft);
    opacity: 0.75;
  }

  .footer__aeo {
    color: var(--accent-soft);
    transition: color var(--duration-hover) var(--ease-default);
  }
  .footer__aeo:hover { color: var(--text); }
</style>
