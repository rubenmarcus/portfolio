/**
 * GET /api/stats — public, read-only aggregates: blog views/likes, MCP
 * traffic by tool and client, agent-surface hits, lead count. One RPC
 * (public.get_stats) for the aggregates plus one direct read for the
 * recent-agents log (distinct-on is not expressible in PostgREST).
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { sbRpc, sbSelect, supabaseEnabled } from "../../lib/server/supabase";

const LOG_ROWS = 5;

export const GET: APIRoute = async () => {
  if (!supabaseEnabled()) {
    return new Response(JSON.stringify({ error: "stats disabled" }), {
      status: 503,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
  const [stats, events] = await Promise.all([
    sbRpc<Record<string, unknown>>("get_stats"),
    // Generous window: crawlers interleave, but a single poller can dominate
    // recent events — 200 rows reliably contains 5 distinct clients.
    sbSelect<{ client: string; tool: string | null; method: string; at: string }>(
      "mcp_events",
      "select=client,tool,method,at&client=not.is.null&order=at.desc&limit=200",
    ),
  ]);
  if (!stats) {
    return new Response(JSON.stringify({ error: "stats unavailable" }), {
      status: 503,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }

  const seen = new Set<string>();
  const recent_agents: { client: string; call: string; at: string }[] = [];
  for (const event of events) {
    if (seen.has(event.client)) continue;
    seen.add(event.client);
    recent_agents.push({ client: event.client, call: event.tool ?? event.method, at: event.at });
    if (recent_agents.length >= LOG_ROWS) break;
  }

  return new Response(
    JSON.stringify({ ...stats, recent_agents, generatedAt: new Date().toISOString() }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        // Aggregates may be CDN-cached briefly: the middleware fetch is keyed
        // by path since 86da782, so per-path s-maxage is safe again.
        "cache-control": "public, max-age=60, s-maxage=300",
        "access-control-allow-origin": "*",
      },
    },
  );
};
