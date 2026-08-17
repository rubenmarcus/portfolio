/**
 * Blog view counter, server-side. The client (ViewCounter.svelte) only ever
 * talks to this route — Supabase and its keys never reach the browser.
 *
 *   GET  /api/views?slug=<post>   → { slug, views }
 *   GET  /api/views               → { counters: { slug: views } }  (all, cached)
 *   POST /api/views { slug }      → { slug, views }   (increments)
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { sbRpc, sbSelect, supabaseEnabled } from "../../lib/server/supabase";
import { isValidBlogSlug } from "../../lib/server/blog-slugs";

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      ...headers,
    },
  });

export const OPTIONS: APIRoute = () => json({}, 200);

export const GET: APIRoute = async ({ url }) => {
  if (!supabaseEnabled()) return json({ error: "views disabled" }, 503);
  const slug = url.searchParams.get("slug");
  if (slug === null) {
    // Batch mode for index pages: every counter in one round trip, briefly
    // CDN-cached (the middleware fetch is keyed by path+query since 86da782).
    const rows = await sbSelect<{ slug: string; views: number }>("page_views", "select=slug,views");
    const counters = Object.fromEntries(rows.map((row) => [row.slug, row.views]));
    return json({ counters }, 200, { "cache-control": "public, max-age=30, s-maxage=60" });
  }
  if (!(await isValidBlogSlug(slug))) return json({ error: "unknown slug" }, 400);
  const rows = await sbSelect<{ views: number }>("page_views", `slug=eq.${encodeURIComponent(slug)}&select=views`);
  return json({ slug, views: rows[0]?.views ?? 0 });
};

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseEnabled()) return json({ error: "views disabled" }, 503);
  const body = await request.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug : "";
  if (!(await isValidBlogSlug(slug))) return json({ error: "unknown slug" }, 400);
  const views = await sbRpc<number>("increment_view", { page_slug: slug });
  if (typeof views !== "number") return json({ error: "store unavailable" }, 503);
  return json({ slug, views });
};
