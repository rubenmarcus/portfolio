/**
 * /api/hire — the agent-facing hiring endpoint behind the contact form.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { POST, OPTIONS } from "../src/pages/api/hire";

const call = (body: unknown) =>
  POST({
    request: new Request("https://rubenmarcus.dev/api/hire", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  } as never);

const valid = { name: "Ada", contact: "ada@x.co", brief: "Build a thing" };

afterEach(() => vi.unstubAllGlobals());

it("OPTIONS answers 200 with no-store (204 broke the edge re-wrap)", () => {
  const res = OPTIONS({} as never);
  expect(res.status).toBe(200);
  expect(res.headers.get("cache-control")).toBe("no-store");
});

it("rejects a non-JSON body", async () => {
  const res = await call("nope");
  expect(res.status).toBe(400);
  expect((await res.json()).ok).toBe(false);
});

it("requires name, contact and brief", async () => {
  const res = await call({ name: "Ada" });
  expect(res.status).toBe(400);
  expect((await res.json()).error).toContain("required");
});

it("honeypot field fakes success without relaying", async () => {
  const fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  const res = await call({ ...valid, website: "spammy" });
  expect((await res.json()).ok).toBe(true);
  expect(fetchSpy).not.toHaveBeenCalled();
});

it("rejects oversized fields", async () => {
  const res = await call({ ...valid, name: "x".repeat(200) });
  expect(res.status).toBe(400);
  expect((await res.json()).error).toContain("too long");
});

it("relays valid inquiries to formsubmit", async () => {
  const fetchSpy = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
  vi.stubGlobal("fetch", fetchSpy);
  const res = await call(valid);
  const body = await res.json();
  expect(body.ok).toBe(true);
  expect(fetchSpy).toHaveBeenCalledOnce();
  expect(fetchSpy.mock.calls[0][0]).toBe(
    "https://formsubmit.co/ajax/ruben@rubenmarcus.dev",
  );
  expect(res.headers.get("cache-control")).toBe("no-store");
});

it("maps relay failures to 502", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("x", { status: 500 })));
  expect((await call(valid)).status).toBe(502);

  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
  expect((await call(valid)).status).toBe(502);
});
