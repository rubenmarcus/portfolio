/**
 * GET /api/resume.txt — the terminal resume. curl rubenmarcus.dev gets this
 * same payload straight from src/middleware.ts (and, for prerendered pages,
 * from the routing layer via scripts/vercel-route-policy.mjs).
 *
 * The routing-layer rewrite lands here without passing the edge middleware,
 * so the agent_hits log for the curl easter egg lives in this handler —
 * every serve, rewritten or direct, goes through it.
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { sbInsert } from "../../lib/server/supabase";
import { terminalResumeResponse } from "../../lib/terminal-resume";

const TERMINAL = /curl|wget|httpie|libcurl/i;

export const GET: APIRoute = async (ctx) => {
  const ua = ctx.request.headers.get("user-agent") ?? "";

  // Fire-and-forget hit log; handed to the edge runtime's waitUntil when
  // available so the insert survives the response.
  const hit = sbInsert("agent_hits", {
    surface: TERMINAL.test(ua) ? "terminal-resume" : "resume-txt",
    path: "/api/resume.txt",
    user_agent: ua.slice(0, 200) || null,
  });
  const edge = (ctx.locals as { vercel?: { edge?: { waitUntil?: (p: Promise<unknown>) => void } } } | undefined)
    ?.vercel?.edge;
  if (edge?.waitUntil) edge.waitUntil(hit);
  else void hit;

  return terminalResumeResponse();
};
