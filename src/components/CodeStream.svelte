<script lang="ts">
  /**
   * Floating snippets of real code from Ruben's open-source projects.
   * Random snippet placed at a random position, fades in, sits, fades out,
   * then a new one takes its place. 4–6 snippets visible at any time.
   *
   * Each snippet has a `repo` label, so the layer reads as a live code feed
   * rather than decorative ASCII.
   */

  import { onMount } from "svelte";

  interface Props {
    /** Number of snippets visible at any time. */
    count?: number;
    /** Tint color (CSS) for code. */
    color?: string;
    /** Class on wrapping element. */
    class?: string;
  }

  let {
    count = 7,
    color = "rgba(190, 230, 255, 0.62)",
    class: className = "",
  }: Props = $props();

  type Snippet = {
    repo: string;
    code: string;
  };

  // Representative snippets from Ruben's MultiVM Labs / Bitte projects
  const SNIPPETS: Snippet[] = [
    {
      repo: "multivmlabs/ralph-starter",
      code: `export async function runLoop(spec: Spec) {
  const agent = await detectAgent();
  const ctx   = await fetchSpec(spec.source);

  for (let i = 0; i < MAX_LOOPS; i++) {
    const diff  = await agent.implement(ctx);
    const valid = await runValidation(diff);
    if (valid.ok) return commit(diff);
    ctx.errors = valid.errors;
  }
}`,
    },
    {
      repo: "multivmlabs/aeo.js",
      code: `export function generateLlmsTxt(pages: Page[]): string {
  return pages
    .map(p => \`# \${p.title}\\n\\n\${p.summary}\\nURL: \${p.url}\`)
    .join("\\n\\n---\\n\\n");
}`,
    },
    {
      repo: "multivmlabs/autoresearcher",
      code: `while (iteration < maxIterations) {
  const metric = await runBenchmark();
  if (metric > best) {
    best = metric;
    keepIteration();
  } else {
    discardIteration();
  }
  iteration++;
}`,
    },
    {
      repo: "BitteProtocol/wallet",
      code: `const outcome = await wallet.signAndSendTransaction({
  receiverId: contract,
  actions: [
    functionCall("execute", args, GAS, ONE_YOCTO),
  ],
});`,
    },
    {
      repo: "Mintbase/mintbase-js",
      code: `const minter = MintbaseSDK.getMinter(storeId);
const tx = await minter.mint({
  metadata: { title, description, media },
  reference,
  numToMint: 1,
});`,
    },
    {
      repo: "BitteProtocol/sui-agent",
      code: `const txb = new TransactionBlock();
txb.moveCall({
  target: \`\${pkg}::trade::execute\`,
  arguments: [txb.pure(amount), txb.object(pool)],
});`,
    },
    {
      repo: "BitteProtocol/trading-agent",
      code: `const route = await aggregator.getBestRoute({
  fromToken, toToken, amount, chainId,
});
const tx = await wallet.sendTransaction(route.tx);`,
    },
    {
      repo: "multivmlabs/ralph-templates",
      code: `// AGENTS.md
- agent: claude-code
- skills: [frontend, tailwind, typescript]
- validation: [pnpm test, pnpm lint, pnpm build]`,
    },
    {
      repo: "multivmlabs/post-quantum-packages",
      code: `import { mlKemEncapsulate } from "@multivm/pq";
const { ct, ss } = await mlKemEncapsulate(pk);
return wrapKey(ss, payload);`,
    },
    {
      repo: "BitteProtocol/chat",
      code: `<BitteAiChat
  agentId="ruben-agent"
  apiUrl="https://wallet.bitte.ai/api/v1"
  wallet={{ near, evm }}
/>`,
    },
  ];

  type Active = {
    id: number;
    snippet: Snippet;
    x: number; // % of container
    y: number; // % of container
    born: number;
  };

  let active = $state<Active[]>([]);
  let mounted = $state(false);
  let enabled = $state(false);
  let nextId = 0;

  const LIFE_MS = 5800;       // fade-in + sit + fade-out
  const SPAWN_MS = 850;        // a new snippet roughly every ~0.85s

  function pickSnippet(): Snippet {
    return SNIPPETS[Math.floor(Math.random() * SNIPPETS.length)];
  }

  function pickPosition(): { x: number; y: number } {
    // Spawn anywhere on screen. CSS mask softly fades code out of the
    // center-left zone where the hero title sits, so we don't need a hard
    // "no go" region here.
    const x = 2 + Math.random() * 88; // 2–90%
    const y = 4 + Math.random() * 78; // 4–82% — more vertical spread now
    return { x, y };
  }

  onMount(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduced || coarse) {
      // Render one static snippet for visual presence, no animation
      mounted = true;
      enabled = false;
      const s = pickSnippet();
      active = [{ id: 0, snippet: s, x: 4, y: 12, born: performance.now() }];
      return;
    }

    enabled = true;
    mounted = true;

    // Seed
    for (let i = 0; i < Math.min(count, 4); i++) {
      const pos = pickPosition();
      active.push({
        id: nextId++,
        snippet: pickSnippet(),
        x: pos.x,
        y: pos.y,
        born: performance.now() - i * 800,
      });
    }
    active = [...active];

    let spawnInterval: number | null = null;
    let cullInterval: number | null = null;

    spawnInterval = window.setInterval(() => {
      const now = performance.now();
      if (active.length < count) {
        const pos = pickPosition();
        active = [
          ...active,
          {
            id: nextId++,
            snippet: pickSnippet(),
            x: pos.x,
            y: pos.y,
            born: now,
          },
        ];
      }
    }, SPAWN_MS);

    cullInterval = window.setInterval(() => {
      const now = performance.now();
      const next = active.filter((a) => now - a.born < LIFE_MS);
      if (next.length !== active.length) active = next;
    }, 400);

    return () => {
      if (spawnInterval) clearInterval(spawnInterval);
      if (cullInterval) clearInterval(cullInterval);
    };
  });
</script>

<div class={`code-stream ${className}`} aria-hidden="true" style:color>
  {#if mounted}
    {#each active as item (item.id)}
      <pre
        class="code-stream__item"
        class:enabled
        style:left={`${item.x}%`}
        style:top={`${item.y}%`}
        style:animation-duration={enabled ? `${LIFE_MS}ms` : "0s"}
      ><span class="code-stream__repo">// {item.snippet.repo}</span>{"\n"}{item.snippet.code}</pre>
    {/each}
  {/if}
</div>

<style>
  .code-stream {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    /* Two-region cutout — code is hidden from both the lede zone
       (bottom-left where intro + title sit) AND from the ASCII head
       region (centered ellipse where the character appears in the
       video). It renders everywhere else. mask-composite: intersect
       means both masks have to allow a pixel for code to show there. */
    mask-image:
      radial-gradient(ellipse 55% 55% at 22% 80%, transparent 45%, #000 88%),
      radial-gradient(ellipse 26% 48% at 50% 50%, transparent 60%, #000 100%);
    -webkit-mask-image:
      radial-gradient(ellipse 55% 55% at 22% 80%, transparent 45%, #000 88%),
      radial-gradient(ellipse 26% 48% at 50% 50%, transparent 60%, #000 100%);
    mask-composite: intersect;
    -webkit-mask-composite: source-in;
  }

  .code-stream__item {
    position: absolute;
    margin: 0;
    font-family: var(--font-mono);
    font-size: 1.05rem;
    line-height: 1.45;
    letter-spacing: 0.01em;
    color: inherit;
    white-space: pre;
    text-shadow: 0 0 14px rgba(58, 109, 255, 0.32);
    max-width: 48ch;
    opacity: 0;
  }
  @media (max-width: 900px) {
    .code-stream__item { font-size: 0.85rem; max-width: 36ch; }
  }

  .code-stream__item.enabled {
    animation-name: cs-life;
    animation-timing-function: linear;
    animation-iteration-count: 1;
    animation-fill-mode: forwards;
  }

  @keyframes cs-life {
    0%   { opacity: 0; transform: translateY(8px); }
    8%   { opacity: 0.85; transform: translateY(0); }
    82%  { opacity: 0.85; transform: translateY(-6px); }
    100% { opacity: 0; transform: translateY(-14px); }
  }

  .code-stream__repo {
    display: block;
    margin-bottom: 0.3rem;
    color: rgba(160, 195, 255, 0.75);
    font-size: 0.82rem;
    letter-spacing: 0.04em;
  }

  /* Hide static fallback on smaller screens to keep the hero clean */
  @media (max-width: 720px) {
    .code-stream__item { display: none; }
    .code-stream__item:first-child { display: block; }
  }
</style>
