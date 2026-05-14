export interface Article {
  title: string;
  url: string;
  date: string;
  readTime: string;
  description: string;
  tags: string[];
  reactions?: number;
  source: "dev.to" | "external";
}

export const articles: Article[] = [
  {
    title: "Automating entire workflows with ralph-starter",
    url: "https://dev.to/rubenmarcus/automating-entire-workflows-with-ralph-starter-43gc",
    date: "2026-02-19",
    readTime: "8 min",
    description:
      "Walkthrough of chaining autonomous AI coding loops across full development workflows — from spec to PR with no human turn in the middle.",
    tags: ["ralphwiggum", "ai", "automation", "opensource"],
    source: "dev.to",
  },
  {
    title: "Getting started with Next.js + Strapi: Security first",
    url: "https://dev.to/rubenmarcus/getting-started-with-next-js-strapi-security-first-3380",
    date: "2021-05-16",
    readTime: "10 min",
    description:
      "Hands-on tutorial for bootstrapping a Next.js + Strapi headless stack with security baked in from the first commit.",
    tags: ["nextjs", "frontend", "strapi", "security"],
    reactions: 28,
    source: "dev.to",
  },
  {
    title: "Why use Next.js + Strapi?",
    url: "https://dev.to/rubenmarcus/why-use-next-js-strapi-16b1",
    date: "2021-05-07",
    readTime: "6 min",
    description:
      "The case for pairing Next.js with the Strapi headless CMS for a modern decoupled frontend/CMS stack.",
    tags: ["nextjs", "react", "strapi", "headless"],
    reactions: 71,
    source: "dev.to",
  },
];
