/**
 * Production smoke test — asserts the deployed site against the contracts
 * the repo promises. The vitest suite pins these in-process; this pins the
 * real deployment (routing, edge middleware, CDN cache), where they have
 * silently diverged before: on 2026-08-17 every GET /api/* returned the
 * github-stats payload, every /.well-known/* discovery document 404'd, and
 * /oauth/authorize answered with example.com's 404 body.
 *
 * Side-effect free by construction: book_intro is only exercised through
 * its validation error (no lead relay), and no real emails are sent.
 *
 *   pnpm smoke:prod            # against https://www.rubenmarcus.dev
 *   SMOKE_ORIGIN=... pnpm smoke:prod
 */
const ORIGIN = process.env.SMOKE_ORIGIN ?? "https://www.rubenmarcus.dev";
const BROWSER_UA = "Mozilla/5.0 (smoke-prod)";

const checks = [];
const check = (name, fn) => checks.push({ name, fn });
const fail = (message) => { throw new Error(message); };
const preview = (body) => JSON.stringify(body).slice(0, 120);

const get = (path, init = {}) =>
  fetch(`${ORIGIN}${path}`, { headers: { "user-agent": BROWSER_UA, ...(init.headers ?? {}) }, ...init });

const getJson = async (path, init = {}) => {
  const res = await get(path, init);
  return { res, body: await res.json() };
};

const rpc = async (payload) => {
  const { body } = await getJson("/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return body;
};

// ---------------------------------------------------------------- api core

check("GET /api/resume.json is the resume, not github-stats", async () => {
  const { body } = await getJson("/api/resume.json");
  if (body.name !== "Ruben Marcus") fail(`unexpected payload: ${preview(body)}`);
});

check("GET /api/health answers its own contract", async () => {
  const { body } = await getJson("/api/health");
  if (body.service !== "rubenmarcus-portfolio-api") fail(`unexpected payload: ${preview(body)}`);
});

check("GET /api/hire describes the hire contract", async () => {
  const { body } = await getJson("/api/hire");
  if (!String(body.endpoint ?? "").includes("/api/hire")) fail(`unexpected payload: ${preview(body)}`);
});

check("GET /api/github-stats.json still serves stats", async () => {
  const { body } = await getJson("/api/github-stats.json");
  if (typeof body.total !== "number") fail(`unexpected payload: ${preview(body)}`);
});

// ------------------------------------------------------------ mcp protocol

check("MCP initialize echoes the protocol and names the server", async () => {
  const body = await rpc({
    jsonrpc: "2.0", id: 1, method: "initialize",
    params: { protocolVersion: "2025-06-18", clientInfo: { name: "smoke-prod" }, capabilities: {} },
  });
  const r = body.result ?? {};
  if (r.protocolVersion !== "2025-06-18") fail(`protocolVersion: ${r.protocolVersion}`);
  if (r.serverInfo?.name !== "rubenmarcus-portfolio") fail(`serverInfo: ${preview(r.serverInfo)}`);
  if (!r.instructions) fail("missing instructions");
});

check("MCP notifications/initialized returns an empty 202", async () => {
  const res = await get("/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
  });
  const text = await res.text();
  if (res.status !== 202 || text !== "") fail(`got ${res.status} with ${text.length} bytes`);
});

check("MCP tools/list exposes the 4 tools", async () => {
  const body = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  const tools = body.result?.tools ?? [];
  if (tools.length < 4) fail(`expected >=4 tools, got ${tools.length}`);
});

check("MCP tools/call answers (side-effect-free tools)", async () => {
  for (const name of ["get_resume", "get_services", "check_availability"]) {
    const body = await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name, arguments: {} } });
    const text = body.result?.content?.[0]?.text ?? "";
    if (text.length < 20) fail(`${name} returned ${text.length} bytes`);
  }
});

check("MCP book_intro validates without relaying", async () => {
  const body = await rpc({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "book_intro", arguments: {} } });
  const text = body.result?.content?.[0]?.text ?? "";
  if (!text.startsWith("error:")) fail(`expected validation error, got: ${text.slice(0, 60)}`);
});

check("MCP error codes: -32602 / -32601 / -32700", async () => {
  const unknownTool = await rpc({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "nope" } });
  if (unknownTool.error?.code !== -32602) fail(`unknown tool: ${preview(unknownTool)}`);
  const unknownMethod = await rpc({ jsonrpc: "2.0", id: 6, method: "resources/list" });
  if (unknownMethod.error?.code !== -32601) fail(`unknown method: ${preview(unknownMethod)}`);
  const res = await get("/api/mcp", { method: "POST", headers: { "content-type": "application/json" }, body: "{broken" });
  const body = await res.json();
  if (res.status !== 400 || body.error?.code !== -32700) fail(`malformed: ${res.status} ${preview(body)}`);
});

// ------------------------------------------------- agent discovery + oauth

check("/.well-known discovery documents answer", async () => {
  const catalog = await getJson("/.well-known/api-catalog");
  if (!catalog.res.headers.get("content-type")?.includes("linkset")) fail("api-catalog content-type");
  const card = await getJson("/.well-known/mcp/server-card.json");
  if (card.body.transport?.endpoint !== `${ORIGIN}/api/mcp`) fail(`server-card: ${preview(card.body.transport)}`);
  const oauth = await getJson("/.well-known/oauth-authorization-server");
  if (!oauth.body.token_endpoint) fail("oauth metadata missing token_endpoint");
  const skills = await getJson("/.well-known/agent-skills/index.json");
  if (!/^sha256:[a-f0-9]{64}$/.test(skills.body.skills?.[0]?.digest ?? "")) fail("agent-skills digest");
});

check("OAuth shim: register → authorize (302 + code) → token", async () => {
  const reg = await getJson("/oauth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_name: "smoke-prod", redirect_uris: ["https://example.com/cb"] }),
  });
  if (!reg.body.client_id) fail(`register: ${preview(reg.body)}`);
  const auth = await get(
    "/oauth/authorize?client_id=smoke&redirect_uri=https%3A%2F%2Fexample.com%2Fcb&response_type=code&code_challenge=abc&code_challenge_method=S256&state=xyz",
    { redirect: "manual" },
  );
  const location = auth.headers.get("location") ?? "";
  if (auth.status !== 302 || !location.includes("code=") || !location.includes("state=xyz")) {
    fail(`authorize: ${auth.status} → ${location || "(no location)"}`);
  }
  const token = await getJson("/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "grant_type=authorization_code&code=smoke&code_verifier=abc",
  });
  if (!token.body.access_token) fail(`token: ${preview(token.body)}`);
});

// -------------------------------------------------------- aeo + url policy

check("curl user-agent on / gets the terminal resume", async () => {
  const res = await fetch(`${ORIGIN}/`, { headers: { "user-agent": "curl/8.4.0" } });
  const text = await res.text();
  if (!text.includes("terminal resume")) fail(`got ${res.headers.get("content-type")}, first bytes: ${text.slice(0, 60)}`);
});

check("browsers still get HTML on / after a curl hit", async () => {
  const res = await get("/");
  const text = await res.text();
  if (!text.startsWith("<!DOCTYPE html>")) fail(`got: ${text.slice(0, 60)}`);
});

check("trailing slash 308s and preserves the query", async () => {
  const res = await get("/about/?x=1", { redirect: "manual" });
  const location = res.headers.get("location") ?? "";
  if (res.status !== 308 || !location.endsWith("/about?x=1")) fail(`got ${res.status} → ${location || "(none)"}`);
});

check("sitemap only advertises canonical (no-slash) URLs", async () => {
  const res = await get("/sitemap-0.xml");
  const xml = await res.text();
  const slashed = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1])
    .filter((loc) => loc.endsWith("/") && new URL(loc).pathname !== "/");
  if (slashed.length > 0) fail(`${slashed.length} slashed URLs, e.g. ${slashed[0]}`);
});

check("RSS item links follow the no-slash policy", async () => {
  for (const feed of ["/rss.xml", "/rss-pt.xml"]) {
    const xml = await (await get(feed)).text();
    const slashed = [...xml.matchAll(/<link>([^<]+)<\/link>/g)]
      .map((match) => match[1])
      .filter((link) => link.endsWith("/") && new URL(link).pathname !== "/");
    if (slashed.length > 0) fail(`${feed}: ${slashed.length} slashed links, e.g. ${slashed[0]}`);
  }
});

check("AEO surfaces answer with their content types", async () => {
  const surfaces = [
    ["/llms.txt", "text/plain"],
    ["/llms-full.txt", "text/plain"],
    ["/ai-index.json", "application/json"],
    ["/docs.json", "application/json"],
    ["/openapi.json", "application/json"],
    ["/robots.txt", "text/plain"],
    ["/cv.pdf", "application/pdf"],
    ["/connect.md", "text/markdown"],
    ["/blog/evals-are-the-product.md", "text/markdown"],
  ];
  for (const [path, type] of surfaces) {
    const res = await get(path);
    const contentType = res.headers.get("content-type") ?? "";
    if (res.status !== 200 || !contentType.includes(type)) fail(`${path}: ${res.status} ${contentType}`);
  }
});

check("unknown pages answer a real 404", async () => {
  const res = await get("/pagina-que-nao-existe");
  if (res.status !== 404) fail(`got ${res.status}`);
});

check("/pt serves 200 at the canonical form", async () => {
  const res = await get("/pt");
  if (res.status !== 200) fail(`got ${res.status}`);
});

// ------------------------------------------------------- observability

check("GET /api/views reads a real post counter (no write)", async () => {
  const { res, body } = await getJson("/api/views?slug=evals-are-the-product");
  if (res.status !== 200 || typeof body.views !== "number") fail(`${res.status} ${preview(body)}`);
});

check("GET /api/stats aggregates the observability tables", async () => {
  const { res, body } = await getJson("/api/stats");
  if (res.status !== 200 || typeof body.views_total !== "number" || typeof body.mcp_events_total !== "number") {
    fail(`${res.status} ${preview(body)}`);
  }
});

// ------------------------------------------------------------------- run

let failed = 0;
for (const { name, fn } of checks) {
  try {
    await fn();
    console.log(`  ok    ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  FAIL  ${name} — ${error.message}`);
  }
}

console.log(failed === 0 ? `\nsmoke-prod: ${checks.length}/${checks.length} green (${ORIGIN})` : `\nsmoke-prod: ${failed} failing (${ORIGIN})`);
if (failed > 0) process.exit(1);
