import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { getBlogSlug } from "../../../lib/blog-routes";
import { MARKDOWN_HEADERS, blogPostMarkdown } from "../../../lib/markdown-doc";

export const prerender = true;

// The PT collection id is a translation key, not a URL — the public slug comes
// from PT_BLOG_SLUGS, same as pt/blog/[...slug].astro.
export async function getStaticPaths() {
  const posts = await getCollection("blogPt", ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: getBlogSlug("pt", post.id) },
    props: { post },
  }));
}

export const GET: APIRoute = ({ props }) =>
  new Response(blogPostMarkdown(props.post, "pt"), { headers: MARKDOWN_HEADERS });
