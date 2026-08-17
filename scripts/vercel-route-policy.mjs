/**
 * Post-build route policy for the Vercel Build Output config.
 *
 * Runs after `astro build` (see package.json "build") and prepends two
 * routes to .vercel/output/config.json, before the filesystem handler:
 *
 * 1. 308 `/x/` → `/x` — one canonical URL form per page. Vercel serves both
 *    forms for directory-format static output, which Google crawls as
 *    duplicate documents (GSC 2026-08-14: 97 pages "alternate page with
 *    proper canonical tag").
 * 2. Terminal user agents (curl/wget/httpie) on page routes → /api/resume.txt.
 *    The Astro edge middleware only fronts SSR routes on Vercel — static
 *    pages are served straight from the filesystem — so the curl easter egg
 *    must live at the routing layer to work on prerendered pages.
 *
 * Idempotent: routes are keyed by their `src` and replaced on re-run.
 */
import { readFileSync, writeFileSync } from "node:fs";

const CONFIG_PATH = new URL("../.vercel/output/config.json", import.meta.url);

// Mirrors PAGE in src/middleware.ts — keep the two in sync.
const PAGE_SRC = "^/(|pt)(/(portfolio|ai|skills|lab|blog|about|contact|connect|agents)?)?/?$";
// `has.value` is evaluated as a JavaScript RegExp with no flags: inline
// modifiers like (?i) are invalid there, so case variants are spelled out.
const TERMINAL_UA = ".*(curl|Curl|CURL|wget|Wget|WGET|httpie|HTTPie|libcurl).*";

const POLICY_ROUTES = [
  { src: "^/(.+?)/+$", headers: { Location: "/$1" }, status: 308 },
  {
    src: PAGE_SRC,
    has: [{ type: "header", key: "user-agent", value: TERMINAL_UA }],
    dest: "/api/resume.txt",
    check: true,
  },
  // src/middleware.ts answers every /.well-known/* discovery document
  // (api-catalog, MCP server card, OAuth metadata), but the adapter only
  // fronts *enumerated Astro routes* with the middleware function — these
  // paths matched nothing and 404'd in production. Unknown /.well-known/*
  // paths fall through the middleware to the renderer's regular 404.
  { src: "^/\\.well-known/.*$", dest: "_middleware" },
];

let config;
try {
  config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
} catch (error) {
  console.error(`vercel-route-policy: cannot read ${CONFIG_PATH.pathname} — run astro build first.`);
  throw error;
}

const policySources = new Set(POLICY_ROUTES.map((route) => route.src));
const existing = (config.routes ?? []).filter((route) => !policySources.has(route.src));
config.routes = [...POLICY_ROUTES, ...existing];

writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
console.log(
  `vercel-route-policy: injected ${POLICY_ROUTES.length} routes ahead of ${existing.length} existing (${CONFIG_PATH.pathname})`,
);
