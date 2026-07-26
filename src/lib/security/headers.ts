import { site } from "../../config/site"

const IS_DEV = import.meta.env.DEV

/**
 * CSP tuned for this site: self-hosted assets, GitHub stats, YouTube player, Turnstile, Vercel Analytics.
 */
export function contentSecurityPolicy(): string {
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

  if (IS_DEV) {
    scriptSrc.push("'unsafe-eval'")
    connectSrc.push("http://localhost:4321", "http://127.0.0.1:4321", "ws://localhost:4321", "ws://127.0.0.1:4321")
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

export function applySecurityHeaders(response: Response): void {
  const headers = response.headers
  headers.set("Content-Security-Policy", contentSecurityPolicy())
  headers.set("X-Content-Type-Options", "nosniff")
  headers.set("X-Frame-Options", "DENY")
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")
  headers.set("Cross-Origin-Opener-Policy", "same-origin")
  headers.set("Cross-Origin-Resource-Policy", "same-site")
  if (!IS_DEV) {
    headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
  }
  headers.set("X-DNS-Prefetch-Control", "off")
}

export const allowedSiteOrigins = (): string[] => {
  const origins = new Set<string>([site.url.replace(/\/$/, "")])
  if (IS_DEV) {
    origins.add("http://localhost:4321")
    origins.add("http://127.0.0.1:4321")
  }
  return [...origins]
}
