import { defineMiddleware } from "astro:middleware"
import { applySecurityHeaders } from "./lib/security/headers"

const LEGAL_PATH =
  /^\/(policy|terms|data-deletion|privacy)\/?$/

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next()
  applySecurityHeaders(response)
  if (LEGAL_PATH.test(context.url.pathname)) {
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Cross-Origin-Resource-Policy", "cross-origin")
    response.headers.delete("X-Frame-Options")
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://vitals.vercel-insights.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors *; upgrade-insecure-requests",
    )
  }
  return response
})
