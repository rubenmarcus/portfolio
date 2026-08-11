/**
 * /oauth/* — the auto-approve shim that lets OAuth-insistent MCP clients
 * (claude.ai connectors) finish their registration dance. Nothing here
 * guards anything; the tests pin the contract those clients rely on.
 */
import { describe, it, expect } from "vitest";
import { POST as register } from "../src/pages/oauth/register";
import { GET as authorize } from "../src/pages/oauth/authorize";
import { POST as token } from "../src/pages/oauth/token";

const post = (handler: typeof register, body: unknown) =>
  handler({
    request: new Request("https://rubenmarcus.dev/x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  } as never);

describe("register (RFC 7591 DCR)", () => {
  it("issues a public client for https redirect URIs", async () => {
    const res = await post(register, {
      client_name: "claude",
      redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.client_id).toBeTruthy();
    expect(body.token_endpoint_auth_method).toBe("none");
    expect(body.grant_types).toEqual(["authorization_code"]);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects non-https redirect URIs", async () => {
    const res = await post(register, { redirect_uris: ["http://evil.local/cb"] });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_client_metadata");
  });

  it("rejects a missing redirect_uris list", async () => {
    const res = await post(register, { client_name: "x" });
    expect(res.status).toBe(400);
  });
});

describe("authorize (auto-approve)", () => {
  const call = async (qs: string) =>
    authorize({
      url: new URL(`https://rubenmarcus.dev/oauth/authorize?${qs}`),
      redirect: (to: string, status: number) =>
        new Response(null, { status, headers: { location: to } }),
    } as never);

  it("302s back with code and state", async () => {
    const res = await call(
      "response_type=code&client_id=x&redirect_uri=https%3A%2F%2Fclaude.ai%2Fcb%3Ffoo%3D1&state=abc",
    );
    expect(res.status).toBe(302);
    const target = new URL(res.headers.get("location")!);
    expect(target.origin).toBe("https://claude.ai");
    expect(target.searchParams.get("code")).toMatch(/^rmc-/);
    expect(target.searchParams.get("state")).toBe("abc");
    // pre-existing params on the redirect URI survive
    expect(target.searchParams.get("foo")).toBe("1");
  });

  it("rejects http redirect URIs", async () => {
    expect((await call("redirect_uri=http://evil.local/cb")).status).toBe(400);
  });

  it("rejects a missing redirect_uri", async () => {
    expect((await call("response_type=code")).status).toBe(400);
  });
});

describe("token", () => {
  it("exchanges any code for a bearer token", async () => {
    const res = await post(token, { grant_type: "authorization_code", code: "rmc-x" });
    const body = await res.json();
    expect(body.access_token).toMatch(/^rmc-/);
    expect(body.token_type).toBe("Bearer");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});
