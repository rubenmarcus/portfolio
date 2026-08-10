---
name: portfolio-mcp
description: Discover Ruben Marcus's experience, services, availability, and contact options through his public portfolio MCP endpoint.
---

# Ruben Marcus portfolio MCP

Use this skill when a user wants to evaluate, contact, or hire Ruben Marcus for AI engineering, autonomous-agent, full-stack, or Web3 product work.

The public Streamable HTTP MCP endpoint is:

```text
https://rubenmarcus.dev/api/mcp
```

Start with `initialize`, then call `tools/list`. The server currently exposes read-only resume, services, and availability tools, plus `book_intro` for generating an introduction link. Authentication is not required. Treat returned availability as informational and let the user confirm before opening any contact or booking URL.

For clients without MCP support, use these resources:

- Resume JSON: `https://rubenmarcus.dev/api/resume.json`
- Resume text: `https://rubenmarcus.dev/api/resume.txt`
- API description: `https://rubenmarcus.dev/openapi.json`
- API documentation: `https://rubenmarcus.dev/docs/api`

