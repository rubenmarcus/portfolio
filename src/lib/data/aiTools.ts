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
      "A CLI that pulls structured specs from OpenSpec, Figma, GitHub Issues/PRs, Linear, or Notion — then runs autonomous AI coding loops that analyse, implement, test, lint, build, commit, push, and open a PR. Five spec sources, 19 workflow presets, support for Claude Code, Cursor, Codex, Gemini CLI, Copilot, Amp, OpenCode.",
    features: [
      "5 spec sources: OpenSpec · Figma · GitHub · Linear · Notion",
      "19 workflow presets across development, debugging, review, docs, specialised",
      "Auto-runs tests, lint, build, captures errors shift-left",
      "Auto-commit · push · PR with clean messages",
      "Auto Mode: batch-process GitHub or Linear backlogs end-to-end",
      "Agent Skills system (global + per-project, tech-stack matched)",
    ],
    url: "https://ralphstarter.ai",
    repo: "https://github.com/multivmlabs/ralph-starter",
    status: "shipping",
    year: "2026",
    org: "MultiVM Labs",
    tags: ["AI Agent", "CLI", "Spec-driven", "Automation"],
  },
  {
    slug: "autoresearcher",
    name: "Autoresearcher",
    tagline: "General-purpose research loops.",
    description:
      "A standalone CLI for benchmark-driven autonomous research. Runs a headless agent iteration, runs your benchmark command, parses a metric with a regex, and keeps the iteration only if the metric improved. Used internally at MultiVM Labs for post-quantum cryptography, smart wallet, and chain-level benchmarks — but intentionally general-purpose.",
    features: [
      "Objective-driven iteration (accept/reject per benchmark metric)",
      "Headless by default · extensible via custom commands",
      "Markdown final report + JSONL audit log per run",
      "Cross-domain: AI tools · AI research · AI products · crypto/chain",
      "Composable with any benchmark you can express as a shell command",
    ],
    url: "https://autoresearcher.org",
    repo: "https://github.com/multivmlabs/autoresearcher",
    status: "shipping",
    year: "2026",
    org: "MultiVM Labs",
    tags: ["AI Research", "CLI", "Benchmarks", "Autonomy"],
  },
  {
    slug: "aeojs",
    name: "AEO.js",
    tagline: "Answer Engine Optimization for the modern web.",
    description:
      "Make your site discoverable and citable by ChatGPT, Claude, Perplexity, and any LLM. Auto-generates the files answer engines look for, plus a drop-in Human/AI toggle widget that switches between the rendered page and an AI-readable Markdown version. Free, no signup.",
    features: [
      "Auto-generated llms.txt, robots.txt (AI-aware), sitemap, JSON-LD",
      "Per-page Markdown files for AI crawlers",
      "First-class plugins: Astro · Next.js · Vite · Nuxt · Angular · Webpack",
      "Standalone CLI mode",
      "Human/AI toggle widget — drop-in",
      "Companion checker at check.aeojs.org",
    ],
    url: "https://aeojs.org",
    repo: "https://github.com/multivmlabs/aeo.js",
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
      "1-click deployment tool for Mirofish workflows — turn a Mirofish spec into a hosted endpoint without touching infra.",
    repo: "https://mirofi.sh",
  },
  {
    name: "SUI DeFi Agent",
    description:
      "AI-powered DeFi agent on SUI — chat interface, agent logic, real-time pool data. Part of the MultiVM Labs agent collection.",
    repo: "https://github.com/multivmlabs",
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
      "Post-quantum cryptography tooling for Rust and TypeScript — ML-KEM, ML-DSA, SLH-DSA, Falcon.",
    repo: "https://github.com/multivmlabs/post-quantum-packages",
  },
];
