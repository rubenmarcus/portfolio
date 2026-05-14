import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    readTime: z.string(),
    tags: z.array(z.string()),
    cover: z.string().optional(),
    canonical: z.string().url().optional(),
    reactions: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
