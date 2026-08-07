/**
 * POST /oauth/register — RFC 7591 Dynamic Client Registration, shim edition.
 *
 * The MCP endpoint is open; this exists because some MCP clients (claude.ai
 * connectors) refuse to talk to a server that doesn't do OAuth. We issue a
 * public client_id on the spot — nothing is stored, nothing is verified.
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

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine — defaults below
  }
  const redirectUris = Array.isArray(body.redirect_uris)
    ? body.redirect_uris.filter(
        (u): u is string => typeof u === "string" && u.startsWith("https://"),
      )
    : [];
  if (redirectUris.length === 0) {
    return json(
      {
        error: "invalid_client_metadata",
        error_description: "at least one https redirect_uri is required",
      },
      400,
    );
  }
  return json(
    {
      client_id: crypto.randomUUID(),
      client_name: typeof body.client_name === "string" ? body.client_name : "mcp-client",
      redirect_uris: redirectUris,
      grant_types: ["authorization_code"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      client_id_issued_at: Math.floor(Date.now() / 1000),
    },
    201,
  );
};
