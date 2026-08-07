/**
 * GET /api/resume.json — machine-readable CV for agents and crawlers.
 * Linked from llms.txt and the /connect page.
 */
export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        name: "Ruben Marcus",
        role: "Senior AI Fullstack Engineer",
        base: "Lisbon, Portugal — remote worldwide",
        years_experience: 14,
        availability: "Selectively available: full-time roles and freelance contracts.",
        services: [
          "AI product prototyping",
          "Landing pages that convert",
          "Interactive web experiences (Three.js / WebGL / shaders)",
          "Agentic workflows & internal tools",
          "AEO & technical SEO",
          "Frontend modernization (Next.js / SvelteKit / TypeScript)",
        ],
        proof: [
          "#1 on ECDSA.fail — multi-agent research harness, 9 LLM roles, 7+ providers",
          "#1 on Optimization Arena QEC decoder leaderboard — 2,642 EPM",
          "Bitte Protocol AI runtime: 2.85M+ messages, 24,164 users, 16,703 deployed agents",
          "CS Brasil browser FPS: 2,191 players, 154K+ kills, 27 countries",
          "Creator of aeo.js and check.aeojs.org — 4,569 AEO scans",
          "34K+ all-time npm downloads",
        ],
        open_source: {
          "ralph-starter": "https://ralphstarter.ai",
          autoresearcher: "https://autoresearcher.org",
          "aeo.js": "https://aeojs.org",
          "aeo-checker": "https://check.aeojs.org",
          scanrepo: "https://scanrepo.dev",
          "cs-brasil": "https://csbrasil.online",
        },
        contact: {
          email: "ruben@rubenmarcus.dev",
          github: "https://github.com/rubenmarcus",
          linkedin: "https://linkedin.com/in/rubenmarcus",
          hire_api: "https://rubenmarcus.dev/api/hire",
          mcp: "https://rubenmarcus.dev/api/mcp",
        },
      },
      null,
      2,
    ),
    {
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
        "cache-control": "public, max-age=3600",
      },
    },
  );
