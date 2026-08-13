import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { MARKDOWN_HEADERS, blogPostMarkdown } from "../../lib/markdown-doc";

export const prerender = true;

// Mirrors [...slug].astro: the English public slug *is* the collection id.
export async function getStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

export const GET: APIRoute = ({ props }) =>
  new Response(blogPostMarkdown(props.post, "en"), { headers: MARKDOWN_HEADERS });
