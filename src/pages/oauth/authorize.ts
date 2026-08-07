/**
 * GET /oauth/authorize — auto-approve shim. The portfolio grants nothing
 * sensitive (the MCP tools are public), so instead of a consent screen we
 * immediately redirect back with a code. PKCE params are accepted and
 * ignored; the token endpoint exchanges any code for a token.
 */
export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = ({ url, redirect }) => {
  const redirectUri = url.searchParams.get("redirect_uri");
  if (!redirectUri || !redirectUri.startsWith("https://")) {
    return new Response("invalid redirect_uri", { status: 400 });
  }
  const target = new URL(redirectUri);
  target.searchParams.set("code", `rmc-${crypto.randomUUID()}`);
  const state = url.searchParams.get("state");
  if (state) target.searchParams.set("state", state);
  return redirect(target.toString(), 302);
};
