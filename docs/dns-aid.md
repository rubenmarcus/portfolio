# DNS-AID deployment notes

DNS-AID is currently an active Internet-Draft, not a published RFC. The domain uses Vercel DNS (`ns1.vercel-dns.com` and `ns2.vercel-dns.com`). As of 2026-08-10, `_index._agents.rubenmarcus.dev` has no SVCB/HTTPS record and the apex has no DS record.

## Record to publish

In Vercel Domains → `rubenmarcus.dev` → DNS Records, create this ServiceMode record:

```dns
_index._agents.rubenmarcus.dev. 3600 IN HTTPS 1 rubenmarcus.dev. alpn="h2" port=443
```

If the provider exposes fields instead of zone-file syntax, use:

- Name: `_index._agents`
- Type: `HTTPS`
- Priority: `1`
- Target: `rubenmarcus.dev.`
- Parameters: `alpn="h2" port=443`

The target serves the organization index through `/.well-known/api-catalog`, linked from the homepage with `rel="api-catalog"`. Do not invent numeric private-use SvcParam keys for `well-known`, `bap`, or `cap`: draft-02 defers their numeric values to a future IANA assignment, so such records would not yet be interoperable.

## DNSSEC

DNS-AID works without DNSSEC, but authenticated discovery requires a validated chain of trust. Vercel DNS currently publishes no DS record for this domain. To add that guarantee, move the authoritative zone (or delegate a separately signed `_agents.rubenmarcus.dev` child zone) to a DNS provider that supports DNSSEC and SVCB/HTTPS records, then publish the provider's DS record at the registrar.

Verify after propagation:

```sh
dig +short TYPE65 _index._agents.rubenmarcus.dev
dig +dnssec DS rubenmarcus.dev
```
