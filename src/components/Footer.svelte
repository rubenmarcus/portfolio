<script lang="ts">
  import { socialLinks, siteMeta } from "../lib/navigation";
  const year = new Date().getFullYear();
</script>

<footer class="footer">
  <div class="container-x footer__inner">
    <div class="footer__col">
      <div class="bracket">[ Footer / 06 ]</div>
      <p class="footer__line">
        <span class="footer__name">{siteMeta.name}</span>
        <span class="footer__sep">·</span>
        <span class="footer__role">{siteMeta.role}</span>
      </p>
      <p class="footer__loc">{siteMeta.base} · deving @ <a href="https://multivmlabs.com" target="_blank" rel="noopener" class="link-inline">MultiVM Labs</a></p>
    </div>

    <div class="footer__col footer__col--right">
      <div class="bracket">[ Reach ]</div>
      <ul class="footer__socials">
        {#each socialLinks as s}
          <li>
            <a href={s.href} class="nav-link" target="_blank" rel="noopener">{s.label}</a>
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
    margin-top: 6rem;
    padding-block: 4rem 2rem;
    position: relative;
    z-index: 2;
  }

  .footer__inner {
    display: grid;
    gap: 2.5rem;
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
    gap: 0.8rem;
  }

  .footer__col--right {
    justify-self: start;
  }
  @media (min-width: 720px) {
    .footer__col--right { justify-self: end; text-align: right; }
  }

  .footer__line {
    color: var(--text);
    font-family: var(--font-display);
    font-size: clamp(1.6rem, 3.5vw, 2.4rem);
    line-height: 1.05;
  }

  .footer__sep {
    color: var(--muted-soft);
    margin-inline: 0.45rem;
  }

  .footer__role {
    color: var(--muted);
  }

  .footer__loc {
    color: var(--muted-soft);
    font-size: 0.9rem;
  }

  .footer__socials {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.4rem;
  }
  @media (min-width: 720px) {
    .footer__socials { justify-content: flex-end; }
  }

  .footer__bottom {
    margin-top: 3rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    justify-content: space-between;
  }
  @media (min-width: 720px) {
    .footer__bottom { flex-direction: row; align-items: center; }
  }
</style>
