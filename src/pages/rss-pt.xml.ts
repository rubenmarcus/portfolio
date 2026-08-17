import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { getBlogSlug } from "../lib/blog-routes";

export async function GET(context: APIContext) {
  const posts = (await getCollection("blogPt", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );

  return rss({
    // @astrojs/rss defaults its own trailingSlash option to true, ignoring
    // the Astro config — without this, every item link gains a 308 hop.
    trailingSlash: false,
    title: "Ruben Marcus — Blog (PT-BR)",
    description:
      "Artigos técnicos sobre agentes de IA, benchmarks, WebGL e a stack por trás de rubenmarcus.dev.",
    site: context.site ?? "https://www.rubenmarcus.dev",
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/pt/blog/${getBlogSlug("pt", post.id)}`,
      categories: post.data.tags,
    })),
    customData: "<language>pt-br</language>",
  });
}
