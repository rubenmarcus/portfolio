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

function calendarDayKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function calendarYearMonth(date: Date, timeZone: string): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
  }).formatToParts(date)
  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value),
  }
}

function parseContributionDate(date: string): { year: number; month: number } {
  const [year, month] = date.split("-").map(Number)
  return { year, month }
}

function githubHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": `${site.brand}-portfolio`,
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

/** Authenticated `/users/{user}/events` includes private activity for the token owner. */
async function fetchUserEvents(username: string, token?: string): Promise<unknown> {
  const headers = githubHeaders(token)

  if (token) {
    const authed = await fetch(
      `${GITHUB_API}/users/${username}/events?per_page=30`,
      { headers },
    )
    if (authed.ok) return authed.json()
  }

  const pub = await fetch(
    `${GITHUB_API}/users/${username}/events/public?per_page=30`,
    { headers },
  )
  if (!pub.ok) throw new Error("github_events_failed")
  return pub.json()
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
  const timeZone = site.activityTimeZone
  const todayStr = calendarDayKey(now, timeZone)
  const { year: currentYear, month: currentMonth } = calendarYearMonth(now, timeZone)

  const [contribRes, allRes, events] = await Promise.all([
    fetch(`${CONTRIB_API}/${username}?y=last`),
    fetch(`${CONTRIB_API}/${username}`),
    fetchUserEvents(username, token),
  ])

  if (!contribRes.ok || !allRes.ok) {
    throw new Error("github_stats_upstream_failed")
  }

  const [contribData, allData] = await Promise.all([contribRes.json(), allRes.json()])

  const contributions: { date: string; count: number }[] = contribData.contributions || []
  let today = 0
  let month = 0
  let year = 0
  for (const c of contributions) {
    const { year: y, month: m } = parseContributionDate(c.date)
    if (c.date === todayStr) today = c.count
    if (y === currentYear && m === currentMonth) month += c.count
    if (y === currentYear) year += c.count
  }

  const totalByYear: Record<string, number> = allData.total || {}
  const total = Object.values(totalByYear).reduce((sum, n) => sum + n, 0)
  const lastCommit = await fetchLastCommitFromEvents(events, username, token)

  return { today, month, year, total, lastCommit }
}
