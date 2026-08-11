/** Cached public GitHub activity for the footer. */
export const prerender = false;

import type { APIRoute } from "astro";
import { fetchGithubCommitStats } from "../../lib/github-stats";

export const GET: APIRoute = async () => {
  const stats = await fetchGithubCommitStats({
    token: import.meta.env.GITHUB_TOKEN || undefined,
  });

  return new Response(JSON.stringify(stats), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      "access-control-allow-origin": "*",
    },
  });
};
