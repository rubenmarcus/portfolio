import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { getBlogPaths } from "../lib/blog-routes";

export const prerender = true;

const ORIGIN = "https://www.rubenmarcus.dev";

export const GET: APIRoute = async () => {
  const [english, portuguese] = await Promise.all([
    getCollection("blog", ({ data }) => !data.draft),
    getCollection("blogPt", ({ data }) => !data.draft),
  ]);

  const entries = [
    ...english.map((post) => ({
      id: `en:${post.id}`,
      url: new URL(getBlogPaths(post.id).en, ORIGIN).href,
      title: post.data.title,
      description: post.data.description,
      language: "en",
      datePublished: post.data.date.toISOString(),
      dateModified: (post.data.updated ?? post.data.date).toISOString(),
      keywords: post.data.tags,
      type: "Article",
    })),
    ...portuguese.map((post) => ({
      id: `pt-BR:${post.id}`,
      url: new URL(getBlogPaths(post.id).pt, ORIGIN).href,
      title: post.data.title,
      description: post.data.description,
      language: "pt-BR",
      datePublished: post.data.date.toISOString(),
      dateModified: (post.data.updated ?? post.data.date).toISOString(),
      keywords: post.data.tags,
      type: "Article",
    })),
  ].sort((a, b) => b.dateModified.localeCompare(a.dateModified));

  return new Response(JSON.stringify({
    version: "1.0",
    generatedAt: new Date().toISOString(),
    site: {
      name: "Ruben Marcus",
      url: ORIGIN,
      description: "AI Fullstack Engineer building web products, agent systems, developer tooling, and AEO infrastructure.",
      languages: ["en", "pt-BR"],
    },
    entries,
  }, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
};
