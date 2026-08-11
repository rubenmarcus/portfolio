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
  const pt = $derived(lang.startsWith("pt"));

  // pt-BR inline strings — EN default stays on siteMeta.
  const role = $derived(pt ? "Engenheiro AI Fullstack" : siteMeta.role);
  const base = $derived(pt ? "Lisboa · Mundial" : siteMeta.base);
  const pagesLabel = $derived(pt ? "Páginas" : "Pages");
  const socialsLabel = "Socials";
  const madeWithAi = $derived(pt ? "Este site foi feito usando IA" : "This website was made using AI");

  const pages = $derived(navItems.map((item) => ({
    label: pt ? (navLabelsPt[item.href] ?? item.label) : item.label,
    href: (pt ? "/pt" : "") + (item.href === "/" ? "" : item.href) || "/",
  })));

  const socials: { label: string; href: string; icon: SvgIconName }[] = [
    { label: "GitHub",   href: "https://github.com/rubenmarcus",       icon: "github" },
    { label: "X",        href: "https://x.com/rubenmarcus_dev",        icon: "xTwitter" },
    { label: "LinkedIn", href: "https://linkedin.com/in/rubenmarcus",  icon: "linkedin" },
    { label: "npm",      href: "https://www.npmjs.com/~rmarcus",       icon: "npm" },
    { label: "Telegram", href: "https://t.me/rubenmarcus",             icon: "telegram" },
  ];

  const products = [
    { label: "Ralph Starter", href: "https://ralphstarter.ai" },
    { label: "Autoresearcher", href: "https://autoresearcher.org" },
    { label: "AEO.js", href: "https://aeojs.org" },
    { label: "AEO Checker", href: "https://check.aeojs.org" },
    { label: "ScanRepo", href: "https://scanrepo.dev" },
    { label: "CS Brasil", href: "https://csbrasil.online" },
  ];

  const aiModels: { label: string; icon: SvgIconName }[] = [
    { label: "Claude", icon: "claude" },
    { label: "GPT / Codex", icon: "openai" },
    { label: "Kimi", icon: "kimi" },
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
    </div>

    <nav class="footer__col footer__col--links" aria-label={pagesLabel}>
      <div class="bracket">{pagesLabel}</div>
      <ul class="footer__pages">
        {#each pages as p}
          <li><a href={p.href} class="footer__page">{p.label}</a></li>
        {/each}
      </ul>
    </nav>

    <nav class="footer__col footer__col--links" aria-label="Products">
      <div class="bracket">Products</div>
      <ul class="footer__projects">
        {#each products as project}
          <li>
            <a href={project.href} class="footer__project" target="_blank" rel="noopener noreferrer">
              <span>{project.label}</span>
              <span aria-hidden="true">↗</span>
            </a>
          </li>
        {/each}
      </ul>
    </nav>

    <div class="footer__col footer__col--links footer__col--right">
      <div class="bracket">{socialsLabel}</div>
      <ul class="footer__socials">
        {#each socials as s}
          <li>
            <a href={s.href} class="footer__social" target="_blank" rel="noopener" aria-label={s.label}>
              <SvgIcon name={s.icon} size={17} />
            </a>
          </li>
        {/each}
      </ul>
    </div>
  </div>

  <div class="container-x footer__telemetry">
    <HeroLiveStats {lang} />
  </div>

  <div class="container-x footer__bottom">
    <span class="overline">© {year} Ruben Marcus</span>
    <span class="overline">
      Built with Astro · Svelte · Three.js · GSAP ·
      <a class="footer__aeo" href="https://aeojs.org" target="_blank" rel="noopener">AEO by aeo.js ↗</a>
    </span>
    <span class="overline footer__ai">
      <span>{madeWithAi}</span>
      <span class="footer__aiModels" aria-label="Claude, GPT / Codex and Kimi">
        {#each aiModels as model}
          <span class="footer__aiModel" title={model.label}>
            <SvgIcon name={model.icon} size={18} stroke={1.1} label={model.label} />
          </span>
        {/each}
      </span>
    </span>
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
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
      gap: 2rem;
    }

    .footer__col--links {
      align-items: center;
      justify-self: center;
      text-align: center;
    }

    .footer__col--links .footer__pages,
    .footer__col--links .footer__projects {
      justify-items: center;
    }

    .footer__col--links .footer__socials {
      justify-content: center;
    }
  }
  @media (min-width: 1080px) {
    .footer__inner {
      grid-template-columns: 1.2fr repeat(3, minmax(0, 1fr));
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

  .footer__projects {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.12rem;
  }
  .footer__project {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    max-width: 100%;
    width: max-content;
    padding: 0.27rem 0;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    transition: color var(--duration-hover) var(--ease-default);
  }
  .footer__project:hover { color: var(--accent-soft); }
  .footer__project span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .footer__col--right {
    align-items: flex-end;
    text-align: right;
  }

  .footer__socials {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.2rem;
  }
  @media (min-width: 720px) {
    .footer__col--right {
      align-items: center;
      justify-self: center;
      text-align: center;
    }
  }

  .footer__social {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--muted);
    width: 32px;
    height: 32px;
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
    margin-top: 2.25rem;
  }

  .footer__bottom {
    margin-top: 2.25rem;
    padding-top: 0.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    justify-content: space-between;
  }
  .footer__bottom .overline {
    text-decoration: none;
  }
  @media (min-width: 720px) {
    .footer__bottom {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      column-gap: 1.5rem;
    }
    .footer__bottom > :nth-child(2) { justify-self: center; }
    .footer__bottom > :last-child { justify-self: end; }
  }

  .footer__ai {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.45rem;
    color: var(--accent-soft);
    opacity: 0.75;
  }

  .footer__aiModels {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .footer__aiModel {
    display: inline-grid;
    place-items: center;
    color: var(--accent-soft);
    opacity: 0.68;
    transition: opacity var(--duration-hover) var(--ease-default);
  }
  .footer__aiModel:hover { opacity: 1; }

  .footer__aeo {
    color: var(--accent-soft);
    transition: color var(--duration-hover) var(--ease-default);
  }
  .footer__aeo:hover { color: var(--text); }
</style>
