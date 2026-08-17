/**
 * Production smoke test — asserts the deployed site against the contracts
 * the repo promises. The vitest suite pins these in-process; this pins the
 * real deployment (routing, edge middleware, CDN cache), where they have
 * silently diverged before: on 2026-08-17 every GET /api/* returned the
 * github-stats payload because the edge middleware's internal fetch was
 * cached under the constant /_render URL.
 *
 *   pnpm smoke:prod            # against https://www.rubenmarcus.dev
 *   SMOKE_ORIGIN=... pnpm smoke:prod
 */
const ORIGIN = process.env.SMOKE_ORIGIN ?? "https://www.rubenmarcus.dev";
const BROWSER_UA = "Mozilla/5.0 (smoke-prod)";

const checks = [];
const check = (name, fn) => checks.push({ name, fn });

const getJson = async (path, init = {}) => {
  const res = await fetch(`${ORIGIN}${path}`, { headers: { "user-agent": BROWSER_UA }, ...init });
  return { res, body: await res.json() };
};

check("GET /api/resume.json is the resume, not github-stats", async () => {
  const { body } = await getJson("/api/resume.json");
  if (body.name !== "Ruben Marcus") throw new Error(`unexpected payload: ${JSON.stringify(body).slice(0, 120)}`);
});

check("GET /api/health answers its own contract", async () => {
  const { body } = await getJson("/api/health");
  if (body.service !== "rubenmarcus-portfolio-api") throw new Error(`unexpected payload: ${JSON.stringify(body).slice(0, 120)}`);
});

check("GET /api/hire describes the hire contract", async () => {
  const { body } = await getJson("/api/hire");
  if (!String(body.endpoint ?? "").includes("/api/hire")) throw new Error(`unexpected payload: ${JSON.stringify(body).slice(0, 120)}`);
});

check("GET /api/github-stats.json still serves stats", async () => {
  const { body } = await getJson("/api/github-stats.json");
  if (typeof body.total !== "number") throw new Error(`unexpected payload: ${JSON.stringify(body).slice(0, 120)}`);
});

check("POST /api/mcp tools/list exposes the 4 tools", async () => {
  const { body } = await getJson("/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": BROWSER_UA },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  });
  const tools = body.result?.tools ?? [];
  if (tools.length < 4) throw new Error(`expected >=4 tools, got ${tools.length}`);
});

check("curl user-agent on / gets the terminal resume", async () => {
  const res = await fetch(`${ORIGIN}/`, { headers: { "user-agent": "curl/8.4.0" } });
  const text = await res.text();
  if (!text.includes("terminal resume")) throw new Error(`got ${res.headers.get("content-type")}, first bytes: ${text.slice(0, 60)}`);
});

check("trailing slash 308s to the canonical form", async () => {
  const res = await fetch(`${ORIGIN}/about/`, { headers: { "user-agent": BROWSER_UA }, redirect: "manual" });
  const location = res.headers.get("location") ?? "";
  if (res.status !== 308 || !location.endsWith("/about")) throw new Error(`got ${res.status} → ${location || "(none)"}`);
});

check("sitemap only advertises canonical (no-slash) URLs", async () => {
  const res = await fetch(`${ORIGIN}/sitemap-0.xml`, { headers: { "user-agent": BROWSER_UA } });
  const xml = await res.text();
  const slashed = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1])
    .filter((loc) => loc.endsWith("/") && new URL(loc).pathname !== "/");
  if (slashed.length > 0) throw new Error(`${slashed.length} slashed URLs, e.g. ${slashed[0]}`);
});

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
