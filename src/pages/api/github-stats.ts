import type { APIRoute } from "astro"
import { site } from "../../config/site"
import { fetchGitHubStats, type GitHubStats } from "../../lib/githubStats"

export const prerender = false

const CACHE_MS = 5 * 60 * 1000
const RESPONSE_CACHE =
  "public, s-maxage=300, stale-while-revalidate=600, max-age=60"

let memoryCache: { data: GitHubStats; at: number } | null = null

export const GET: APIRoute = async () => {
  const now = Date.now()
  if (memoryCache && now - memoryCache.at < CACHE_MS) {
    return Response.json(memoryCache.data, {
      headers: { "Cache-Control": RESPONSE_CACHE },
    })
  }

  const token = import.meta.env.GITHUB_TOKEN

  try {
    const data = await fetchGitHubStats(site.githubUser, token)
    memoryCache = { data, at: now }
    return Response.json(data, {
      headers: { "Cache-Control": RESPONSE_CACHE },
    })
  } catch {
    if (memoryCache) {
      return Response.json(memoryCache.data, {
        headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
      })
    }
    return Response.json({ error: "unavailable" }, { status: 503 })
  }
}
