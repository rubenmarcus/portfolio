# auth.md — rubenmarcus.dev

## Authentication status

The portfolio MCP server at `https://rubenmarcus.dev/api/mcp` and the public resume endpoints do not require authentication. Do not send credentials unless a client requires the optional OAuth compatibility flow described below.

## OAuth compatibility flow

Some MCP clients require OAuth discovery even for a public server. Those clients can discover metadata at `/.well-known/oauth-authorization-server`, dynamically register at `/oauth/register`, and use the authorization-code flow with PKCE through `/oauth/authorize` and `/oauth/token`.

Tokens issued by this compatibility flow do not grant additional access and are not identity assertions. There are no user accounts, protected scopes, or agent identity claim/revocation endpoints on this site.

## Machine-readable resources

- Protected Resource Metadata: `https://rubenmarcus.dev/.well-known/oauth-protected-resource`
- Authorization Server Metadata: `https://rubenmarcus.dev/.well-known/oauth-authorization-server`
- MCP Server Card: `https://rubenmarcus.dev/.well-known/mcp/server-card.json`
- Contact: `https://linkedin.com/in/rubenmarcus`
