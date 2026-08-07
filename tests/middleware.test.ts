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

describe("OAuth discovery metadata", () => {
  it("serves authorization-server metadata", async () => {
    const res = await onRequest(
      ctxFor("/.well-known/oauth-authorization-server") as never,
      next as never,
    );
    const body = await res.json();
    expect(body.authorization_endpoint).toContain("/oauth/authorize");
    expect(body.token_endpoint).toContain("/oauth/token");
    expect(body.registration_endpoint).toContain("/oauth/register");
    expect(body.code_challenge_methods_supported).toContain("S256");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("serves the same metadata at the OIDC discovery path", async () => {
    const res = await onRequest(
      ctxFor("/.well-known/openid-configuration") as never,
      next as never,
    );
    expect((await res.json()).issuer).toBe("https://rubenmarcus.dev");
  });

  it("serves protected-resource metadata at both well-known paths", async () => {
    for (const p of [
      "/.well-known/oauth-protected-resource",
      "/.well-known/oauth-protected-resource/api/mcp",
    ]) {
      const res = await onRequest(ctxFor(p) as never, next as never);
      const body = await res.json();
      expect(body.resource).toBe("https://rubenmarcus.dev/api/mcp");
      expect(body.authorization_servers).toEqual(["https://rubenmarcus.dev"]);
    }
  });
});

describe("curl easter egg", () => {
  it("rewrites terminal clients on page routes to the text resume", async () => {
    const res = await onRequest(
      ctxFor("/", "curl/8.0") as never,
      next as never,
    );
    expect(await res.text()).toBe("rewritten:/api/resume.txt");
  });

  it("leaves API routes alone for terminal clients", async () => {
    const res = await onRequest(
      ctxFor("/api/mcp", "curl/8.0") as never,
      next as never,
    );
    expect(await res.text()).toBe("next");
  });

  it("leaves browsers alone on page routes", async () => {
    const res = await onRequest(ctxFor("/about") as never, next as never);
    expect(await res.text()).toBe("next");
  });
});
