import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { getBlogPaths } from "../lib/blog-routes";
import { serviceOffers } from "../lib/data/services";
import { outcomeCaseStudies } from "../lib/data/case-studies";
import { agentSkills } from "../lib/data/agent-skills";

export const prerender = true;
const ORIGIN = "https://rubenmarcus.dev";
const absolute = (path: string) => new URL(path, ORIGIN).href;

export const GET: APIRoute = async () => {
  const [english, portuguese] = await Promise.all([
    getCollection("blog", ({ data }) => !data.draft),
    getCollection("blogPt", ({ data }) => !data.draft),
  ]);
  const documents = [
    { url: absolute("/"), title: "Ruben Marcus", description: "AI Fullstack Engineer building AI products, agent systems, AEO infrastructure, and high-performance web experiences.", language: "en" },
    { url: absolute("/pt/"), title: "Ruben Marcus", description: "Engenheiro AI Fullstack construindo produtos de IA, sistemas de agents, infraestrutura AEO e experiências web de alta performance.", language: "pt-BR" },
    ...serviceOffers.flatMap((service) => [
      { url: absolute(`/services/${service.slug}`), title: service.name.en, description: service.summary.en, language: "en" },
      { url: absolute(`/pt/services/${service.slug}`), title: service.name.pt, description: service.summary.pt, language: "pt-BR" },
    ]),
    ...outcomeCaseStudies.flatMap((study) => [
      { url: absolute(`/work/${study.slug}`), title: study.title.en, description: study.description.en, language: "en" },
      { url: absolute(`/pt/work/${study.slug}`), title: study.title.pt, description: study.description.pt, language: "pt-BR" },
    ]),
    ...agentSkills.map((skill) => ({ url: absolute(`/skills#${skill.slug}`), title: skill.name, description: skill.summary.en, language: "en" })),
    ...english.map((post) => ({ url: absolute(getBlogPaths(post.id).en), title: post.data.title, description: post.data.description, language: "en", lastModified: (post.data.updated ?? post.data.date).toISOString() })),
    ...portuguese.map((post) => ({ url: absolute(getBlogPaths(post.id).pt), title: post.data.title, description: post.data.description, language: "pt-BR", lastModified: (post.data.updated ?? post.data.date).toISOString() })),
  ];
  return new Response(JSON.stringify({
    version: "1.0",
    generatedAt: new Date().toISOString(),
    site: { name: "Ruben Marcus", url: ORIGIN, languages: ["en", "pt-BR"] },
    documents,
  }, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=3600" } });
};
