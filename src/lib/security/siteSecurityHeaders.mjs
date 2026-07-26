/** Shared security header values — imported by Astro middleware and synced into vercel.json at build. */
const SITE_ORIGIN = "https://jseramn.tech"

export function buildContentSecurityPolicy(isDev) {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "https://www.youtube.com",
    "https://challenges.cloudflare.com",
    "https://va.vercel-scripts.com",
  ]

  const connectSrc = [
    "'self'",
    "https://api.github.com",
    "https://github-contributions-api.jogruber.de",
    "https://www.youtube.com",
    "https://challenges.cloudflare.com",
    "https://vitals.vercel-insights.com",
  ]

  if (isDev) {
    scriptSrc.push("'unsafe-eval'")
    connectSrc.push(
      "http://localhost:4321",
      "http://127.0.0.1:4321",
      "ws://localhost:4321",
      "ws://127.0.0.1:4321",
    )
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    `connect-src ${connectSrc.join(" ")}`,
    "frame-src https://www.youtube.com https://challenges.cloudflare.com",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ]

  return directives.join("; ")
}

/** Header entries for Vercel `vercel.json` and Astro middleware. */
export function buildSecurityHeaderEntries(isDev) {
  const entries = [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(isDev) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-site" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
  ]

  if (!isDev) {
    entries.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    })
    // Override Vercel default ACAO:* on static assets (M-5)
    entries.push({ key: "Access-Control-Allow-Origin", value: SITE_ORIGIN })
  }

  return entries
}
