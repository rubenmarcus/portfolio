import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { buildSecurityHeaderEntries } from "../src/lib/security/siteSecurityHeaders.mjs"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const vercelPath = join(root, "vercel.json")

const vercel = JSON.parse(readFileSync(vercelPath, "utf8"))
const securityHeaders = buildSecurityHeaderEntries(false)

const globalRule = {
  source: "/(.*)",
  headers: securityHeaders,
}

const apiRule = {
  source: "/api/(.*)",
  headers: [
    { key: "Cache-Control", value: "no-store" },
    { key: "X-Robots-Tag", value: "noindex, nofollow" },
  ],
}

const mapRule = {
  source: "/(.*).map",
  headers: [
    { key: "Cache-Control", value: "no-store" },
    { key: "X-Robots-Tag", value: "noindex, nofollow" },
  ],
}

vercel.headers = [globalRule, mapRule, apiRule]

writeFileSync(vercelPath, `${JSON.stringify(vercel, null, 2)}\n`)
console.log("[sync-vercel-security-headers] updated vercel.json")
