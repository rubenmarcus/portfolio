<script lang="ts">
  import { siteMeta } from "../lib/navigation";
  const year = new Date().getFullYear();

  type SocialKey = "github" | "x-twitter" | "linkedin" | "mail" | "telegram" | "dev-to";

  const socials: { label: string; href: string; icon: SocialKey }[] = [
    { label: "GitHub",   href: "https://github.com/rubenmarcus",       icon: "github" },
    { label: "X",        href: "https://x.com/rubenmarcus_dev",        icon: "x-twitter" },
    { label: "LinkedIn", href: "https://linkedin.com/in/rubenmarcus",  icon: "linkedin" },
    { label: "Email",    href: "mailto:rubenmarcus.dev@gmail.com",     icon: "mail" },
    { label: "Telegram", href: "https://t.me/rubenmarcus",             icon: "telegram" },
    { label: "dev.to",   href: "https://dev.to/rubenmarcus",           icon: "dev-to" },
  ];

  // Inline SVG bodies — keeps Footer purely Svelte, no Astro Icon needed here
  const ICONS: Record<SocialKey, string> = {
    "github":
      '<path fill="currentColor" stroke="none" d="M12 2A10 10 0 0 0 8.84 21.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.69.92.69 1.85V21c0 .27.16.59.67.5A10 10 0 0 0 12 2z"/>',
    "x-twitter":
      '<path fill="currentColor" stroke="none" d="M18.244 2H21.5l-7.5 8.572L23 22h-6.91l-4.81-6.288L5.7 22H2.44l8.02-9.166L1.5 2h7.05l4.34 5.745L18.244 2zm-1.21 18h1.91L7.06 4H5.05l11.985 16z"/>',
    "linkedin":
      '<path fill="currentColor" stroke="none" d="M4 4h4v16H4zM6 2.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM10 8h3.8v2.2h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V20h-4v-5.7c0-1.36-.03-3.1-1.9-3.1-1.9 0-2.2 1.48-2.2 3v5.8h-4V8z"/>',
    "mail":
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    "telegram":
      '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
    "dev-to":
      '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="M7 9v6M5.5 9h3M5.5 12h2.5M5.5 15h3"/><path d="M11 9l1.7 6L14.4 9"/><path d="M17 9v6h2.5M17 12h1.8"/>',
  };
</script>

<footer class="footer">
  <div class="container-x footer__inner">
    <div class="footer__col">
      <div class="bracket">Footer / 06</div>
      <p class="footer__line">
        <span class="footer__name">{siteMeta.name}</span>
        <span class="footer__sep">·</span>
        <span class="footer__role">{siteMeta.role}</span>
      </p>
      <p class="footer__loc">
        {siteMeta.base} · deving @ <a href="https://multivmlabs.com" target="_blank" rel="noopener" class="link-inline">MultiVM Labs</a>
      </p>
    </div>

    <div class="footer__col footer__col--right">
      <div class="bracket">Reach</div>
      <ul class="footer__socials">
        {#each socials as s}
          <li>
            <a href={s.href} class="footer__social" target="_blank" rel="noopener" aria-label={s.label}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                {@html ICONS[s.icon]}
              </svg>
              <span>{s.label}</span>
            </a>
          </li>
        {/each}
      </ul>
    </div>
  </div>

  <div class="container-x footer__bottom">
    <span class="overline">© {year} Ruben Marcus</span>
    <span class="overline">Built with Astro · Svelte · Three.js · animejs</span>
  </div>
</footer>

<style>
  .footer {
    border-top: 1px solid var(--line);
    margin-top: 7rem;
    padding-block: 5rem 2.5rem;
    position: relative;
    z-index: 2;
  }

  .footer__inner {
    display: grid;
    gap: 3rem;
    grid-template-columns: 1fr;
  }

  @media (min-width: 720px) {
    .footer__inner {
      grid-template-columns: 1.4fr 1fr;
      align-items: start;
    }
  }

  .footer__col {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .footer__col--right { justify-self: start; }
  @media (min-width: 720px) {
    .footer__col--right { justify-self: end; text-align: right; }
  }

  .footer__line {
    color: var(--text);
    font-family: var(--font-display);
    font-size: clamp(1.7rem, 3.5vw, 2.5rem);
    line-height: 1.05;
  }

  .footer__sep {
    color: var(--muted-soft);
    margin-inline: 0.45rem;
  }

  .footer__role { color: var(--muted); }
  .footer__loc { color: var(--muted-soft); font-size: 0.92rem; }

  .footer__socials {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem 1rem;
  }
  @media (min-width: 720px) {
    .footer__socials { justify-content: flex-end; }
  }

  .footer__social {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.8rem;
    padding: 0.35rem 0.65rem;
    border-radius: var(--radius-pill);
    border: 1px solid transparent;
    transition:
      color var(--duration-hover) var(--ease-default),
      border-color var(--duration-hover) var(--ease-default),
      background-color var(--duration-hover) var(--ease-default);
  }
  .footer__social:hover {
    color: var(--accent-soft);
    border-color: rgba(58, 109, 255, 0.32);
    background: rgba(58, 109, 255, 0.06);
  }

  .footer__bottom {
    margin-top: 3.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    justify-content: space-between;
  }
  @media (min-width: 720px) {
    .footer__bottom { flex-direction: row; align-items: center; }
  }
</style>
