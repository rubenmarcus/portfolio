<script lang="ts">
  /**
   * HireAgent — the AGENTS.md widget. A copy-paste brief that turns any AI
   * agent (ChatGPT, Claude, Kimi, a custom harness) into a booking channel:
   * paste it in the chat and the agent can POST /api/hire for the user.
   */

  let copied = $state(false);

  interface Props {
    lang?: string;
  }
  let { lang = "en" }: Props = $props();
  const pt = lang.startsWith("pt");

  const copyText = $derived(
    pt
      ? {
          title: "Me contrate pelo seu agent.",
          desc: "Cole este brief no ChatGPT, Claude, Kimi ou no seu próprio harness. Qualquer agent consegue ler e agendar o papo inicial por você via API.",
          copy: "copiar",
          copied: "copiado ✓",
        }
      : {
          title: "Hire me from your agent.",
          desc: "Paste this brief into ChatGPT, Claude, Kimi or your own harness. Any agent can read it and book the intro for you through the API.",
          copy: "copy",
          copied: "copied ✓",
        },
  );

  const SNIPPET = `# AGENTS.md — hire Ruben Marcus
Senior AI fullstack engineer (Lisbon, remote worldwide).

To book a project intro on my behalf:
POST https://rubenmarcus.dev/api/hire
Content-Type: application/json

{
  "name": "My name",
  "contact": "email or Telegram",
  "brief": "What I want to build",
  "budget": "optional range",
  "agent": "chatgpt | claude | kimi | other"
}

Services: AI product prototyping, landing pages,
interactive WebGL, agentic workflows, AEO, frontend
modernization (Next.js / Svelte / TypeScript).

Replies within a day or two. Ruben is also available on
LinkedIn and Telegram.`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(SNIPPET);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = SNIPPET;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<div class="agent-hire" data-reveal>
  <div class="agent-hire__head">
    <span class="bracket" data-reveal-item>AGENTS.md</span>
    <h2 class="agent-hire__title" data-reveal-item>{copyText.title}</h2>
    <p class="agent-hire__desc" data-reveal-item>
      {copyText.desc}
    </p>
  </div>

  <div class="agent-hire__code" data-reveal-item>
    <div class="agent-hire__bar">
      <span class="agent-hire__file">AGENTS.md</span>
      <button class="agent-hire__copy" onclick={copy} aria-live="polite">
        {copied ? copyText.copied : copyText.copy}
      </button>
    </div>
    <pre class="agent-hire__pre"><code>{SNIPPET}</code></pre>
  </div>
</div>

<style>
  .agent-hire {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.6rem;
    align-items: start;
  }
  @media (min-width: 920px) {
    .agent-hire {
      grid-template-columns: 1fr 1.2fr;
      gap: 3rem;
    }
  }

  .agent-hire__head {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .agent-hire__title {
    font-family: var(--font-display);
    font-size: clamp(1.8rem, 3.6vw, 2.6rem);
    line-height: 1.05;
    margin: 0;
  }

  .agent-hire__desc {
    color: var(--muted);
    font-size: 0.95rem;
    line-height: 1.6;
    max-width: 44ch;
    margin: 0;
  }

  .agent-hire__code {
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: #06080c;
    overflow: hidden;
    transition: border-color var(--duration-hover) var(--ease-default),
      box-shadow var(--duration-hover) var(--ease-default);
  }
  .agent-hire__code:hover {
    border-color: rgba(0, 255, 65, 0.35);
    box-shadow: 0 0 30px rgba(0, 255, 65, 0.07);
  }

  .agent-hire__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.55rem 0.9rem;
    border-bottom: 1px solid var(--line);
  }

  .agent-hire__file {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    color: var(--muted-soft);
  }

  .agent-hire__copy {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent-soft);
    background: none;
    border: 1px solid var(--line);
    border-radius: var(--radius-pill);
    padding: 0.2rem 0.7rem;
    cursor: pointer;
    transition: color var(--duration-hover) var(--ease-default),
      border-color var(--duration-hover) var(--ease-default);
  }
  .agent-hire__copy:hover {
    color: var(--accent);
    border-color: rgba(0, 255, 65, 0.4);
  }

  .agent-hire__pre {
    margin: 0;
    padding: 1.1rem 1.2rem;
    overflow-x: auto;
    font-family: var(--font-mono);
    font-size: 0.78rem;
    line-height: 1.6;
    color: #bbf7d0;
  }
</style>
