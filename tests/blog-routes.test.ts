import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  getBlogPaths,
  getBlogPathsFromPathname,
  getBlogSlug,
  PT_BLOG_REDIRECTS,
  PT_BLOG_SLUGS,
} from "../src/lib/blog-routes";

describe("localized blog routes", () => {
  const key = "frontend-ai-harness-prompt-to-pull-request";
  const ptSlug = "meu-harness-de-ia-para-frontend-do-prompt-ao-pull-request";

  it("keeps the English content ID as the stable translation key", () => {
    expect(getBlogSlug("en", key)).toBe(key);
    expect(getBlogSlug("pt", key)).toBe(ptSlug);
    expect(getBlogPaths(key)).toEqual({
      en: `/blog/${key}`,
      pt: `/pt/blog/${ptSlug}`,
    });
  });

  it("resolves either locale URL back to the same pair", () => {
    expect(getBlogPathsFromPathname(`/blog/${key}`)).toEqual(getBlogPaths(key));
    expect(getBlogPathsFromPathname(`/pt/blog/${ptSlug}/`)).toEqual(getBlogPaths(key));
  });

  it("keeps an old-to-new mapping for every localized slug", () => {
    expect(Object.keys(PT_BLOG_REDIRECTS)).toHaveLength(Object.keys(PT_BLOG_SLUGS).length);
    expect(PT_BLOG_REDIRECTS[`/pt/blog/${key}`]).toBe(`/pt/blog/${ptSlug}`);
  });

  it("requires a unique localized slug for every Portuguese article", () => {
    const articleIds = readdirSync(new URL("../src/content/blog-pt", import.meta.url))
      .filter((filename) => filename.endsWith(".md"))
      .map((filename) => filename.replace(/\.md$/, ""));
    const localizedSlugs = Object.values(PT_BLOG_SLUGS);

    expect(Object.keys(PT_BLOG_SLUGS).sort()).toEqual(articleIds.sort());
    expect(new Set(localizedSlugs).size).toBe(localizedSlugs.length);
  });
});
