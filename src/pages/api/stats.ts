/**
 * GET /api/stats — public, read-only aggregates: blog views/likes, MCP
 * traffic by tool and client, agent-surface hits, lead count. One RPC
 * (public.get_stats) plus one direct read for the tool-call log (every
 * tools/call with its caller — handshakes stay out of the feed).
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { sbRpc, sbSelect, supabaseEnabled } from "../../lib/server/supabase";

export const GET: APIRoute = async () => {
  if (!supabaseEnabled()) {
    return new Response(JSON.stringify({ error: "stats disabled" }), {
      status: 503,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
  const [stats, toolCalls] = await Promise.all([
    sbRpc<Record<string, unknown>>("get_stats"),
    sbSelect<{ client: string; tool: string; at: string }>(
      "mcp_events",
      "select=client,tool,at&client=not.is.null&tool=not.is.null&order=at.desc&limit=100",
    ),
  ]);
  if (!stats) {
    return new Response(JSON.stringify({ error: "stats unavailable" }), {
      status: 503,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }

  return new Response(
    JSON.stringify({
      ...stats,
      // Defensive filter: PostgREST already excludes null tools, but the
      // log must never show handshake rows even if the read changes shape.
      recent_tool_calls: toolCalls.filter((call) => call.client && call.tool).slice(0, 50),
      generatedAt: new Date().toISOString(),
    }),
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
