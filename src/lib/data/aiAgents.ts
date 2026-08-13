export type AgentGroup = "bitte" | "ecdsa" | "game";

export interface AIAgent {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  /** Where the agent runs — chain for production agents, origin for loop roles. */
  chain: string;
  /** Role inside the fleet: platform, framework, chain-specific agent, or loop role. */
  category:
    | "platform"
    | "sdk"
    | "defi"
    | "trading"
    | "consumer"
    | "explorer"
    | "storage"
    | "identity"
    | "governance"
    | "devtool"
    | "orchestration"
    | "review"
    | "build";
  /** Origin: Bitte production fleet, ECDSA.fail command center, CS Brasil Gauntlet. */
  group: AgentGroup;
  tags: string[];
  /** Generated cover thumb (scripts/gen-blog-covers.mjs). */
  cover: string;
  /** Optional deep-link to the article/work page telling this agent's story. */
  link?: { href: string; label: string };
}

/**
 * The agent fleet, grouped by origin. Honest framing: at Bitte I designed
 * the agent pattern and the runtime it runs on — the chain-specific agents
 * are instances of that pattern, not from-scratch one-off builds. The
 * ECDSA.fail and CS Brasil entries are role prompts + contracts in
 * file-based orchestration layers, dispatched to coding-agent CLIs.
 */
export const aiAgents: AIAgent[] = [
  // ── Bitte Protocol — the production fleet ────────────────────────────
  {
    slug: "agent-ai-runtime",
    name: "AI Framework",
    tagline: "Natural language in, signed transactions out.",
    description:
      "Multi-model LLM orchestration runtime — Express, Vercel AI SDK, and Mastra with pgvector memory — that turns natural language into signed transactions across EVM, NEAR, Sui, Cardano, and Midnight. ~20 cross-chain primitives, with MCP for agent-to-agent handoff. The platform every agent below runs on.",
    chain: "EVM · NEAR · Sui · Cardano · Midnight",
    category: "platform",
    group: "bitte",
    tags: ["LLM orchestration", "Mastra", "pgvector", "MCP", "Multi-chain"],
    cover: "/art/blog/agent-ai-runtime.png",
  },
  {
    slug: "agent-sdk",
    name: "@bitte-ai/chat + make-agent",
    tagline: "An OpenAPI spec is the agent.",
    description:
      "Open-source SDK from the BitteProtocol/ai monorepo. Publish a manifest at /api/ai-plugin and you get a tool-calling LLM agent with in-chat wallet signing — no bespoke agent code. The pattern the whole fleet is built from.",
    chain: "Chain-agnostic",
    category: "sdk",
    group: "bitte",
    tags: ["Open source", "OpenAPI", "Tool calling", "Wallet signing"],
    cover: "/art/blog/agent-sdk.png",
  },
  {
    slug: "agent-uniswap",
    name: "Uniswap agent",
    tagline: "Keyless cross-chain swaps from a chat prompt.",
    description:
      "Swap quotes and execution routed through a Safe smart account controlled by NEAR MPC chain signatures — keyless cross-chain custody — with Zerion and 1inch integrations for portfolio context and liquidity.",
    chain: "Ethereum / EVM",
    category: "defi",
    group: "bitte",
    tags: ["Safe", "NEAR MPC", "Chain signatures", "Zerion", "1inch"],
    cover: "/art/blog/agent-uniswap.png",
  },
  {
    slug: "agent-gnosis-pilot",
    name: "Gnosis Pilot",
    tagline: "A DeFi yield copilot with live data.",
    description:
      "Yield copilot that reads live DefiLlama data and builds encoded Aave and Balancer strategy transactions on Gnosis Chain — the user reviews and signs, the agent does the routing math.",
    chain: "Gnosis Chain",
    category: "defi",
    group: "bitte",
    tags: ["DefiLlama", "Aave", "Balancer", "Yield"],
    cover: "/art/blog/agent-gnosis-pilot.png",
  },
  {
    slug: "agent-polymarket",
    name: "Polymarket agent",
    tagline: "A prediction-market analyst that can place the bet.",
    description:
      "Fuses the CLOB API, Gamma API, and the subgraph into one analyst: market sentiment, portfolio PnL, and bet execution from the same conversation.",
    chain: "Polygon",
    category: "trading",
    group: "bitte",
    tags: ["CLOB API", "Gamma API", "Subgraph", "PnL"],
    cover: "/art/blog/agent-polymarket.png",
  },
  {
    slug: "agent-meme-cooking",
    name: "meme.cooking agent",
    tagline: "One prompt, one memecoin.",
    description:
      "Launch a memecoin from a single chat prompt on NEAR — AI-generated art included. The fleet's most unhinged demo, and the easiest way to show what agent-executed deployment feels like.",
    chain: "NEAR",
    category: "consumer",
    group: "bitte",
    tags: ["Token launch", "AI art", "NEAR"],
    cover: "/art/blog/agent-meme-cooking.png",
  },
  {
    slug: "agent-solana-assistant",
    name: "Solana Assistant",
    tagline: "Solana chain data, agent-ready.",
    description:
      "Nine tool endpoints over @solana/web3.js: portfolio, paginated token holders, Metaplex token metadata, address info, network stats, top wallets — plus transaction generation for SOL and SPL transfers with memo support. Jest-tested.",
    chain: "Solana",
    category: "explorer",
    group: "bitte",
    tags: ["@solana/web3.js", "Metaplex", "9 tools", "Jest"],
    cover: "/art/blog/agent-solana-assistant.png",
  },
  {
    slug: "agent-jupiter",
    name: "Jupiter swap agent",
    tagline: "Quote and swap on Solana, one endpoint.",
    description:
      "Quote plus serialized swap transaction via Jupiter v6 (@jup-ag/api), with token resolution from a 53-token registry and SOL wrap/unwrap handling. Bun-first, with a bun:test suite that runs quote→swap end to end.",
    chain: "Solana",
    category: "defi",
    group: "bitte",
    tags: ["@jup-ag/api v6", "Bun", "bun:test", "Swaps"],
    cover: "/art/blog/agent-jupiter.png",
  },
  {
    slug: "agent-morpho",
    name: "Morpho agent",
    tagline: "Lending and borrowing, spelled out for an LLM.",
    description:
      "Thirteen endpoints across Morpho vaults (Earn) and markets (Borrow) on Ethereum: deposits, withdrawals, reward claims via Merkle proofs, supply-collateral / borrow / repay, plus APY, position, and market-metric queries. viem, Vitest-tested.",
    chain: "Ethereum",
    category: "defi",
    group: "bitte",
    tags: ["Morpho", "viem", "13 tools", "Vitest"],
    cover: "/art/blog/agent-morpho.png",
  },
  {
    slug: "agent-aerodrome",
    name: "Aerodrome agent",
    tagline: "The full veAERO machine as agent tools.",
    description:
      "The most feature-rich agent in the fleet: 44 tool endpoints over Aerodrome on Base — pool and gauge analytics, bribe ROI and strategy, veAERO voting power and lock management, multi-pool optimal routing, and LP transaction generation from add-liquidity to bribe deposits. viem + The Graph.",
    chain: "Base",
    category: "defi",
    group: "bitte",
    tags: ["Aerodrome", "veAERO", "44 tools", "The Graph", "viem"],
    cover: "/art/blog/agent-aerodrome.png",
  },
  {
    slug: "agent-walrus",
    name: "Walrus agent",
    tagline: "Decentralized storage by chat.",
    description:
      "Store and read blobs on Walrus through public publisher and aggregator REST endpoints — no SDK — with failover across publishers, cost calculation, blob info, and certification status. Five tools, mainnet.",
    chain: "Sui",
    category: "storage",
    group: "bitte",
    tags: ["Walrus", "REST", "Failover", "5 tools"],
    cover: "/art/blog/agent-walrus.png",
  },
  {
    slug: "agent-sui-assistant",
    name: "Sui assistant",
    tagline: "A Sui explorer that talks back.",
    description:
      "Address info, owned objects, SUI-denominated portfolio, network stats, and transaction generation via @mysten/sui — six tools, deployed live on bitte.ai.",
    chain: "Sui",
    category: "explorer",
    group: "bitte",
    tags: ["@mysten/sui", "6 tools", "Live on bitte.ai"],
    cover: "/art/blog/agent-sui-assistant.png",
  },
  {
    slug: "agent-ens",
    name: "ENS agent",
    tagline: "Names, records, registrations: as tools.",
    description:
      "Resolve names, reverse-lookup addresses, check availability, prepare registrations with cost estimates, and set address and reverse records. viem under the hood, execution through the shared generate-evm-tx tool.",
    chain: "Ethereum",
    category: "identity",
    group: "bitte",
    tags: ["ENS", "viem", "6 tools"],
    cover: "/art/blog/agent-ens.png",
  },

  // ── ECDSA.fail — the command center roles ────────────────────────────
  {
    slug: "agent-frontier-dissector",
    name: "Frontier Dissector",
    tagline: "Takes the best solution apart to find the next lever.",
    description:
      "Reacts to every promoted submission: refreshes the frontier via the ecdsafail CLI, classifies the move (UNCHANGED / NONCE_ONLY / STRUCTURAL / MIXED / BLOCKED), and writes route slates only when the structure actually moved — interrupting paid hunts the moment they go stale. Read-only on source.",
    chain: "ECDSA.fail",
    category: "orchestration",
    group: "ecdsa",
    tags: ["Route slates", "Frontier classification", "dispatch: Amp"],
    cover: "/art/blog/agent-frontier-dissector.png",
    link: { href: "/blog/the-agent-swarm-that-took-1-on-ecdsa-fail", label: "Read the story →" },
  },
  {
    slug: "agent-circuit-engineer",
    name: "Circuit Engineer",
    tagline: "Advances one structural route at a time.",
    description:
      "Works a single CPU-safe structural route in an isolated worktree — reduced-width fixtures, route packets, value-exactness notes — and stops the moment the cheapest falsifier has a verdict. PROCEED_CPU / KILL / PARK; no GPU spend.",
    chain: "ECDSA.fail",
    category: "build",
    group: "ecdsa",
    tags: ["Isolated worktrees", "Fixtures", "dispatch: Codex"],
    cover: "/art/blog/agent-circuit-engineer.png",
    link: { href: "/blog/the-agent-swarm-that-took-1-on-ecdsa-fail", label: "Read the story →" },
  },
  {
    slug: "agent-density-analyst",
    name: "Density Analyst",
    tagline: "Decides whether a route clears the economics.",
    description:
      "Turns one dirty-positive candidate into a hunt-economics report: expected nonces-to-clean, near-miss histograms, and hard thresholds — ≤500M expected scan is huntable, ≥2.5B is stop by default. Forbidden from claiming 'huntable' without the math.",
    chain: "ECDSA.fail",
    category: "review",
    group: "ecdsa",
    tags: ["Hunt economics", "Thresholds", "dispatch: Amp"],
    cover: "/art/blog/agent-density-analyst.png",
    link: { href: "/blog/the-agent-swarm-that-took-1-on-ecdsa-fail", label: "Read the story →" },
  },
  {
    slug: "agent-cuda-engineer",
    name: "CUDA Engineer",
    tagline: "No speed claim without parity.",
    description:
      "Filter and evaluator throughput work confined to the CUDA eval path, parity-gated against fixtures: PARITY_PASS / PARITY_FAIL / SPEED_PASS, and any fixture mismatch stops the line. The harness only trusts what the trusted evaluator confirms.",
    chain: "ECDSA.fail",
    category: "build",
    group: "ecdsa",
    tags: ["CUDA", "Parity gates", "dispatch: Codex"],
    cover: "/art/blog/agent-cuda-engineer.png",
    link: { href: "/blog/the-agent-swarm-that-took-1-on-ecdsa-fail", label: "Read the story →" },
  },
  {
    slug: "agent-pod-manager",
    name: "Pod Manager",
    tagline: "No pod runs without a written contract.",
    description:
      "Paid GPU compute only after an approved HUNT_READY: writes pods/<id>.json contracts with spend cap, wall-clock cap, non-overlapping nonce ranges, heartbeat logs, and kill conditions — then stops at the cap or the first verified winner.",
    chain: "ECDSA.fail",
    category: "orchestration",
    group: "ecdsa",
    tags: ["Pod contracts", "Spend caps", "dispatch: Amp"],
    cover: "/art/blog/agent-pod-manager.png",
    link: { href: "/blog/the-agent-swarm-that-took-1-on-ecdsa-fail", label: "Read the story →" },
  },
  {
    slug: "agent-research-scout",
    name: "Research Scout",
    tagline: "One non-duplicate route seed per run.",
    description:
      "The read-only lead lane: scans papers, repos, and branch-library clues and converts them into a bounded route packet — hypothesis, cheapest falsifier, validator command, max cost, kill condition. Routed through the model chain GLM → Kimi → OpenRouter → Amp.",
    chain: "ECDSA.fail",
    category: "orchestration",
    group: "ecdsa",
    tags: ["Route packets", "Paper scan", "Model routing"],
    cover: "/art/blog/agent-research-scout.png",
    link: { href: "/blog/openrouter-routing", label: "Read the story →" },
  },
  {
    slug: "agent-orchestrator-reviewer",
    name: "Orchestrator-Reviewer",
    tagline: "Trusted eval output is the only accepted evidence.",
    description:
      "The dispatch-only meta role: decomposes work into bounded worker tickets (~2h, 5-file cap), synthesizes results, and audits worker claims against artifacts — hallucinated measurements get flagged, and no GPU spend happens without an explicit budget.",
    chain: "ECDSA.fail",
    category: "review",
    group: "ecdsa",
    tags: ["Ticket sizing", "Claim audits", "dispatch: Codex"],
    cover: "/art/blog/agent-orchestrator-reviewer.png",
    link: { href: "/blog/the-agent-swarm-that-took-1-on-ecdsa-fail", label: "Read the story →" },
  },
  {
    slug: "agent-combinator",
    name: "Combinator",
    tagline: "Two failures, one win.",
    description:
      "Reads every sub-agent's results and insights and asks whether separately-failed efforts compose — a density-collapsing cut plus a structural repair, two NOOP knobs that only fire together. Evidence is labeled CONFIRMED / INFERRED / UNKNOWN; it proposes, never applies.",
    chain: "ECDSA.fail",
    category: "orchestration",
    group: "ecdsa",
    tags: ["Composition", "Evidence labels", "dispatch: Amp"],
    cover: "/art/blog/agent-combinator.png",
    link: { href: "/blog/the-agent-swarm-that-took-1-on-ecdsa-fail", label: "Read the story →" },
  },

  // ── CS Brasil — the Gauntlet loop roles ──────────────────────────────
  {
    slug: "agent-gauntlet-critics",
    name: "Gauntlet Critics",
    tagline: "The builder never grades.",
    description:
      "Seven adversarial critics in parallel — graphics, maps, weapons-visual, weapons-feel, UI-menu, UI-HUD, gameplay — each in clean context, seeing the screenshots and the code but never the builder's report. 'Improve the lighting' is an invalid answer: every gap carries file:line and a numeric fix.",
    chain: "CS Brasil",
    category: "review",
    group: "game",
    tags: ["7 critics", "Clean context", "0–10 scores"],
    cover: "/art/blog/agent-gauntlet-critics.png",
    link: { href: "/blog/shipping-a-browser-fps", label: "Read the story →" },
  },
  {
    slug: "agent-gauntlet-builders",
    name: "Gauntlet Builders",
    tagline: "Parallel edits on one 6,543-line file.",
    description:
      "Builders fan out across the same game.js in disjoint symbol ranges from a generated conflict table — Edit tool only, never Write — with red zones (constructor / update / _dom) append-only. Measured, not hoped: three agents edited disjoint ranges simultaneously with zero content conflicts.",
    chain: "CS Brasil",
    category: "build",
    group: "game",
    tags: ["Conflict table", "Symbol ranges", "Red zones"],
    cover: "/art/blog/agent-gauntlet-builders.png",
    link: { href: "/blog/shipping-a-browser-fps", label: "Read the story →" },
  },
  {
    slug: "agent-regression-hunter",
    name: "Regression Hunter",
    tagline: "The agent that pays for the whole loop.",
    description:
      "A fresh-context critic with one mission: find what got WORSE — comparing before/after screenshots and the git diff, isolating the weapon viewmodel by the pixels invariant across camera angles. Standing order: if there's no regression, say so — don't invent one.",
    chain: "CS Brasil",
    category: "review",
    group: "game",
    tags: ["A/B frames", "Fresh context", "git diff"],
    cover: "/art/blog/agent-regression-hunter.png",
    link: { href: "/blog/shipping-a-browser-fps", label: "Read the story →" },
  },
  {
    slug: "agent-bug-hunter",
    name: "Bug Hunter",
    tagline: "The ruler comes before the fix.",
    description:
      "The bug-hunt skill: write the measurement first and watch it go red, ship every fix with the mutation that proves the ruler can fail, refute the obvious guess with a measured negative — and remember the symptom is where the user was, not where the defect lives.",
    chain: "CS Brasil",
    category: "review",
    group: "game",
    tags: ["Rulers", "Mutations", "Symptom ≠ defect"],
    cover: "/art/blog/agent-bug-hunter.png",
    link: { href: "/blog/cs-brasil-ai-harness", label: "Read the story →" },
  },
  {
    slug: "agent-asset-review",
    name: "Asset Review",
    tagline: "Nothing ships on the artist's own word.",
    description:
      "Adversarial critic that runs after every new character, map, model or texture is generated or integrated, and before the front can be called done. Same rule as the Gauntlet: whoever made the asset never grades it, and the verdict cites what in the render proves the defect.",
    chain: "CS Brasil",
    category: "review",
    group: "game",
    tags: ["Assets", "Adversarial", "Pre-merge gate"],
    cover: "/art/blog/agent-asset-review.png",
    link: { href: "/blog/inside-the-gauntlet-loop", label: "Read the story →" },
  },
  {
    slug: "agent-regua",
    name: "Régua",
    tagline: "Write the ruler before you touch the fix.",
    description:
      "Writes the invariant, the probe and the gate for every front — 25 consistency criteria that outrank the fidelity bar, because a visual win that breaks the game is a regression. A ruler is only trusted once a mutation proves it can go red.",
    chain: "CS Brasil",
    category: "review",
    group: "game",
    tags: ["Invariants", "Probes", "Quality gates"],
    cover: "/art/blog/agent-regua.png",
    link: { href: "/blog/evals-are-the-product", label: "Read the story →" },
  },
  {
    slug: "agent-content-pipeline",
    name: "Content Pipeline",
    tagline: "A team, a real place, a playable map.",
    description:
      "Turns a brief into shipped game content: character teams, maps of real Brazilian locations, and the 3D assets behind them — generation, integration and the review pass, in one bounded run.",
    chain: "CS Brasil",
    category: "build",
    group: "game",
    tags: ["Characters", "Maps", "3D assets"],
    cover: "/art/blog/agent-content-pipeline.png",
    link: { href: "/blog/shipping-a-browser-fps", label: "Read the story →" },
  },
  {
    slug: "agent-faction-pipeline",
    name: "Faction Pipeline",
    tagline: "A whole faction, end to end.",
    description:
      "Creates or extends a faction in one pass: registry entry, roster, crest, cover art, the Mint character, thumbnail, selection video, and an original voice — every step wired into the game rather than left as loose files.",
    chain: "CS Brasil",
    category: "build",
    group: "game",
    tags: ["Factions", "Roster", "Voice"],
    cover: "/art/blog/agent-faction-pipeline.png",
    link: { href: "/blog/shipping-a-browser-fps", label: "Read the story →" },
  },
];
