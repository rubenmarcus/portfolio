<script lang="ts">
  /**
   * HireMeFor — the commercial services strip right after the hero.
   * Three flagship offers as spotlight cards in the site's phosphor
   * language:
   *
   *   - stagger rise on first scroll-into-view (IntersectionObserver, once)
   *   - cursor spotlight — a radial green glow tracks the pointer inside
   *     each card via --mx/--my CSS vars
   *   - scanline sweep — a thin phosphor line scans down the card on hover
   *   - whole card is the CTA → /services/<slug>
   *
   * prefers-reduced-motion → everything settled, no sweep, no stagger.
   */

  import { onMount } from "svelte";
  import VoxelIcon from "../lib/assets/VoxelIcon.svelte";
  import { serviceOffers } from "../lib/data/services";

  interface Props {
    lang?: string;
  }
  let { lang = "en" }: Props = $props();
  const pt = $derived(lang.startsWith("pt"));
  const base = $derived(pt ? "/pt" : "");

  const services = $derived(
    serviceOffers.map((service) => ({
      ...service,
      name: service.name[pt ? "pt" : "en"],
      desc: service.summary[pt ? "pt" : "en"],
      chips: service.tags,
    })),
  );

  const copy = $derived(
    pt
      ? {
          bracket: "01 / Contrate",
          title: "Me contrate para",
          sub: "Projetos de escopo fechado, execução sênior, sem babysitting. Cada oferta abaixo é algo que já entreguei em produção.",
          book: "Agendar um projeto →",
          cta: "ver escopo",
        }
      : {
          bracket: "01 / Hire me",
          title: "Hire me for",
          sub: "Fixed-scope engagements, senior execution, no hand-holding. Every offer below is something I've shipped in production.",
          book: "Book a project →",
          cta: "view scope",
        },
  );

  let root = $state<HTMLElement | null>(null);
  let inView = $state(false);

  onMount(() => {
    if (!root) return;
    const el = root;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      inView = true;
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          inView = true;
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  });

  function spotlight(e: PointerEvent) {
    const card = e.currentTarget as HTMLElement;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  }
</script>

<section class="hire" class:hire--in={inView} bind:this={root} aria-label="Hire me for">
  <div class="hire__inner">
    <header class="hire__head">
      <span class="bracket">{copy.bracket}</span>
      <div class="hire__headRow">
        <h2 class="hire__title">{copy.title}</h2>
        <div class="hire__headSide">
          <p class="hire__sub">
            {copy.sub}
          </p>
          <a class="btn btn-primary" href="{base}/contact" data-magnetic data-track="contact_view" data-track-location="home_services">{copy.book}</a>
        </div>
      </div>
    </header>

    <div class="hire__grid">
      {#each services as s, i}
        <a
          class="hire__card"
          href={`${base}/services/${s.slug}`}
          style="--idx: {i};"
          onpointermove={spotlight}
          data-track="service_view"
          data-track-location="home_services"
        >
          <span class="hire__sweep" aria-hidden="true"></span>
          <div class="hire__top">
            <span class="hire__glyph" aria-hidden="true">
              <VoxelIcon name={s.icon} size={20} interactive={false} />
            </span>
            <span class="hire__index">{String(i + 1).padStart(2, "0")}</span>
          </div>
          <span class="hire__name">{s.name}</span>
          <p class="hire__desc">{s.desc}</p>
          <ul class="hire__chips">
            {#each s.chips as chip}
              <li class="hire__chip">{chip}</li>
            {/each}
          </ul>
          <span class="hire__cta">
            {copy.cta} <span class="hire__arrow" aria-hidden="true">→</span>
          </span>
        </a>
      {/each}
    </div>
  </div>
</section>

<style>
  .hire {
    position: relative;
    z-index: 2;
    width: 100%;
    border-bottom: 1px solid var(--line);
    background: linear-gradient(
      180deg,
      #000 0%,
      #030905 22%,
      #05100a 50%,
      #030905 78%,
      #000 100%
    );
  }

  .hire__inner {
    width: 100%;
    max-width: var(--content-max);
    margin-inline: auto;
    padding-inline: var(--gutter-x);
    padding-block: 3.5rem 4.5rem;
  }

  .hire__head {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    margin-bottom: 2.5rem;
  }

  .hire__headRow {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .hire__title {
    font-family: var(--font-display);
    font-size: clamp(2.2rem, 4.4vw, 3.4rem);
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.01em;
    color: var(--text);
    margin: 0;
  }

  .hire__headSide {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.9rem;
    max-width: 46ch;
  }

  .hire__sub {
    color: var(--muted);
    font-size: 0.95rem;
    line-height: 1.55;
    margin: 0;
  }

  .hire__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
  @media (min-width: 720px) { .hire__grid { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 1080px) { .hire__grid { grid-template-columns: repeat(3, 1fr); } }

  .hire__card {
    --mx: 50%;
    --my: 50%;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    padding: 1.4rem 1.4rem 1.5rem;
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: #000;
    color: var(--text);
    text-decoration: none;
    overflow: hidden;
    isolation: isolate;
    opacity: 0;
    transform: translateY(14px);
    transition:
      border-color var(--duration-hover) var(--ease-default),
      transform var(--duration-hover) var(--ease-default),
      box-shadow var(--duration-hover) var(--ease-default);
  }
  .hire--in .hire__card {
    animation: hire-rise 700ms var(--ease-emphasis) forwards;
    animation-delay: calc(var(--idx, 0) * 90ms + 100ms);
  }
  @keyframes hire-rise {
    to { opacity: 1; transform: translateY(0); }
  }

  /* cursor spotlight — radial glow tracking the pointer */
  .hire__card::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background: radial-gradient(
      220px circle at var(--mx) var(--my),
      rgba(0, 255, 65, 0.09),
      transparent 70%
    );
    opacity: 0;
    transition: opacity var(--duration-hover) var(--ease-default);
  }
  .hire__card:hover::before { opacity: 1; }

  .hire__card:hover {
    border-color: var(--line-bright);
    transform: translateY(-4px);
    box-shadow: 0 20px 52px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(0, 255, 65, 0.12);
  }

  /* scanline sweep — one phosphor line scans top→bottom on hover */
  .hire__sweep {
    position: absolute;
    left: 0;
    right: 0;
    top: -2px;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(0, 255, 65, 0.75), transparent);
    opacity: 0;
    pointer-events: none;
  }
  .hire__card:hover .hire__sweep {
    opacity: 1;
    animation: hire-sweep 900ms var(--ease-default) 1;
  }
  @keyframes hire-sweep {
    from { transform: translateY(0); }
    to { transform: translateY(320px); }
  }

  .hire__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.7rem;
  }

  .hire__glyph {
    display: inline-flex;
    align-items: center;
    opacity: 0.7;
  }

  .hire__index {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--muted-soft);
  }

  .hire__name {
    font-family: var(--font-display);
    font-size: 1.35rem;
    line-height: 1.1;
  }

  .hire__desc {
    color: var(--muted);
    font-size: 0.95rem;
    line-height: 1.55;
    margin: 0;
  }

  .hire__chips {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 0.45rem;
    padding: 0;
    margin: 0.2rem 0 0;
  }

  .hire__chip {
    padding: 0.18rem 0.5rem;
    border: 1px solid var(--line);
    border-radius: var(--radius-pill);
    font-family: var(--font-mono);
    font-size: 0.66rem;
    color: var(--muted-soft);
  }

  .hire__cta {
    margin-top: auto;
    padding-top: 0.6rem;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--accent-soft);
    opacity: 0.75;
    transition: opacity var(--duration-hover) var(--ease-default);
  }
  .hire__card:hover .hire__cta {
    opacity: 1;
    text-shadow: 0 0 12px rgba(0, 255, 65, 0.45);
  }

  .hire__arrow {
    display: inline-block;
    transition: transform var(--duration-hover) var(--ease-default);
  }
  .hire__card:hover .hire__arrow { transform: translateX(3px); }

  @media (prefers-reduced-motion: reduce) {
    .hire__card { opacity: 1; transform: none; animation: none; }
    .hire--in .hire__card { animation: none; }
    .hire__sweep { display: none; }
  }
</style>
