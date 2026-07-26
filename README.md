# jseramn.tech

Personal portfolio for **José Ramón García Del Risco** ([jseramn](https://github.com/jseramn)) — Vesper terminal aesthetic, video hero, encrypted contact, and live GitHub presence.

**Live:** [jseramn.tech](https://jseramn.tech) · **LLM summary:** [/llms.txt](https://jseramn.tech/llms.txt)

## Stack

| Layer | Tech |
|-------|------|
| Site | [Astro 5](https://astro.build) (static + serverless API on Vercel) |
| UI | [React 19](https://react.dev) islands, [Tailwind CSS](https://tailwindcss.com), [Motion](https://motion.dev) |
| Email | [Resend](https://resend.com) (`POST /api/contact`) |
| Crypto | [age](https://github.com/FiloSottile/age) / [typage](https://github.com/FiloSottile/typage) in the browser |

## Features

- Fullscreen video background (parallax, wheel zoom)
- Rotating roles, marquee (orgs + GitHub commit ticker), YouTube ambient audio
- **Encrypted contact modal** — ciphertext to `contacto@jseramn.tech`; decryption key via X / Instagram DM
- SEO: Open Graph, Twitter Cards, JSON-LD, sitemap, `robots.txt`
- Security headers (CSP, HSTS), optional Turnstile + Upstash rate limits on the contact API

## Getting started

```bash
pnpm install
cp .env.example .env   # local only — never commit .env
pnpm dev
```

Production build:

```bash
pnpm build
pnpm preview
```

Deploy target: **Vercel** (`@astrojs/vercel`). Set environment variables in the Vercel dashboard (see below).

## Project structure

```
src/
  config/site.ts          # Identity, SEO, socials, contact email, crypto links
  components/
    Hero.tsx              # Main island
    ContactModal.tsx      # age encrypt + API send
    TurnstileField.tsx    # Optional bot check
    TextLoop.tsx, InfiniteSlider.tsx, VideoBackground.tsx
  lib/
    contactEncrypt.ts     # Client-side age passphrase encryption
    contactEmail.ts       # Payload validation + email body
    security/             # CSP, origin check, rate limit, Turnstile verify
  middleware.ts           # Security headers on all responses
  pages/
    index.astro
    api/contact.ts        # Resend relay (ciphertext only)
public/
  llms.txt                # Machine-readable site & profile summary
  videobg.webm, videobg.mp4, thumbnail.png, favicons
vercel.json               # API cache / noindex headers
```

Canonical copy and links for humans and SEO live in `src/config/site.ts`.

## Environment variables

Copy `.env.example` to `.env` for local API testing.

| Variable | Required | Purpose |
|----------|----------|---------|
| `RESEND_API_KEY` | Production | Send encrypted contact mail |
| `PUBLIC_TURNSTILE_SITE_KEY` | Recommended | Turnstile widget (client) |
| `TURNSTILE_SECRET_KEY` | Recommended | Turnstile verify (server) |
| `UPSTASH_REDIS_REST_URL` | Optional | Rate limit storage |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Rate limit storage |

Domain `jseramn.tech` must stay verified in Resend for the `from` address in `site.ts`.

## Security

### Contact form threat model

- Plaintext **never** leaves the visitor’s browser; only age armored ciphertext is emailed.
- **Decryption keys** are shown only to the visitor and must be sent via social DM (out of band).
- Server secrets live only in Vercel env vars, not in git.

### Controls

| Control | Location |
|---------|----------|
| CSP, HSTS, COOP, CORP, frame deny | `src/middleware.ts`, `src/lib/security/headers.ts` |
| API `no-store` / noindex | `vercel.json` |
| Same-origin `POST /api/contact` | `src/lib/security/contactApi.ts` |
| Honeypot | `ContactModal.tsx` |
| Turnstile (when env set) | `TurnstileField.tsx`, contact API |
| 8 req/h/IP (when Upstash set) | `@upstash/ratelimit` |
| Payload size cap (~600 KB) | contact API |
| Generic API errors | `src/pages/api/contact.ts` |

### Production checklist

1. Set `RESEND_API_KEY` on Vercel.
2. Configure Turnstile for `jseramn.tech` (`PUBLIC_*` + `TURNSTILE_SECRET_KEY`).
3. (Recommended) Upstash Redis for distributed rate limiting.
4. Enable GitHub secret scanning; never commit `.env` or scratch files with keys.
5. Review Resend bounces / suppressions periodically.

The repo is **public by design**. Security does not rely on hiding client-side encryption; protect **secrets** and **per-message passphrases**.

### Decrypting inbound mail (operator)

Save the armored block from email, then locally:

```bash
age -d -o mensaje.json encrypted.age
# Enter the passphrase from the visitor’s social DM when prompted
```

## License

MIT
