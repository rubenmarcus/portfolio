/**
 * Two jobs:
 *
 * 1. curl easter egg — browsers get the site, terminals get the resume.
 *    Explicit terminal clients (curl, wget, httpie) hitting a page route
 *    get the plain-text resume instead of HTML.
 * 2. OAuth discovery metadata (RFC 8414 / RFC 9728) — some MCP clients
 *    (claude.ai connectors) insist on an OAuth handshake before they will
 *    talk to a server, even an open one. The metadata points at the
 *    auto-approve shim in /oauth/* so that registration succeeds.
 */
import { defineMiddleware } from "astro:middleware";

const PAGE = /^\/(|pt)(\/(portfolio|ai|lab|blog|about|contact|connect|agents)?)?\/?$/;
const TERMINAL = /curl|wget|httpie|libcurl/i;

const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

const wellKnown = (pathname: string, origin: string): Response | null => {
  if (
    pathname === "/.well-known/oauth-authorization-server" ||
    pathname === "/.well-known/openid-configuration"
  ) {
    return json({
      issuer: origin,
      authorization_endpoint: `${origin}/oauth/authorize`,
      token_endpoint: `${origin}/oauth/token`,
      registration_endpoint: `${origin}/oauth/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
    });
  }
  if (
    pathname === "/.well-known/oauth-protected-resource" ||
    pathname === "/.well-known/oauth-protected-resource/api/mcp"
  ) {
    return json({
      resource: `${origin}/api/mcp`,
      authorization_servers: [origin],
      bearer_methods_supported: ["header"],
    });
  }
  return null;
};

export const onRequest = defineMiddleware(async (ctx, next) => {
  const discovery = wellKnown(ctx.url.pathname, ctx.url.origin);
  if (discovery) return discovery;

  const ua = ctx.request.headers.get("user-agent") ?? "";
  if (TERMINAL.test(ua) && PAGE.test(ctx.url.pathname)) {
    return ctx.rewrite("/api/resume.txt");
  }
  return next();
});
