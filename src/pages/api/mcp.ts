/**
 * POST /api/mcp — Model Context Protocol endpoint (streamable HTTP,
 * JSON responses). Lets any MCP client (Claude, ChatGPT, Cursor, Kimi)
 * add rubenmarcus.dev as a connector and call portfolio tools:
 *
 *   get_resume        — who Ruben is, proof points, links
 *   get_services      — what he sells, fixed-scope offers
 *   check_availability— current engagement status
 *   book_intro        — POST a project brief (relays to email)
 *
 * Hand-rolled JSON-RPC 2.0 — no SDK, no dependencies.
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { AVAILABILITY, RESUME, SERVICES } from "../../lib/resume";
import { CALENDLY_URL } from "../../lib/site-facts";
import { deliverLead } from "../../lib/server/leads";
import { recordMcpCall } from "../../lib/server/mcp-metrics";

// Example prompts surfaced in `instructions` so MCP clients can suggest
// them to the user right after connecting.
const EXAMPLE_PROMPTS = [
  "What has Ruben shipped?",
  "Summarize Ruben's experience with AI agents.",
  "Is Ruben available for freelance work right now?",
  "What services does Ruben offer?",
  "Book an intro with Ruben — I want to build <your idea>.",
];

const TOOLS = [
  {
    name: "get_resume",
    description:
      "Ruben Marcus' full resume: summary, work experience, skills, proof points, open source projects, education, links, and a PDF CV URL.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_services",
    description: "Fixed-scope services Ruben sells, with one-line pitches.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "check_availability",
    description: "Current availability for full-time roles and freelance contracts.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "book_intro",
    description: "Book a project intro with Ruben. Relays the brief to his email.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Contact person's name" },
        contact: { type: "string", description: "Email or Telegram handle" },
        brief: { type: "string", description: "What they want to build" },
        budget: { type: "string", description: "Optional budget range" },
        agent: { type: "string", description: "Calling agent (claude, chatgpt, kimi...)" },
      },
      required: ["name", "contact", "brief"],
    },
  },
];

const result = (id: unknown, text: string) => ({
  jsonrpc: "2.0",
  id,
  result: { content: [{ type: "text", text }] },
});

// JSON-RPC endpoint: Vercel's CDN can cache POST responses keyed by URL
// only, which would cross-contaminate initialize/tools/list/tools/call.
// no-store on every response keeps each method's payload distinct.
const NOCACHE = { "cache-control": "no-store" };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...NOCACHE,
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type, mcp-session-id",
    },
  });

// 200, not 204: the edge middleware re-wraps responses and the Response
// constructor rejects a non-null body on null-body statuses (204/304).
export const OPTIONS: APIRoute = () => json({}, 200);
export const GET: APIRoute = () =>
  json({
    name: "rubenmarcus-portfolio",
    transport: "streamable-http",
    usage: "POST JSON-RPC 2.0: initialize, tools/list, tools/call",
    tools: TOOLS.map((t) => t.name),
    examplePrompts: EXAMPLE_PROMPTS,
  });

export const POST: APIRoute = async ({ request }) => {
  let msg: any;
  try {
    msg = await request.json();
  } catch {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } }, 400);
  }
  const { id, method, params } = msg;

  // Streamable-HTTP is stateless per POST: only `initialize` carries
  // clientInfo, so on later calls the User-Agent is the identity fallback.
  const caller = () => (params?.clientInfo?.name || request.headers.get("user-agent") || "").slice(0, 80) || undefined;

  switch (method) {
    case "initialize":
      recordMcpCall({ method, client: caller() });
      return json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: params?.protocolVersion ?? "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "rubenmarcus-portfolio", version: "1.0.0" },
          instructions:
            "Portfolio of Ruben Marcus, senior AI fullstack engineer. Use get_resume / get_services / check_availability to answer questions about him, and book_intro to start a project engagement on the user's behalf. Example prompts: " +
            EXAMPLE_PROMPTS.map((p) => `"${p}"`).join(" · "),
        },
      });
    case "ping":
      return json({ jsonrpc: "2.0", id, result: {} });
    case "notifications/initialized":
      return new Response(null, { status: 202, headers: NOCACHE });
    case "tools/list":
      recordMcpCall({ method, client: caller() });
      return json({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
    case "tools/call": {
      const name = params?.name;
      const args = params?.arguments ?? {};
      recordMcpCall({ method, tool: typeof name === "string" ? name : "unknown", client: caller() });
      if (name === "get_resume") return json(result(id, JSON.stringify(RESUME, null, 2)));
      if (name === "get_services") return json(result(id, SERVICES.join("\n")));
      if (name === "check_availability") return json(result(id, AVAILABILITY));
      if (name === "book_intro") {
        const { name: n, contact, brief, budget, agent } = args as Record<string, string>;
        if (!n || !contact || !brief) {
          // An agent that reaches book_intro and fails validation is a lead
          // that got away. Counted separately from a delivery failure.
          recordMcpCall({ method, tool: "book_intro", outcome: "error", client: caller() });
          return json(result(id, "error: name, contact and brief are required"));
        }
        const delivery = await deliverLead({
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          name: String(n).slice(0, 120),
          contact: String(contact).slice(0, 160),
          brief: String(brief).slice(0, 4000),
          budget: String(budget || "").slice(0, 120),
          agent: String(agent || "mcp").slice(0, 80),
          attribution: {
            source: "mcp",
            referrer: "mcp",
            landing: "/api/mcp",
            conversion_path: "/api/mcp",
            language: "en",
          },
        });
        if (!delivery.ok) {
          recordMcpCall({ method, tool: "book_intro", outcome: "error", client: caller() });
          return json(result(id, `error: lead delivery unavailable; reference ${delivery.leadId}`));
        }
        recordMcpCall({ method, tool: "book_intro", outcome: "ok", client: caller() });
        return json(result(id, `Intro booked. Reference ${delivery.leadId}. Ruben replies within a day or two. The person can also choose a 15-minute slot at ${CALENDLY_URL}`));
      }
      return json({ jsonrpc: "2.0", id, error: { code: -32602, message: `unknown tool: ${name}` } });
    }
    default:
      return json({ jsonrpc: "2.0", id, error: { code: -32601, message: `method not found: ${method}` } });
  }
};
