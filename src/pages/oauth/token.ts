/**
 * POST /oauth/token — exchanges any authorization code for a bearer token.
 * The token proves nothing and guards nothing; /api/mcp is open either way.
 * It exists so OAuth-insistent MCP clients can finish their flow.
 */
export const prerender = false;

import type { APIRoute } from "astro";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type, authorization",
    },
  });

export const OPTIONS: APIRoute = () => json({}, 200);

export const POST: APIRoute = async () =>
  json({
    access_token: `rmc-${crypto.randomUUID()}`,
    token_type: "Bearer",
    expires_in: 2592000,
    scope: "portfolio:read",
  });
