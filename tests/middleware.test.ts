/**
 * middleware — OAuth discovery metadata (what claude.ai probes before it
 * will talk to /api/mcp) and the curl easter egg.
 */
import { describe, it, expect } from "vitest";
import { onRequest } from "../src/middleware";

const ctxFor = (path: string, ua = "Mozilla/5.0") => ({
  request: new Request(`https://rubenmarcus.dev${path}`, {
    headers: { "user-agent": ua },
  }),
  url: new URL(`https://rubenmarcus.dev${path}`),
  rewrite: (to: string) => new Response(`rewritten:${to}`),
});

const next = () => new Response("next");

const requireResponse = (value: void | Response): Response => {
  if (!(value instanceof Response)) throw new Error("Middleware returned no response");
  return value;
};

describe("OAuth discovery metadata", () => {
  it("serves authorization-server metadata", async () => {
    const res = requireResponse(await onRequest(
      ctxFor("/.well-known/oauth-authorization-server") as never,
      next as never,
    ));
    const body = await res.json();
    expect(body.authorization_endpoint).toContain("/oauth/authorize");
    expect(body.token_endpoint).toContain("/oauth/token");
    expect(body.registration_endpoint).toContain("/oauth/register");
    expect(body.code_challenge_methods_supported).toContain("S256");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("serves the same metadata at the OIDC discovery path", async () => {
    const res = requireResponse(await onRequest(
      ctxFor("/.well-known/openid-configuration") as never,
      next as never,
    ));
    expect((await res.json()).issuer).toBe("https://rubenmarcus.dev");
  });

  it("serves protected-resource metadata at both well-known paths", async () => {
    for (const p of [
      "/.well-known/oauth-protected-resource",
      "/.well-known/oauth-protected-resource/api/mcp",
    ]) {
      const res = requireResponse(await onRequest(ctxFor(p) as never, next as never));
      const body = await res.json();
      expect(body.resource).toBe("https://rubenmarcus.dev/api/mcp");
      expect(body.authorization_servers).toEqual(["https://rubenmarcus.dev"]);
    }
  });
});

describe("agent discovery", () => {
  it("publishes a typed RFC 9727 API catalog", async () => {
    const res = requireResponse(await onRequest(ctxFor("/.well-known/api-catalog") as never, next as never));
    expect(res.headers.get("content-type")).toContain("application/linkset+json");
    expect((await res.json()).linkset[0]["service-desc"][0].href).toContain("/openapi.json");
  });

  it("publishes an MCP Server Card and Agent Skills index", async () => {
    const card = requireResponse(await onRequest(ctxFor("/.well-known/mcp/server-card.json") as never, next as never));
    expect((await card.json()).transport.endpoint).toBe("https://rubenmarcus.dev/api/mcp");

    const index = requireResponse(await onRequest(ctxFor("/.well-known/agent-skills/index.json") as never, next as never));
    expect((await index.json()).skills[0].digest).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("adds discovery Link headers on the homepage", async () => {
    const res = requireResponse(await onRequest(ctxFor("/") as never, next as never));
    expect(res.headers.get("link")).toContain('rel="api-catalog"');
    expect(res.headers.get("link")).toContain('rel="service-desc"');
  });

  it("negotiates rendered HTML to Markdown", async () => {
    const context = ctxFor("/about") as ReturnType<typeof ctxFor>;
    context.request = new Request("https://rubenmarcus.dev/about", {
      headers: { accept: "text/markdown", "user-agent": "Mozilla/5.0" },
    });
    const res = requireResponse(await onRequest(
      context as never,
      (() => new Response("<html><head><title>About</title></head><main><h1>Hello</h1><p>World</p></main></html>", {
        headers: { "content-type": "text/html; charset=utf-8" },
      })) as never,
    ));
    expect(res.headers.get("content-type")).toContain("text/markdown");
    expect(await res.text()).toContain("# Hello");
  });
});

describe("curl easter egg", () => {
  it("rewrites terminal clients on page routes to the text resume", async () => {
    const res = requireResponse(await onRequest(
      ctxFor("/", "curl/8.0") as never,
      next as never,
    ));
    expect(await res.text()).toBe("rewritten:/api/resume.txt");
  });

  it("leaves API routes alone for terminal clients", async () => {
    const res = requireResponse(await onRequest(
      ctxFor("/api/mcp", "curl/8.0") as never,
      next as never,
    ));
    expect(await res.text()).toBe("next");
  });

  it("leaves browsers alone on page routes", async () => {
    const res = requireResponse(await onRequest(ctxFor("/about") as never, next as never));
    expect(await res.text()).toBe("next");
  });
});
