/**
 * Canonical resume data — single source of truth for the MCP get_resume
 * tool and GET /api/resume.json. Mirrors the /about page; the PDF version
 * lives at /cv.pdf.
 */

import { AEO_TOTAL_SCANS, CAREER_YEARS, formatFact } from "./site-facts";
import { serviceOffers } from "./data/services";

export const EMAIL = "ruben@rubenmarcus.dev";

export const RESUME = {
  name: "Ruben Marcus",
  fullName: "Ruben Marcus Luz Paschoarelli",
  role: "Senior AI Fullstack Engineer",
  base: "Lisbon, Portugal — remote worldwide",
  yearsExperience: CAREER_YEARS,
  summary:
    `Senior AI Fullstack Engineer building AI-native products, agent tooling, and premium web experiences. ${CAREER_YEARS} years across AI dev tools, web3, fintech, and e-commerce: 4+ years deep in web3/crypto, 2+ years building AI developer tools. Built 10+ AI agents for DeFi protocols across Solana, EVM, SUI, NEAR, and Cardano.`,
  proof: [
    "#1 on ECDSA.fail — multi-agent research harness, 9 LLM roles across 7+ providers",
    "#1 on Optimization Arena QEC decoder leaderboard (2,642 EPM)",
    "Bitte Protocol AI runtime in production: 2.85M+ messages, 24,164 users, 16,703 deployed agents",
    "CS Brasil browser FPS: 2,191 players, 154K+ kills, 27 countries",
    `Creator of aeo.js + check.aeojs.org (${formatFact(AEO_TOTAL_SCANS, "en-US")} AEO scans)`,
    "34K+ all-time npm downloads",
  ],
  experience: [
    {
      period: "Oct 2025 → 2026",
      role: "Senior AI Fullstack Engineer",
      org: "MultiVM Labs",
      location: "Remote",
      highlights: [
        "Core frontend engineer for Quantum, a post-quantum secure L1: main web app + developer-facing interfaces",
        "Built Ralph Starter from scratch: AI coding orchestrator with Figma / GitHub / Linear / Notion integrations (100+ daily npm downloads)",
        "Created AEO.js: Answer Engine Optimization for JS, makes sites discoverable by ChatGPT, Claude, Perplexity",
        "Built Autoresearcher, a benchmark-driven autonomous research loop CLI, and a SUI AI Agent for DeFi",
      ],
    },
    {
      period: "Aug 2022 → Sep 2025",
      role: "Senior AI Fullstack Engineer",
      org: "Bitte Protocol",
      location: "Remote",
      highlights: [
        "Built an end-to-end AI trading agent on NearIntents + Bitte AI: UI, agent logic, real-time data",
        "Built the dev tooling for shipping AI agents: make-agent CLI, @bitte-ai/chat embeddable SDK, agent boilerplates",
        "Agents and frontends across Solana, EVM, SUI, and NEAR; core contributor on Bitte Wallet; Mintbase NFT marketplace",
        "Led frontend cross-chain integrations and the MintbaseUI design system",
      ],
    },
    {
      period: "Sep 2021 → Jul 2022",
      role: "Senior Fullstack Engineer",
      org: "Grover",
      location: "Lisbon, Portugal",
      highlights: [
        "Led migration of the main app homepage from legacy React 16 + Redux to Next.js + React Query",
        "Cut asset load by 50%+ converting all site assets to WebP; shipped A/B tests driving acquisition + retention",
      ],
    },
    {
      period: "Apr 2019 → Aug 2021",
      role: "Lead Frontend Engineer",
      org: "Zup Innovation",
      location: "São Paulo, Brazil",
      highlights: [
        "Architected + built Itaú's Developer Portal (Strapi + Node backend, Next.js frontend) — the face of Open Banking at the largest bank in Latin America",
        "Mission-critical financial platforms for Itaú and Santander Spain; StackSpot micro-frontends (Single SPA + React)",
        "Code quality leadership in a 60+ engineer org: test coverage, reviews, CI/CD",
      ],
    },
    {
      period: "Feb 2018 → Mar 2019",
      role: "Software Engineer",
      org: "GO-K",
      location: "São Paulo, Brazil",
      highlights: [
        "Built a vehicle marketplace for Brazil's largest logistics group; landing pages + custom web apps for multiple clients",
      ],
    },
    {
      period: "Mar 2012 → Mar 2017",
      role: "Software Engineer",
      org: "Freelance",
      location: "São Paulo + worldwide",
      highlights: [
        "Custom software for Fortune 500 clients and startups: Under Armour, Nike, Centauro, Samsung, Panasonic, Monsanto, Itaú",
        "E-commerce, marketplaces, blogs, content portals, landing pages, admin dashboards, monitoring systems",
      ],
    },
  ],
  skills: {
    languages: ["TypeScript", "JavaScript", "Rust", "PHP", "C#"],
    frameworks: ["React", "Next.js", "Svelte 5", "Astro", "Vue.js", "Angular", "Node", "Bun"],
    aiAgents: ["Claude SDK", "OpenAI SDK", "AI SDK", "MCP", "Ralph loops", "Custom agent tooling"],
    web3: ["EVM", "NEAR", "SUI", "Solana", "Cardano", "Wagmi", "Viem", "Solana Kit", "near-api-js", "Suiet", "ERC-4337"],
    dataApi: ["GraphQL", "React Query", "Strapi", "Socket.io", "tRPC"],
    infraDevops: ["AWS", "GCP", "Vercel", "Docker", "Terraform", "GitHub Actions", "Turborepo"],
    testing: ["Jest", "Playwright", "Cypress", "RTL"],
    design: ["Figma", "Storybook", "Tailwind", "Three.js", "GLSL shaders"],
  },
  education: [
    { school: "FIAP", program: "Information Systems (Associate)", period: "Jan 2020 → Jan 2022" },
  ],
  openSource: {
    "ralph-starter": "https://ralphstarter.ai",
    autoresearcher: "https://autoresearcher.org",
    "aeo.js": "https://aeojs.org",
    "aeo-checker": "https://check.aeojs.org",
    scanrepo: "https://scanrepo.dev",
    "cs-brasil": "https://csbrasil.online",
  },
  links: {
    site: "https://rubenmarcus.dev",
    cv: "https://rubenmarcus.dev/cv.pdf",
    github: "https://github.com/rubenmarcus",
    linkedin: "https://linkedin.com/in/rubenmarcus",
  },
};

export const SERVICES = serviceOffers.map(
  (service) => `${service.name.en} — ${service.summary.en} (${service.duration.en}) · https://rubenmarcus.dev/services/${service.slug}`,
);

export const AVAILABILITY =
  "Selectively available for full-time roles and freelance contracts. Fixed-scope engagements preferred. Replies within a day or two.";
