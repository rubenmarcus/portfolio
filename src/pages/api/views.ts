/**
 * Blog view counter, server-side. The client (ViewCounter.svelte) only ever
 * talks to this route — Supabase and its keys never reach the browser.
 *
 *   GET  /api/views?slug=<post>   → { slug, views }
 *   POST /api/views { slug }      → { slug, views }   (increments)
 */
export const prerender = false;

import type { APIRoute } from "astro";
import { sbRpc, sbSelect, supabaseEnabled } from "../../lib/server/supabase";
import { isValidBlogSlug } from "../../lib/server/blog-slugs";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });

export const OPTIONS: APIRoute = () => json({}, 200);

export const GET: APIRoute = async ({ url }) => {
  if (!supabaseEnabled()) return json({ error: "views disabled" }, 503);
  const slug = url.searchParams.get("slug") ?? "";
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
