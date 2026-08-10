/**
 * Two jobs:
 *
 * 1. curl easter egg — browsers get the site, terminals get the resume.
 *    Explicit terminal clients (curl, wget, httpie) hitting a page route
 *    get the plain-text resume instead of HTML.
 * 2. Agent discovery metadata and content negotiation — Link headers,
 *    RFC 9727 API catalog, MCP Server Card, Agent Skills, and Markdown.
 * 3. OAuth discovery metadata (RFC 8414 / RFC 9728) — some MCP clients
 *    (claude.ai connectors) insist on an OAuth handshake before they will
 *    talk to a server, even an open one. The metadata points at the
 *    auto-approve shim in /oauth/* so that registration succeeds.
 */
import { defineMiddleware } from "astro:middleware";

const PAGE = /^\/(|pt)(\/(portfolio|ai|lab|blog|about|contact|connect|agents)?)?\/?$/;
const TERMINAL = /curl|wget|httpie|libcurl/i;

const json = (
  body: unknown,
  contentType = "application/json",
  cacheControl = "public, max-age=300, stale-while-revalidate=3600",
) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": `${contentType}; charset=utf-8`,
      "cache-control": cacheControl,
      "access-control-allow-origin": "*",
    },
  });

const wellKnown = (pathname: string, origin: string): Response | null => {
  if (pathname === "/.well-known/api-catalog") {
    return json(
      {
        linkset: [
          {
            anchor: `${origin}/api/mcp`,
            "service-desc": [
              { href: `${origin}/openapi.json`, type: "application/openapi+json" },
            ],
            "service-doc": [
              { href: `${origin}/docs/api`, type: "text/html" },
            ],
            status: [{ href: `${origin}/api/health`, type: "application/json" }],
          },
        ],
      },
      "application/linkset+json",
    );
  }

  if (pathname === "/.well-known/mcp/server-card.json") {
    return json({
      $schema: "https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json",
      version: "1.0",
      protocolVersion: "2025-06-18",
      serverInfo: {
        name: "dev.rubenmarcus.portfolio",
        title: "Ruben Marcus Portfolio",
        version: "1.0.0",
      },
      description: "Public portfolio tools for resume, services, availability, and introductions.",
      iconUrl: `${origin}/favicon.svg`,
      documentationUrl: `${origin}/docs/api`,
      transport: { type: "streamable-http", endpoint: `${origin}/api/mcp` },
      capabilities: { tools: {} },
      authentication: { required: false, schemes: [] },
      tools: "dynamic",
      resources: [],
      prompts: [],
    });
  }

  if (pathname === "/.well-known/agent-skills/index.json") {
    return json({
      $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
      skills: [
        {
          name: "portfolio-mcp",
          type: "skill-md",
          description:
            "Discover Ruben Marcus's experience, services, availability, and contact options through his public portfolio MCP endpoint.",
          url: "/.well-known/agent-skills/portfolio-mcp/SKILL.md",
          digest: "sha256:a92c645621d60003fade5f068d5a6c0112a753b3b4d71f03405e4d59a7c39c38",
        },
      ],
    });
  }

  if (
    pathname === "/.well-known/oauth-authorization-server" ||
    pathname === "/.well-known/openid-configuration"
  ) {
    return json({
      issuer: origin,
      authorization_endpoint: `${origin}/oauth/authorize`,
      token_endpoint: `${origin}/oauth/token`,
      registration_endpoint: `${origin}/oauth/register`,
      jwks_uri: `${origin}/oauth/jwks.json`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      scopes_supported: ["portfolio:read"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      agent_auth: {
        skill_uri: `${origin}/auth.md`,
        register_uri: `${origin}/oauth/register`,
        identity_types_supported: ["anonymous"],
        credential_types_supported: ["oauth2_bearer"],
      },
    }, "application/json", "no-store");
  }
  if (
    pathname === "/.well-known/oauth-protected-resource" ||
    pathname === "/.well-known/oauth-protected-resource/api/mcp"
  ) {
    return json({
      resource: `${origin}/api/mcp`,
      resource_name: "Ruben Marcus Portfolio MCP",
      authorization_servers: [origin],
      scopes_supported: ["portfolio:read"],
      bearer_methods_supported: ["header"],
    }, "application/json", "no-store");
  }
  return null;
};

const HOME_LINKS = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</openapi.json>; rel="service-desc"; type="application/openapi+json"',
  '</docs/api>; rel="service-doc"; type="text/html"',
  '</llms.txt>; rel="describedby"; type="text/plain"',
  '</llms-full.txt>; rel="describedby"; type="text/plain"',
  '</ai-index.json>; rel="describedby"; type="application/json"',
  '</docs.json>; rel="describedby"; type="application/json"',
  '</.well-known/mcp/server-card.json>; rel="describedby"; type="application/json"',
].join(", ");

const markdownAccepted = (accept: string) =>
  accept.split(",").some((entry) => {
    const [mediaType, ...parameters] = entry.trim().split(";");
    const rejected = parameters.some((parameter) => /^\s*q=0(?:\.0*)?\s*$/i.test(parameter));
    return mediaType.trim().toLowerCase() === "text/markdown" && !rejected;
  });

const decodeEntities = (value: string) =>
  value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");

/** A dependency-free HTML-to-Markdown fallback suitable for rendered portfolio pages. */
const htmlToMarkdown = (html: string, source: URL) => {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  const markdown = main
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|svg|canvas|template)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<img\b[^>]*alt=["']([^"']*)["'][^>]*>/gi, "![$1]")
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, value) => `${"#".repeat(Number(level))} ${value}\n\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|section|article|header|footer|nav|ul|ol|dl|blockquote)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return `${title ? `# ${decodeEntities(title)}\n\n` : ""}> Source: ${source.href}\n\n${decodeEntities(markdown)}\n`;
};

export const onRequest = defineMiddleware(async (ctx, next) => {
  const discovery = wellKnown(ctx.url.pathname, ctx.url.origin);
  if (discovery) return discovery;

  const ua = ctx.request.headers.get("user-agent") ?? "";
  if (TERMINAL.test(ua) && PAGE.test(ctx.url.pathname)) {
    return ctx.rewrite("/api/resume.txt");
  }

  const response = await next();
  const headers = new Headers(response.headers);
  if (ctx.url.pathname === "/") headers.append("link", HOME_LINKS);

  const contentType = headers.get("content-type") ?? "";
  if (
    ctx.request.method === "GET" &&
    contentType.includes("text/html") &&
    markdownAccepted(ctx.request.headers.get("accept") ?? "")
  ) {
    const html = await response.text();
    headers.set("content-type", "text/markdown; charset=utf-8");
    headers.set("content-location", ctx.url.pathname);
    headers.set("vary", [headers.get("vary"), "Accept"].filter(Boolean).join(", "));
    headers.delete("content-length");
    headers.delete("content-encoding");
    return new Response(htmlToMarkdown(html, ctx.url), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
