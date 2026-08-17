/**
 * GET /api/stats — public, read-only aggregates: blog views/likes, MCP
 * traffic by tool and client, agent-surface hits, lead count. One RPC
 * (public.get_stats) so the endpoint stays a single round trip.
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { sbRpc, supabaseEnabled } from "../../lib/server/supabase";

export const GET: APIRoute = async () => {
  if (!supabaseEnabled()) {
    return new Response(JSON.stringify({ error: "stats disabled" }), {
      status: 503,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
  const stats = await sbRpc<Record<string, unknown>>("get_stats");
  return new Response(JSON.stringify({ ...(stats ?? {}), generatedAt: new Date().toISOString() }), {
    status: stats ? 200 : 503,
    headers: {
      "content-type": "application/json",
      // Aggregates may be CDN-cached briefly: the middleware fetch is keyed
      // by path since 86da782, so per-path s-maxage is safe again.
      "cache-control": "public, max-age=60, s-maxage=300",
      "access-control-allow-origin": "*",
    },
  });
};
