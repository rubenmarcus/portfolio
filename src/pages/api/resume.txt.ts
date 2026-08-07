/**
 * GET /api/resume.txt — the terminal resume. curl rubenmarcus.dev gets
 * redirected here by src/middleware.ts when the client is curl/wget/httpie.
 */
export const prerender = false;

import type { APIRoute } from "astro";

const G = "\x1b[32m"; // green
const B = "\x1b[1m";  // bold
const D = "\x1b[2m";  // dim
const R = "\x1b[0m";  // reset

const TEXT = `
${G}${B}rubenmarcus.dev${R} ${D}// terminal resume${R}

${B}Ruben Marcus${R} — Senior AI Fullstack Engineer
Lisbon, Portugal · remote worldwide · 14 years shipping

${G}proof${R}
  #1 ECDSA.fail ............ multi-agent research harness (9 roles, 7+ providers)
  #1 QEC decoder ........... Optimization Arena, 2,642 EPM
  Bitte AI runtime ......... 2.85M+ messages · 24,164 users · 16,703 agents
  CS Brasil (browser FPS) .. 2,191 players · 154K+ kills · 27 countries
  aeo.js / check.aeojs.org . 4,569 AEO scans
  npm ...................... 34K+ all-time downloads

${G}open source${R}
  ralphstarter.ai · autoresearcher.org · aeojs.org
  check.aeojs.org · scanrepo.dev · csbrasil.online

${G}hire me${R}
  email  ruben@rubenmarcus.dev
  cv     GET  /cv.pdf
  api    POST /api/hire  {"name","contact","brief"}
  mcp    POST /api/mcp   (initialize · tools/list · tools/call)
  json   GET  /api/resume.json

${D}agents welcome — this server speaks MCP.${R}
`;

export const GET: APIRoute = () =>
  new Response(TEXT, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
