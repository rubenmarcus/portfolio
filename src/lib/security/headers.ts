import { site } from "../../config/site"
import {
  buildContentSecurityPolicy,
  buildSecurityHeaderEntries,
} from "./siteSecurityHeaders.mjs"

const IS_DEV = import.meta.env.DEV

export function contentSecurityPolicy(): string {
  return buildContentSecurityPolicy(IS_DEV)
}

export function applySecurityHeaders(response: Response): void {
  for (const { key, value } of buildSecurityHeaderEntries(IS_DEV)) {
    response.headers.set(key, value)
  }
}

export const allowedSiteOrigins = (): string[] => {
  const origins = new Set<string>([site.url.replace(/\/$/, "")])
  origins.add("https://www.jseramn.tech")
  if (IS_DEV) {
    origins.add("http://localhost:4321")
    origins.add("http://127.0.0.1:4321")
  }
  return [...origins]
}
