import { site } from "../config/site"

export type GitHubStats = {
  today: number
  month: number
  year: number
  total: number
  lastCommit: { message: string; repo: string; url: string } | null
}

const CONTRIB_API = "https://github-contributions-api.jogruber.de/v4"
const GITHUB_API = "https://api.github.com"

function githubHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": `${site.brand}-portfolio`,
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function fetchLastCommitFromEvents(
  events: unknown,
  username: string,
  token?: string,
): Promise<GitHubStats["lastCommit"]> {
  if (!Array.isArray(events)) return null

  for (const event of events) {
    if (event.type !== "PushEvent" || !event.payload?.head || !event.repo?.name) continue

    const res = await fetch(
      `${GITHUB_API}/repos/${event.repo.name}/commits/${event.payload.head}`,
      { headers: githubHeaders(token) },
    )
    if (!res.ok) continue

    const data = await res.json()
    const message = (data.commit?.message as string | undefined)?.split("\n")[0]?.trim()
    if (!message) continue

    const fullName = event.repo.name as string
    const repo = fullName.replace(`${username}/`, "") || fullName

    return {
      message,
      repo,
      url:
        (data.html_url as string) ||
        `https://github.com/${fullName}/commit/${event.payload.head}`,
    }
  }

  return null
}

export async function fetchGitHubStats(
  username: string,
  token?: string,
): Promise<GitHubStats> {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const ghHeaders = githubHeaders(token)

  const [contribRes, eventsRes, allRes] = await Promise.all([
    fetch(`${CONTRIB_API}/${username}?y=last`),
    fetch(`${GITHUB_API}/users/${username}/events/public?per_page=30`, { headers: ghHeaders }),
    fetch(`${CONTRIB_API}/${username}`),
  ])

  if (!contribRes.ok || !eventsRes.ok || !allRes.ok) {
    throw new Error("github_stats_upstream_failed")
  }

  const [contribData, events, allData] = await Promise.all([
    contribRes.json(),
    eventsRes.json(),
    allRes.json(),
  ])

  const contributions: { date: string; count: number }[] = contribData.contributions || []
  let today = 0
  let month = 0
  let year = 0
  for (const c of contributions) {
    const d = new Date(c.date)
    if (c.date === todayStr) today = c.count
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) month += c.count
    if (d.getFullYear() === currentYear) year += c.count
  }

  const totalByYear: Record<string, number> = allData.total || {}
  const total = Object.values(totalByYear).reduce((sum, n) => sum + n, 0)
  const lastCommit = await fetchLastCommitFromEvents(events, username, token)

  return { today, month, year, total, lastCommit }
}
