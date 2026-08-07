/**
 * Live stat fetchers shared by HeroLiveStats and StatsGrid.
 * Every fetch fails soft (null) — callers keep their hardcoded fallback.
 */

const GH_USER = "rubenmarcus";
const GH_ORGS = ["multivmlabs", "BitteProtocol", "Mintbase"];

async function paginateRepos(url: string): Promise<any[]> {
  const out: any[] = [];
  let page = 1;
  while (page < 4) {
    const res = await fetch(`${url}?per_page=100&page=${page}`);
    if (!res.ok) break;
    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) break;
    out.push(...arr);
    if (arr.length < 100) break;
    page++;
  }
  return out;
}

/** Total stargazers across the user's repos and the orgs below. */
export async function fetchGithubStars(): Promise<number | null> {
  try {
    const sources = [
      `https://api.github.com/users/${GH_USER}/repos`,
      ...GH_ORGS.map((o) => `https://api.github.com/orgs/${o}/repos`),
    ];
    const results = await Promise.allSettled(sources.map(paginateRepos));
    let total = 0;
    let ok = false;
    for (const r of results) {
      if (r.status === "fulfilled") {
        ok = true;
        for (const repo of r.value) total += repo?.stargazers_count ?? 0;
      }
    }
    return ok ? total : null;
  } catch {
    return null;
  }
}

/** Total all-time npm downloads across the given packages. */
export async function fetchNpmDownloads(packages: string[]): Promise<number | null> {
  try {
    const results = await Promise.allSettled(
      packages.map((p) =>
        fetch(
          `https://api.npmjs.org/downloads/range/2015-01-01:2030-01-01/${encodeURIComponent(p)}`,
        ).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))),
      ),
    );
    let total = 0;
    let ok = false;
    for (const r of results) {
      if (r.status === "fulfilled" && Array.isArray(r.value?.downloads)) {
        ok = true;
        for (const d of r.value.downloads) total += d?.downloads ?? 0;
      }
    }
    return ok ? total : null;
  } catch {
    return null;
  }
}
