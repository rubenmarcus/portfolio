export interface AITool {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  url: string;
  repo?: string;
  status: "shipping" | "beta" | "research";
  year: string;
  org: string;
  tags: string[];
}

export const aiTools: AITool[] = [
  {
    slug: "ralph-starter",
    name: "Ralph Starter",
    tagline: "Specs drive code. AI handles the rest.",
    description:
      "An open-source AI coding orchestration platform. Multi-agent swarm mode runs race, consensus, or pipeline strategies over isolated git worktrees; an MCP server exposes the whole loop to any MCP client; and a Figma→code visual validation pipeline closes the design loop.",
    features: [
      "Multi-agent swarms: race · consensus · pipeline over isolated git worktrees",
      "MCP server: the full orchestration loop exposed to any MCP client",
      "Figma→code visual validation pipeline",
      "5 spec sources: OpenSpec · Figma · GitHub · Linear · Notion",
      "Auto-runs tests, lint, build, captures errors shift-left",
      "190+ npm downloads a month",
    ],
    url: "https://ralphstarter.ai",
    repo: "https://github.com/rubenmarcus/ralph-starter",
    status: "shipping",
    year: "2026",
    org: "MultiVM Labs",
    tags: ["AI Agent", "CLI", "Multi-agent", "MCP"],
  },
  {
    slug: "autoresearcher",
    name: "Autoresearcher",
    tagline: "General-purpose research loops.",
    description:
      "A benchmark-driven autonomous research CLI. Multi-agent co-evolution: divergent agent populations explore in isolated git worktrees, champions merge back, and a Pareto frontier tracks the best candidates, with keep/reject validity gating on every iteration. Used internally at MultiVM Labs for post-quantum cryptography, smart wallet, and chain-level benchmarks, but intentionally general-purpose.",
    features: [
      "Multi-agent co-evolution: divergent populations in git worktrees, champion merging",
      "Pareto frontier: best candidates tracked across competing objectives",
      "Keep/reject validity gating per benchmark metric",
      "Markdown final report + JSONL audit log per run",
      "Composable with any benchmark you can express as a shell command",
    ],
    url: "https://autoresearcher.org",
    repo: "https://github.com/rubenmarcus/autoresearcher",
    status: "shipping",
    year: "2026",
    org: "MultiVM Labs",
    tags: ["AI Research", "CLI", "Multi-agent", "Autonomy"],
  },
  {
    slug: "aeojs",
    name: "AEO.js",
    tagline: "Answer Engine Optimization for the modern web.",
    description:
      "An open-source Answer Engine Optimization framework. Analyses your robots policy for AI crawlers and generates LLM-ready site exports (llms.txt, ai-index.json) so ChatGPT, Claude, Perplexity, and any LLM can discover and cite your site. Free, no signup.",
    features: [
      "AI-crawler robots policy analysis: who can see what, and why",
      "LLM-ready exports: llms.txt · ai-index.json · per-page Markdown",
      "First-class plugins: Astro · Next.js · Vite · Nuxt · Angular · Webpack",
      "Standalone CLI mode",
      "Human/AI toggle widget, drop-in",
      "1,300+ npm downloads a month",
    ],
    url: "https://aeojs.org",
    repo: "https://github.com/rubenmarcus/aeo.js",
    status: "shipping",
    year: "2026",
    org: "MultiVM Labs",
    tags: ["AEO", "SEO", "LLM", "Open Source"],
  },
];

export const supportingTools: { name: string; description: string; repo: string }[] = [
  {
    name: "Mirofi.sh",
    description:
      "Hosted SaaS productized from an open-source multi-agent social-simulation engine (GraphRAG/Zep, OASIS). Auth, Supabase storage, Railway/Vercel deployment, web platform.",
    repo: "https://mirofi.sh",
  },
  {
    name: "Chain Agents",
    description:
      "Five deployed chain agents, sole author: Solana assistant, Aerodrome (Base, ~25 tools), Morpho (Ethereum), meme.cooking (NEAR), Sui explorer.",
    repo: "https://github.com/bitteprotocol",
  },
  {
    name: "ralph-templates",
    description: "Ready-to-use project templates consumed by ralph-starter.",
    repo: "https://github.com/multivmlabs/ralph-templates",
  },
  {
    name: "ralph-ideas",
    description: "Public roadmap and changelog for the Ralph ecosystem.",
    repo: "https://github.com/multivmlabs/ralph-ideas",
  },
  {
    name: "awesome-ralph",
    description: "Curated Ralph ecosystem links.",
    repo: "https://github.com/multivmlabs/awesome-ralph",
  },
  {
    name: "post-quantum-packages",
    description:
      "Post-quantum cryptography tooling for Rust and TypeScript: ML-KEM, ML-DSA, SLH-DSA, Falcon.",
    repo: "https://github.com/multivmlabs/post-quantum-packages",
  },
];
