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
import { deliverLead } from "../../lib/server/leads";

const MAX = { name: 120, contact: 160, brief: 4000, budget: 120, agent: 80 };
const ATTRIBUTION_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "referrer", "landing", "offer", "language"] as const;

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

// 200, not 204: the edge middleware re-wraps responses and the Response
// constructor rejects a non-null body on null-body statuses (204/304).
export const OPTIONS: APIRoute = () => json({}, 200);

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

  const rawAttribution = data.attribution && typeof data.attribution === "object"
    ? data.attribution as Record<string, unknown>
    : {};
  const attribution = Object.fromEntries(
    ATTRIBUTION_KEYS.flatMap((key) => {
      const value = String(rawAttribution[key] ?? "").trim().slice(0, 240);
      return value ? [[key, value]] : [];
    }),
  );

  const delivery = await deliverLead({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name,
    contact,
    brief,
    budget,
    agent,
    attribution,
  });
  if (!delivery.ok) return json({ ok: false, error: "lead delivery unavailable", leadId: delivery.leadId }, 502);
  return json({
    ok: true,
    leadId: delivery.leadId,
    message: "Brief received. Ruben replies within a day or two.",
  });
};
