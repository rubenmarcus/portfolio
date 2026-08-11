/**
 * /api/mcp — the agent-facing JSON-RPC endpoint. Regression coverage for
 * what actually broke in production:
 *  - Vercel's CDN cached POST responses by URL, mixing methods (no-store)
 *  - the edge middleware re-wrap threw on 204 (OPTIONS must be 200)
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { GET, POST, OPTIONS } from "../src/pages/api/mcp";

const call = (body: unknown) =>
  POST({
    request: new Request("https://rubenmarcus.dev/api/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  } as never);

const rpc = (method: string, params?: unknown, id: number | null = 1) =>
  call({ jsonrpc: "2.0", id, method, params });

afterEach(() => vi.unstubAllGlobals());

describe("GET discovery", () => {
  it("lists the four tools and is never cached", async () => {
    const res = await GET({} as never);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body.tools).toEqual([
      "get_resume",
      "get_services",
      "check_availability",
      "book_intro",
    ]);
  });
});

describe("CORS preflight", () => {
  it("OPTIONS answers 200, not 204 (204 breaks the edge re-wrap)", async () => {
    const res = await OPTIONS({} as never);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });
});

describe("JSON-RPC handshake", () => {
  it("initialize echoes the client protocol version", async () => {
    const res = await rpc("initialize", { protocolVersion: "2025-03-26" });
    const body = await res.json();
    expect(body.result.protocolVersion).toBe("2025-03-26");
    expect(body.result.capabilities).toEqual({ tools: {} });
    expect(body.result.serverInfo.name).toBe("rubenmarcus-portfolio");
    expect(body.result.instructions).toContain("Ruben Marcus");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("initialize without params falls back to the default version", async () => {
    const body = await (await rpc("initialize")).json();
    expect(body.result.protocolVersion).toBe("2024-11-05");
  });

  it("notifications/initialized is a 202 ack", async () => {
    const res = await rpc("notifications/initialized", undefined, null);
    expect(res.status).toBe(202);
  });

  it("ping answers an empty result", async () => {
    const body = await (await rpc("ping")).json();
    expect(body.result).toEqual({});
  });
});

describe("tools", () => {
  it("tools/list returns schemas for all four tools", async () => {
    const body = await (await rpc("tools/list")).json();
    const names = body.result.tools.map((t: { name: string }) => t.name);
    expect(names).toEqual([
      "get_resume",
      "get_services",
      "check_availability",
      "book_intro",
    ]);
    for (const tool of body.result.tools) {
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  it("get_resume returns parseable resume JSON", async () => {
    const body = await (
      await rpc("tools/call", { name: "get_resume", arguments: {} })
    ).json();
    const resume = JSON.parse(body.result.content[0].text);
    expect(resume.name).toBe("Ruben Marcus");
    expect(resume.links.email).toBeUndefined();
  });

  it("get_services and check_availability return text", async () => {
    for (const name of ["get_services", "check_availability"]) {
      const body = await (
        await rpc("tools/call", { name, arguments: {} })
      ).json();
      expect(body.result.content[0].text.length).toBeGreaterThan(20);
    }
  });

  it("unknown tool is a JSON-RPC -32602", async () => {
    const body = await (
      await rpc("tools/call", { name: "hack_me", arguments: {} })
    ).json();
    expect(body.error.code).toBe(-32602);
  });

  it("unknown method is a JSON-RPC -32601", async () => {
    const body = await (await rpc("resources/list")).json();
    expect(body.error.code).toBe(-32601);
  });

  it("unparseable body is a 400 parse error", async () => {
    const res = await call("this is not json");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe(-32700);
  });
});

describe("book_intro", () => {
  it("rejects incomplete briefs without calling the relay", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const body = await (
      await rpc("tools/call", {
        name: "book_intro",
        arguments: { name: "Ada" },
      })
    ).json();
    expect(body.result.content[0].text).toContain("required");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("relays valid briefs to formsubmit", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const body = await (
      await rpc("tools/call", {
        name: "book_intro",
        arguments: { name: "Ada", contact: "ada@x.co", brief: "Build a thing" },
      })
    ).json();
    expect(body.result.content[0].text).toContain("Intro booked");
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "https://formsubmit.co/ajax/ruben@rubenmarcus.dev",
    );
  });

  it("reports relay failures instead of throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("x", { status: 500 })));
    const body = await (
      await rpc("tools/call", {
        name: "book_intro",
        arguments: { name: "Ada", contact: "ada@x.co", brief: "Build a thing" },
      })
    ).json();
    expect(body.result.content[0].text).toContain("lead delivery unavailable");

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    const body2 = await (
      await rpc("tools/call", {
        name: "book_intro",
        arguments: { name: "Ada", contact: "ada@x.co", brief: "Build a thing" },
      })
    ).json();
    expect(body2.result.content[0].text).toContain("lead delivery unavailable");
  });
});
