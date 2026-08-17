/**
 * Blog likes, server-side (same access model as /api/views).
 *
 *   GET  /api/likes?slug=<post>          → { slug, likes }
 *   POST /api/likes { slug, delta: ±1 }  → { slug, likes }
 *
 * One like per browser is enforced client-side (localStorage) — good enough
 * for a blog. The RPC clamps at zero so unlikes can never go negative.
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
  if (!supabaseEnabled()) return json({ error: "likes disabled" }, 503);
  const slug = url.searchParams.get("slug") ?? "";
  if (!(await isValidBlogSlug(slug))) return json({ error: "unknown slug" }, 400);
  const rows = await sbSelect<{ likes: number }>("post_likes", `slug=eq.${encodeURIComponent(slug)}&select=likes`);
  return json({ slug, likes: rows[0]?.likes ?? 0 });
};

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseEnabled()) return json({ error: "likes disabled" }, 503);
  const body = await request.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug : "";
  if (!(await isValidBlogSlug(slug))) return json({ error: "unknown slug" }, 400);
  const delta = body?.delta === -1 ? -1 : 1;
  const likes = await sbRpc<number>("increment_like", { page_slug: slug, delta });
  if (typeof likes !== "number") return json({ error: "store unavailable" }, 503);
  return json({ slug, likes });
};
