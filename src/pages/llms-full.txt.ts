import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { getBlogPaths } from "../lib/blog-routes";

export const prerender = true;
const ORIGIN = "https://rubenmarcus.dev";

export const GET: APIRoute = async () => {
  const [english, portuguese] = await Promise.all([
    getCollection("blog", ({ data }) => !data.draft),
    getCollection("blogPt", ({ data }) => !data.draft),
  ]);
  const entries = [
    ...english.map((post) => ({ post, language: "en", url: new URL(getBlogPaths(post.id).en, ORIGIN).href })),
    ...portuguese.map((post) => ({ post, language: "pt-BR", url: new URL(getBlogPaths(post.id).pt, ORIGIN).href })),
  ].sort((a, b) => b.post.data.date.getTime() - a.post.data.date.getTime());

  const articles = entries.map(({ post, language, url }) => [
    `# ${post.data.title}`,
    `Source URL: ${url}`,
    `Language: ${language}`,
    `Published: ${post.data.date.toISOString()}`,
    `Description: ${post.data.description}`,
    "",
    post.body ?? "",
  ].join("\n")).join("\n\n---\n\n");

  return new Response([
    "# Ruben Marcus — full article corpus",
    "",
    "> Canonical bilingual technical writing by Ruben Marcus, AI Fullstack Engineer.",
    "> Site index: https://rubenmarcus.dev/llms.txt",
    "> Structured index: https://rubenmarcus.dev/ai-index.json",
    "",
    articles,
    "",
  ].join("\n"), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
};
