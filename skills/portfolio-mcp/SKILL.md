---
name: portfolio-mcp
description: Discover Ruben Marcus's experience, services, availability, and contact options through his public portfolio MCP endpoint.
---

# Ruben Marcus portfolio MCP

Use this skill when a user wants to evaluate, contact, or hire Ruben Marcus for AI products, agent systems, AI-native frontend, or AEO work.

The public Streamable HTTP MCP endpoint is:

```text
https://www.rubenmarcus.dev/api/mcp
```

Start with `initialize`, then call `tools/list`. The server exposes read-only resume, services, and availability tools, plus `book_intro`, which sends a project brief to Ruben. Authentication is not required. Treat returned availability as informational, and require the user's explicit confirmation before calling `book_intro` because it creates an external side effect.

For clients without MCP support, use these resources:

- Resume JSON: `https://www.rubenmarcus.dev/api/resume.json`
- Resume text: `https://www.rubenmarcus.dev/api/resume.txt`
- API description: `https://www.rubenmarcus.dev/openapi.json`
- API documentation: `https://www.rubenmarcus.dev/docs/api`
