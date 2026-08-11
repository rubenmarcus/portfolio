export const GITHUB_USER = "rubenmarcus";
export const GITHUB_TIME_ZONE = "Europe/Lisbon";

export interface PublicCommit {
  repository: string;
  sha: string;
  message: string;
  authoredAt: string;
  url: string;
}

export interface GithubCommitStats {
  total: number | null;
  month: number | null;
  today: number | null;
  latest: PublicCommit | null;
  generatedAt: string;
}

interface SearchItem {
  sha?: unknown;
  html_url?: unknown;
  repository?: { full_name?: unknown };
  commit?: {
    message?: unknown;
    author?: { date?: unknown };
    committer?: { date?: unknown };
  };
}

interface SearchResponse {
  total_count?: unknown;
  items?: SearchItem[];
}

const lisbonDate = (now: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: GITHUB_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
};

const searchUrl = (query: string) => {
  const url = new URL("https://api.github.com/search/commits");
  url.searchParams.set("q", query);
  url.searchParams.set("sort", "author-date");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", "1");
  return url.href;
};

const search = async (
  query: string,
  fetcher: typeof fetch,
  token?: string,
): Promise<SearchResponse | null> => {
  try {
    const response = await fetcher(searchUrl(query), {
      headers: {
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as SearchResponse;
  } catch {
    return null;
  }
};

const countOf = (response: SearchResponse | null) =>
  typeof response?.total_count === "number" ? response.total_count : null;

const latestOf = (response: SearchResponse | null): PublicCommit | null => {
  const item = response?.items?.[0];
  const repository = item?.repository?.full_name;
  const sha = item?.sha;
  const url = item?.html_url;
  const message = item?.commit?.message;
  const authoredAt = item?.commit?.author?.date ?? item?.commit?.committer?.date;

  if (
    typeof repository !== "string" ||
    typeof sha !== "string" ||
    typeof url !== "string" ||
    !url.startsWith("https://github.com/") ||
    typeof message !== "string" ||
    typeof authoredAt !== "string"
  ) return null;

  return {
    repository,
    sha: sha.slice(0, 7),
    message: message.split("\n").find(Boolean)?.slice(0, 160) ?? "Commit",
    authoredAt,
    url,
  };
};

/** Exact public commits attributed to the GitHub account, not profile contributions. */
export async function fetchGithubCommitStats(
  options: { fetcher?: typeof fetch; now?: Date; token?: string } = {},
): Promise<GithubCommitStats> {
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? new Date();
  const today = lisbonDate(now);
  const monthStart = `${today.slice(0, 7)}-01`;
  const author = `author:${GITHUB_USER}`;

  const [all, month, day] = await Promise.all([
    search(author, fetcher, options.token),
    search(`${author} author-date:>=${monthStart}`, fetcher, options.token),
    search(`${author} author-date:${today}`, fetcher, options.token),
  ]);

  return {
    total: countOf(all),
    month: countOf(month),
    today: countOf(day),
    latest: latestOf(all),
    generatedAt: now.toISOString(),
  };
}
