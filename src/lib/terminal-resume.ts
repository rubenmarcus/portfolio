/**
 * The ANSI terminal resume, shared by GET /api/resume.txt and the middleware
 * curl easter egg. The middleware returns it directly instead of rewriting:
 * ctx.rewrite cannot render another route from the Vercel edge bundle, so a
 * rewrite there answers 200 with an empty body.
 */
import { AEO_TOTAL_SCANS, CAREER_YEARS, formatFact } from "./site-facts";

const G = "\x1b[32m"; // green
const B = "\x1b[1m";  // bold
const D = "\x1b[2m";  // dim
const R = "\x1b[0m";  // reset

export const TERMINAL_RESUME = `
${G}${B}rubenmarcus.dev${R} ${D}// terminal resume${R}

${B}Ruben Marcus${R} — Senior AI Fullstack Engineer
Lisbon, Portugal · remote worldwide · ${CAREER_YEARS} years shipping

${G}proof${R}
  #1 ECDSA.fail ............ multi-agent research harness (9 roles, 7+ providers)
  #1 QEC decoder ........... Optimization Arena, 2,642 EPM
  Bitte AI runtime ......... 2.85M+ messages · 24,164 users · 16,703 agents
  CS Brasil (browser FPS) .. 2,191 players · 154K+ kills · 27 countries
  aeo.js / check.aeojs.org . ${formatFact(AEO_TOTAL_SCANS, "en-US")} AEO scans
  npm ...................... 34K+ all-time downloads

${G}open source${R}
  ralphstarter.ai · autoresearcher.org · aeojs.org
  check.aeojs.org · scanrepo.dev · csbrasil.online

${G}hire me${R}
  social linkedin.com/in/rubenmarcus
  cv     GET  /cv.pdf
  api    POST /api/hire  {"name","contact","brief"}
  mcp    POST /api/mcp   (initialize · tools/list · tools/call)
  json   GET  /api/resume.json

${D}agents welcome — this server speaks MCP.${R}
`;

export const terminalResumeResponse = () =>
  new Response(TERMINAL_RESUME, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
