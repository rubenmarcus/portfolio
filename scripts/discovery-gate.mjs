#!/usr/bin/env node
/** Fail the build when public SEO/AEO surfaces disagree with canonical routes. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL("..", import.meta.url)), "dist", "client");
const read = (path) => readFileSync(join(root, path), "utf8");
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const robots = readFileSync(join(fileURLToPath(new URL("..", import.meta.url)), "public", "robots.txt"), "utf8");
const sitemap = read("sitemap-0.xml");
const aiIndex = read("ai-index.json");
const docs = read("docs.json");
const llmsFull = read("llms-full.txt");

assert(robots.includes("Sitemap: https://www.rubenmarcus.dev/sitemap-index.xml"), "robots.txt must point to sitemap-index.xml");
assert(!sitemap.includes("-preview"), "preview routes leaked into the sitemap");
assert(!sitemap.includes("/blog-pt/"), "internal blog-pt paths leaked into the sitemap");
assert(!aiIndex.includes("/blog-pt/"), "internal blog-pt paths leaked into ai-index.json");
assert(!docs.includes("/blog-pt/"), "internal blog-pt paths leaked into docs.json");
assert(!llmsFull.includes("Source: blog-pt/"), "internal source filenames leaked into llms-full.txt");
assert(!llmsFull.includes("rubenmarcus.dev/blog-pt/"), "internal URLs leaked into llms-full.txt");
assert(!/\(Part \d+\)/.test(aiIndex), "chunk titles leaked into ai-index.json");

// URL policy: no trailing slash (src/lib/url-policy.ts) — the gate asserts
// the canonical form and rejects the slashed one.
assert(!/<loc>https:\/\/www\.rubenmarcus\.dev\/.+\/<\/loc>/.test(sitemap), "slashed URLs leaked into the sitemap");
for (const path of [
  "/skills",
  "/pt/skills",
  "/services/aeo",
  "/pt/services/aeo",
  "/work/aeo-platform",
  "/pt/work/aeo-platform",
]) assert(sitemap.includes(`https://www.rubenmarcus.dev${path}</loc>`), `missing canonical route in sitemap: ${path}`);

const ptArticle = read("pt/blog/do-prompt-ao-produto-cinco-formas-de-desenvolver-com-ia/index.html");
assert(ptArticle.includes('hreflang="en" href="https://www.rubenmarcus.dev/blog/from-prompt-to-product-five-ways-to-build-with-ai"'), "localized article is missing its canonical English hreflang");
assert(ptArticle.includes('rel="canonical" href="https://www.rubenmarcus.dev/pt/blog/do-prompt-ao-produto-cinco-formas-de-desenvolver-com-ia"'), "localized article canonical is wrong");

for (const [, href] of sitemap.matchAll(/<loc>(.*?)<\/loc>/g)) {
  const pathname = new URL(href).pathname;
  const output = pathname === "/" ? "index.html" : `${pathname.replace(/^\//, "").replace(/\/?$/, "/")}index.html`;
  const html = read(output);
  const h1Count = (html.match(/<h1[ >]/g) ?? []).length;
  assert(h1Count === 1, `${pathname} must contain exactly one h1; found ${h1Count}`);
}

if (failures.length) {
  for (const failure of failures) console.error(`discovery-gate: ${failure}`);
  process.exit(1);
}
console.log("discovery-gate: canonical discovery surfaces agree");
