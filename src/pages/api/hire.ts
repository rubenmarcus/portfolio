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
import { CALENDLY_URL } from "../../lib/site-facts";

const MAX = { name: 120, contact: 160, brief: 4000, budget: 120, agent: 80 };
const ATTRIBUTION_KEYS = ["source", "utm_source", "utm_medium", "utm_campaign", "utm_content", "referrer", "landing", "conversion_path", "offer", "language"] as const;

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

// Agents probe an endpoint before they post to it. Without a GET export the
// request fell through to another function and answered 200 with an unrelated
// payload, which reads as "this endpoint is something else". Answer with the
// contract instead of a 405, so a probe is self-documenting.
export const GET: APIRoute = () =>
  json({
    endpoint: "https://www.rubenmarcus.dev/api/hire",
    method: "POST",
    contentType: "application/json",
    description:
      "Book a project intro with Ruben Marcus, AI Fullstack Engineer. Send only after the person you are acting for has explicitly confirmed: this delivers a real message.",
    required: {
      name: "Contact person's name",
      contact: "Email or Telegram handle to reply to",
      brief: "What they want to build",
    },
    optional: {
      budget: "Budget range",
      agent: "Calling agent: chatgpt | claude | kimi | other",
    },
    example: {
      name: "Ada Lovelace",
      contact: "ada@example.com",
      brief: "An agent that triages our support inbox and drafts replies.",
      budget: "EUR 5-8k",
      agent: "claude",
    },
    responses: {
      "200": '{ "ok": true, "leadId": "...", "message": "..." }',
      "400": "name, contact and brief are required, or a field exceeded its limit",
      "502": "lead delivery unavailable; leadId is still returned",
    },
    alternatives: {
      mcp: "https://www.rubenmarcus.dev/api/mcp",
      serverCard: "https://www.rubenmarcus.dev/.well-known/mcp/server.json",
      humanPage: "https://www.rubenmarcus.dev/contact",
      calendar: CALENDLY_URL,
    },
  });

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
    calendar: CALENDLY_URL,
  });
};
