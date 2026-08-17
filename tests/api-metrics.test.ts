/**
 * /api/views, /api/likes, /api/stats — the observability endpoints.
 * Outside an Astro runtime astro:content is unresolvable, so slug checks
 * fall back to shape-only (documented in src/lib/server/blog-slugs.ts) —
 * which is exactly the layer these tests pin.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET as viewsGet, POST as viewsPost } from "../src/pages/api/views";
import { POST as likesPost } from "../src/pages/api/likes";
import { GET as statsGet } from "../src/pages/api/stats";

const post = (handler: typeof viewsPost, body: unknown) =>
  handler({
    request: new Request("https://rubenmarcus.dev/api/x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  } as never);

const get = (handler: typeof viewsGet, search: string) =>
  handler({ url: new URL(`https://rubenmarcus.dev/api/x${search}`) } as never);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("without Supabase env vars", () => {
  it("answers 503 and never touches the network", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect((await get(viewsGet, "?slug=evals-are-the-product")).status).toBe(503);
    expect((await post(likesPost, { slug: "evals-are-the-product" })).status).toBe(503);
    expect((await statsGet({} as never)).status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("with Supabase configured", () => {
  beforeEach(() => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
  });

  it("rejects malformed slugs before any network call", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect((await post(viewsPost, { slug: "NOT a slug!!" })).status).toBe(400);
    expect((await post(viewsPost, {})).status).toBe(400);
    expect((await get(viewsGet, "?slug=NOT%20a%20slug")).status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("accepts lab counter keys (shape-only membership)", async () => {
    const fetchSpy = vi.fn(async () => new Response("3", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect((await post(likesPost, { slug: "lab-flow-field" })).status).toBe(200);
    expect((await post(likesPost, { slug: "lab-" })).status).toBe(400);
  });

  it("answers the batch shape without a slug param, briefly cacheable", async () => {
    const rows = JSON.stringify([{ slug: "evals-are-the-product", views: 7 }]);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(rows, { status: 200 })));
    const res = await get(viewsGet, "");
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("s-maxage=60");
    expect(await res.json()).toEqual({ counters: { "evals-are-the-product": 7 } });
  });

  it("increments views through the RPC and returns the count", async () => {
    const fetchSpy = vi.fn(async () => new Response("42", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const res = await post(viewsPost, { slug: "evals-are-the-product" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ slug: "evals-are-the-product", views: 42 });
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toContain("/rest/v1/rpc/increment_view");
    expect(init.headers).toMatchObject({ apikey: "service-key" });
  });

  it("clamps like deltas to ±1", async () => {
    const fetchSpy = vi.fn(async () => new Response("7", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    await post(likesPost, { slug: "evals-are-the-product", delta: -5 });
    let body = JSON.parse((fetchSpy.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.delta).toBe(1);
    await post(likesPost, { slug: "evals-are-the-product", delta: -1 });
    body = JSON.parse((fetchSpy.mock.calls[1] as unknown as [string, RequestInit])[1].body as string);
    expect(body.delta).toBe(-1);
  });

  it("answers 503 when the store itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("error", { status: 500 })));
    expect((await post(viewsPost, { slug: "evals-are-the-product" })).status).toBe(503);
  });
});
