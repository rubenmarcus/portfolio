/**
 * POST /api/hire — the agent-facing hiring endpoint.
 *
 * AI agents (ChatGPT, Claude, Kimi, custom harnesses) can book a project
 * intro on a user's behalf. Accepts JSON, forwards to formsubmit.co
 * server-side, answers JSON. The widget on / and /contact documents it
 * as an AGENTS.md snippet.
 *
 * Not prerendered — runs as a Vercel function (see astro.config.mjs).
 */
export const prerender = false;

import type { APIRoute } from "astro";

const EMAIL = "ruben@rubenmarcus.dev";
const MAX = { name: 120, contact: 160, brief: 4000, budget: 120, agent: 80 };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      // Never cached: a CDN-cached POST response would replay one
      // submission's answer (or error) to every other agent.
      "cache-control": "no-store",
      // Open CORS — this endpoint is meant to be called by agents anywhere.
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });

export const OPTIONS: APIRoute = () => json({}, 204);

export const POST: APIRoute = async ({ request }) => {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: "expected JSON body" }, 400);
  }

  const name = String(data.name ?? "").trim();
  const contact = String(data.contact ?? "").trim();
  const brief = String(data.brief ?? "").trim();
  const budget = String(data.budget ?? "").trim();
  const agent = String(data.agent ?? "unknown").trim();
  // Honeypot — agents filling a hidden "website" field get a fake success.
  if (data.website) return json({ ok: true });

  if (!name || !contact || !brief) {
    return json({ ok: false, error: "name, contact and brief are required" }, 400);
  }
  for (const [k, v] of Object.entries({ name, contact, brief, budget, agent })) {
    if (v.length > MAX[k as keyof typeof MAX]) {
      return json({ ok: false, error: `${k} too long` }, 400);
    }
  }

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${EMAIL}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        _subject: `[agent hire] ${name} via ${agent}`,
        name,
        contact,
        brief,
        budget: budget || "not specified",
        agent,
        source: "api/hire",
      }),
    });
    if (!res.ok) return json({ ok: false, error: "mail relay failed" }, 502);
    return json({ ok: true, message: "Brief received. Ruben replies within a day or two." });
  } catch {
    return json({ ok: false, error: "mail relay unreachable" }, 502);
  }
};
