import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { allowedSiteOrigins } from "./headers"

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

let contactRateLimit: Ratelimit | null | undefined

function getContactRateLimit(): Ratelimit | null {
  if (contactRateLimit !== undefined) return contactRateLimit

  const url = import.meta.env.UPSTASH_REDIS_REST_URL
  const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    contactRateLimit = null
    return null
  }

  const redis = new Redis({ url, token })
  contactRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(8, "1 h"),
    prefix: "portfolio:contact",
    analytics: true,
  })
  return contactRateLimit
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  return request.headers.get("x-real-ip") ?? "unknown"
}

export function isAllowedContactOrigin(request: Request): boolean {
  const allowed = allowedSiteOrigins()
  const origin = request.headers.get("origin")
  if (origin && allowed.includes(origin)) return true

  const referer = request.headers.get("referer")
  if (referer) {
    return allowed.some((base) => referer === base || referer.startsWith(`${base}/`))
  }

  return import.meta.env.DEV
}

export async function enforceContactRateLimit(request: Request): Promise<Response | null> {
  const limiter = getContactRateLimit()
  if (!limiter) return null

  const ip = getClientIp(request)
  const { success, limit, remaining, reset } = await limiter.limit(ip)

  if (success) return null

  return Response.json(
    { error: "rate_limited" },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil((reset - Date.now()) / 1000))),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
      },
    },
  )
}

export async function verifyTurnstileToken(
  token: string,
  remoteIp: string,
): Promise<boolean> {
  const secret = import.meta.env.TURNSTILE_SECRET_KEY
  if (!secret) return true

  if (!token) return false

  const body = new URLSearchParams()
  body.set("secret", secret)
  body.set("response", token)
  if (remoteIp !== "unknown") body.set("remoteip", remoteIp)

  const res = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })

  if (!res.ok) return false
  const data = (await res.json()) as { success?: boolean }
  return data.success === true
}

export function turnstileRequired(): boolean {
  return Boolean(import.meta.env.TURNSTILE_SECRET_KEY)
}

export const MAX_CONTACT_JSON_BYTES = 600_000

export async function readContactJsonBody(request: Request): Promise<unknown | Response> {
  const length = request.headers.get("content-length")
  if (length) {
    const n = Number(length)
    if (Number.isFinite(n) && n > MAX_CONTACT_JSON_BYTES) {
      return Response.json({ error: "payload_too_large" }, { status: 413 })
    }
  }

  const raw = await request.text()
  if (raw.length > MAX_CONTACT_JSON_BYTES) {
    return Response.json({ error: "payload_too_large" }, { status: 413 })
  }

  try {
    return JSON.parse(raw) as unknown
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 })
  }
}
