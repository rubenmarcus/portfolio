---
title: "This portfolio is agents-welcome. Probably the first."
description: "My site has an AGENTS.md, an MCP server, a hiring API, and a terminal resume. Your agent can read my CV, check my availability, and book an intro. Here is how it works."
date: 2026-08-06
readTime: "7 min"
tags: ["ai", "agents", "mcp", "portfolio"]
cover: "/art/blog/agents-welcome-portfolio.png"
---

Most portfolios are built for humans and accidentally readable by machines. This one is built for both on purpose.

Point your agent at it. Claude, ChatGPT, Kimi, Cursor, your own harness. It can read my resume, list what I sell, check if I am taking projects, and book an intro call without you touching a form. I think this is the first agents-welcome portfolio. If it is not, it is at least the first one that documents it.

## The front door for agents

The site speaks MCP. One endpoint, four tools:

```ts
// POST https://www.rubenmarcus.dev/api/mcp  (JSON-RPC 2.0)
const tools = [
  "get_resume",          // who I am, proof points, links
  "get_services",        // the six fixed-scope offers
  "check_availability",  // current engagement status
  "book_intro",          // posts a brief to my inbox
];
```

In Claude: settings, connectors, add custom connector, paste the URL. In ChatGPT: developer mode, create app, same URL. From then on "look into Ruben Marcus for our landing rebuild" is a real instruction with a real outcome.

The server is a hand-rolled JSON-RPC handler. No SDK, no framework, about 150 lines. MCP over streamable HTTP is just `initialize`, `tools/list`, `tools/call`. The whole point of the protocol is that you do not need much to join it.

## The hiring API

Not everyone wants to configure a connector. So there is a plain endpoint too:

```bash
curl -X POST https://www.rubenmarcus.dev/api/hire \
  -H 'content-type: application/json' \
  -d '{"name":"Ada","contact":"ada@corp.com","brief":"AEO sprint for our docs site","agent":"chatgpt"}'
```

Validation, a honeypot field for spam bots, and a relay to my inbox. That is it. The brief arrives with the calling agent named in the subject line, so I know which model did the shopping.

## The AGENTS.md

The discovery piece. Every coding agent knows what an AGENTS.md is now, so the site ships one as a copy-paste brief on the home page and the contact page. It says who I am, what the API looks like, and what I sell. Paste it into any chat and the agent has everything it needs to act as your proxy.

This matters more than the endpoint. Endpoints without a discovery convention are invisible. AGENTS.md is the convention agents already read.

## curl rubenmarcus.dev

One easter egg. If your user agent is a terminal, the homepage does not return HTML:

```
$ curl rubenmarcus.dev

rubenmarcus.dev // terminal resume

Ruben Marcus — Senior AI Fullstack Engineer
Lisbon, Portugal · remote worldwide · 14 years shipping

proof
  #1 ECDSA.fail ............ multi-agent research harness
  #1 QEC decoder ........... Optimization Arena, 2,642 EPM
  ...
```

The middleware checks the UA and rewrites to `/api/resume.txt`. Browsers get the site, terminals get the resume. There is also `/api/resume.json` for anything that prefers structure over vibes.

## The MCP server is a switch statement

People overestimate what an MCP server is. Mine is a single Vercel function that answers four JSON-RPC methods. This is the whole dispatcher, trimmed:

```ts
// src/pages/api/mcp.ts
export const POST: APIRoute = async ({ request }) => {
  const { id, method, params } = await request.json();

  switch (method) {
    case "initialize":
      return json({
        jsonrpc: "2.0", id,
        result: {
          protocolVersion: params?.protocolVersion ?? "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "rubenmarcus-portfolio", version: "1.0.0" },
        },
      });
    case "tools/list":
      return json({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
    case "tools/call":
      return dispatch(params?.name, params?.arguments, id);
    default:
      return json({ jsonrpc: "2.0", id,
        error: { code: -32601, message: `method not found: ${method}` } });
  }
};
```

Each tool is a static description plus one handler. `get_resume` returns a JSON document. `check_availability` returns a paragraph. The only one with side effects is `book_intro`, which validates three fields and relays to my inbox through formsubmit. No database, no sessions, no auth. The protocol's `initialize` handshake carries an `instructions` field that tells the calling model how to behave, and that one string does more work than the rest of the file.

One detail worth copying: answer GET with a self-describing document. When someone points a browser or a confused agent at the URL, they get the tool list and the expected methods instead of a 405.

## The hiring API has a trapdoor

`POST /api/hire` takes `{name, contact, brief, budget?, agent?}`. The interesting parts are defensive:

```ts
// honeypot: agents filling a hidden "website" field get a fake success
if (data.website) return json({ ok: true });

if (!name || !contact || !brief) {
  return json({ ok: false, error: "name, contact and brief are required" }, 400);
}
for (const [k, v] of Object.entries({ name, contact, brief, budget, agent })) {
  if (v.length > MAX[k]) return json({ ok: false, error: `${k} too long` }, 400);
}
```

The honeypot field is invisible to humans and irresistible to form-scraping bots. They get a 200 and a smile, I get nothing. Length caps keep a runaway agent from mailing me its entire context window. The `agent` field exists so the subject line tells me which model made the call: `[agent hire] Ada via claude`.

## Discovery beats endpoints

An endpoint nobody can find is a rumor. Three discovery layers, cheapest first:

`AGENTS.md` as a copy-paste brief on the home and contact pages. Coding agents already read AGENTS.md on instinct, so the convention cost is zero.

`llms.txt` at the root, which I generate with my own aeo.js at build time. The same file I tell clients to ship, pointed at me.

`/api/resume.json`, a machine-readable CV for anything that wants structure without the MCP handshake.

The middleware for the curl easter egg is ten lines: match `curl|wget|httpie` in the user agent on page routes, rewrite to the text resume. One honest caveat from building this: on static Astro the middleware only sees real headers when it runs at the edge, so it ships as Vercel edge middleware (`edgeMiddleware: true`) and was verified against the deployed site, not localhost.

## What it costs and what breaks

Running cost is zero. Three small functions on Vercel's free tier behind a static site. The failure modes I actually hit: bots hammering the endpoint with junk (honeypot catches most), agents that POST form-encoded instead of JSON (returns a 400 with a readable error, they retry correctly), and models that invent a sixth tool. The `tools/list` response is the contract, and well-behaved clients read it.

What I would add next: request signing if the volume ever justifies it, a `book_intro` rate limit per contact address, and an analytics counter for which agents call which tool. Not before there is traffic to measure.

## Why bother

Two reasons. The honest one first: I build agent systems for a living. A portfolio that agents cannot operate would be a bit like a chef with a dirty kitchen. The site is my proof of work, so it should behave like my work.

The second is a bet. A growing share of "go look at this person" will be delegated to agents. When someone asks their agent to find an engineer for an AEO sprint, the sites that answer in structured, agent-readable ways get found. Everyone else is a wall of HTML. I wrote about the measurement side of this in [what AEO actually moves](/blog/aeo-what-it-moves). This post is the same idea pointed at myself.

The whole stack is a static Astro site plus three small serverless functions. The fun part was never the plumbing. It is deciding what your site should say when the visitor is not a person.
