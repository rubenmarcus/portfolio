---
title: "How AEO can help your business grow"
description: "AEO is the plumbing that lets ChatGPT, Perplexity and friends read and cite your business. I built a free scanner that has checked 4,569 sites; the same 3 failures show up everywhere. Here is what llms.txt, structured data and ai-index.json actually move, with a concrete before and after."
date: 2026-07-27
readTime: "11 min"
tags: ["aeo", "seo", "llm", "web"]
cover: "/art/blog/aeo-what-it-moves.png"
---

A while ago I shipped aeo.js, an open-source framework for Answer Engine Optimization, and check.aeojs.org, a free scanner that grades how readable your site is to AI crawlers and answer engines.

Quick definition, because the acronym does no work by itself: AEO is the set of things that make your site legible to answer engines: ChatGPT, Perplexity, Claude, Gemini, Copilot, the tools your customers increasingly ask instead of Google. SEO gets you ranked on a results page. AEO gets you quoted inside the answer. When someone asks "who makes a good X for small businesses" and the model answers with three names and a sentence each, being one of those three names is the new first page of Google. That is the entire business case: answer engines are a discovery channel, and the barrier to entry is mostly plumbing.

The scanner has now run **4,569 total scans across 2,259 unique websites**. That is a real dataset. Enough to stop writing about what AEO should do in theory and start writing about what it actually moves in practice.

This is that post.

## What 2,259 websites have in common

The failures are boring. That is the finding. The scanner grades five categories worth 20 points each: AI Access, Content Structure, Schema Presence, Meta Quality, and Citability. Most sites do not fail in exotic ways. They fail the same 3 to 4 checks, over and over:

1. **Robots policy blocks AI crawlers.** Sometimes deliberately, usually not. The most common version is a `Disallow: /` copied from a staging config, or a hosting platform default that was never reviewed. The site owner has no opinion on GPTBot. Their template does.
2. **No llms.txt.** Still the exception, not the norm. Even on sites whose owners write blog posts about AI.
3. **No structured data.** No JSON-LD, no schema.org markup. The scanner checks specifically for Organization, Article or WebPage, and FAQPage or HowTo blocks. Answer engines have to guess what the page is instead of being told.
4. **Thin or unstructured content.** The Citability category scores whether a model can lift a self-contained answer out of your page: direct answer paragraphs, real numbers, heading structure. Most pages have none of the three.

None of these are hard to fix. That is the whole point. The average site is not losing the AEO game on content quality. It is losing on plumbing it forgot it had.

## The robots.txt problem is usually an accident

Here is what I see constantly. A site with great content, decent SEO, and this in its robots.txt:

```txt
User-agent: *
Disallow: /

# or the more modern version nobody reviewed:
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: PerplexityBot
Disallow: /
```

Ask the owner why they block GPTBot and you get a blank face. They never decided to. A boilerplate decided for them, or a plugin added it during the "block AI scraping" news cycle and nobody revisited it.

The scanner gives this real weight. A blanket disallow costs 4 points, blocking most of the 4 major bots (GPTBot, ClaudeBot, Google-Extended, PerplexityBot) costs 4 more, and allowing under 70% of the 23 crawlers costs another 3. That is 11 points out of 100 decided by one text file.

There are legitimate reasons to block AI crawlers. If you have one, fine, block them and skip this post. But if you want answer engines to cite you, the first check is whether you told their crawlers to go away. The fix is deleting lines. It is the highest-leverage edit in all of AEO and it takes five minutes.

## What llms.txt and ai-index.json actually change

Two files, two different jobs. People conflate them, and the second is not what most people think it is.

`llms.txt` is a curated map for a language model that lands on your site at inference time. It is not a ranking signal. Nobody boosts you for having one. What it does: when an answer engine fetches your site, it gets a clean index of your content instead of your nav bar and footer links. Here is the actual shape aeo.js generates, from `src/core/llms-txt.ts`:

```txt
# Ruben Marcus

> Senior AI fullstack engineer. Builds browser games, agent
> harnesses, and open-source tooling.

## Pages

- [Blog](https://rubenmarcus.dev/blog)
- [About](https://rubenmarcus.dev/about)

## Quick Links

- Full Documentation: https://rubenmarcus.dev/llms-full.txt
- Documentation Manifest: https://rubenmarcus.dev/docs.json
- AI-Optimized Index: https://rubenmarcus.dev/ai-index.json
- Sitemap: https://rubenmarcus.dev/sitemap.xml
```

`ai-index.json` sounds like the same idea in JSON. It is not. It is a pre-chunked retrieval index. The generator (`src/core/ai-index.ts`) splits every page into chunks of `maxChunkLength` characters (2,000 by default), extracts keywords by term frequency, and hashes each chunk into a stable 16-character ID. A RAG pipeline can embed your site without ever crawling it:

```json
{
  "version": "1.0",
  "generated": "2026-08-12T09:00:00.000Z",
  "site": {
    "title": "Ruben Marcus",
    "url": "https://rubenmarcus.dev"
  },
  "entries": [
    {
      "id": "9f2c1ab4e07d55aa",
      "url": "https://rubenmarcus.dev/blog/shipping-a-browser-fps",
      "title": "Shipping a browser FPS with no server",
      "content": "...chunk of up to 2,000 characters...",
      "keywords": ["webgpu", "wasm", "browser", "fps"],
      "metadata": {
        "chunkIndex": 0,
        "totalChunks": 3,
        "sourcePath": "blog/shipping-a-browser-fps.md"
      }
    }
  ],
  "metadata": {
    "totalEntries": 87,
    "generator": "aeo.js",
    "embedding": {
      "recommended": "text-embedding-ada-002",
      "dimensions": 1536
    }
  }
}
```

Do these files get you cited tomorrow? No. The honest framing: they cut the cost of understanding your site from "parse the whole DOM and guess" to "read one file". When answer engines decide what to cite, the sites that are cheap to understand win ties. That is the entire claim. It is a real effect and a modest one.

## The implementation order that pays

After watching a few thousand scan results, this is the order I recommend. It is sorted by effort-to-impact, not by fashion.

**1. Robots policy.** Unblock the crawlers you actually want. Five minutes. Unblocks everything below it. If AI crawlers cannot fetch your pages, the rest of this post is decoration.

**2. Structured data.** JSON-LD is what answer engines parse today, at scale, right now. An `Article` block with author, date, and headline is 20 lines of markup, and the scanner's Schema Presence category tells you exactly which blocks are missing.

**3. Exports.** Now generate `llms.txt`, `ai-index.json`, and friends. Do not hand-maintain them. They go stale the day you publish post number two. This is the part aeo.js automates, and since invented configs keep showing up in the wild, here is the real one. `npx aeo.js init` writes this file:

```ts
// aeo.config.ts
import { defineConfig } from "aeo.js";

export default defineConfig({
  title: "Ruben Marcus",
  url: "https://rubenmarcus.dev",
  description: "Senior AI fullstack engineer.",

  generators: {
    robotsTxt: true,
    llmsTxt: true,
    llmsFullTxt: true,
    rawMarkdown: true,
    sitemap: true,
    aiIndex: true,
    schema: true,
  },

  robots: {
    allow: ["/"],
    disallow: ["/api"],
  },
});
```

One subtlety: `robots.allow` and `robots.disallow` are paths, not crawler names. The generated robots.txt already explicitly allows 49 known AI and SEO crawlers by name. Your config only shapes the wildcard `User-agent: *` block.

On Astro, where this site lives, it is one integration. It scans the built HTML at `astro:build:done`, generates the files, and injects canonical URLs, JSON-LD, and `rel="alternate"` links into every page that lacks them:

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import { aeoAstroIntegration } from "aeo.js/astro";

export default defineConfig({
  site: "https://rubenmarcus.dev",
  integrations: [
    aeoAstroIntegration({
      title: "Ruben Marcus",
      url: "https://rubenmarcus.dev",
      description: "Senior AI fullstack engineer.",
    }),
  ],
});
```

Next.js is a config wrapper plus a post-build step, because the real page content only exists after prerendering:

```js
// next.config.mjs
import { withAeo } from "aeo.js/next";

export default withAeo({
  aeo: { title: "My Site", url: "https://mysite.com" },
});
```

```json
{
  "scripts": {
    "postbuild": "node -e \"import('aeo.js/next').then(m => m.postBuild({ title: 'My Site', url: 'https://mysite.com' }))\""
  }
}
```

There are plugins for Vite, Nuxt, Remix, SvelteKit, Angular, Webpack, Docusaurus, Eleventy, VitePress, and TanStack Start, plus `npx aeo.js generate` if your stack is none of those. The point is not the tool. Exports are a build artifact, not a document.

**4. Content layer.** Last, because it is the expensive one. Answer engines quote pages that answer questions directly: headings that are questions, paragraphs that state facts in the first sentence, numbers with sources. This is real editorial work and no config file does it for you. Do it after the plumbing, because the plumbing is an afternoon and the content is forever.

## A concrete before and after

Here is the composite I see over and over in the scan data, as one story. A small B2B SaaS, decent blog, real customers.

**Before.** robots.txt carried a `Disallow: /` for GPTBot and ClaudeBot, inherited from a template. No `llms.txt`, no `ai-index.json`, no JSON-LD anywhere. Product pages were a hero image, a slogan, and a pricing table. Scanner score: 38 out of 100. When someone asked an answer engine for tools in its category, the site did not exist. Not because the model disliked it, but because the crawler was told to leave and nothing on the page was quotable anyway.

**After, one afternoon of plumbing.** Deleted the disallow lines. Added an `Organization` and `Article` JSON-LD block. Generated `llms.txt` and `ai-index.json` at build time. Rewrote exactly three product pages so the first sentence of each answers "what is this and who is it for" in plain language. Scanner score: 91. Total cost: one developer, one day, zero dollars in tooling.

What changed for the business: the site went from "invisible to answer engines" to "cheap to understand and easy to quote." That is the honest promise. It does not guarantee citations (nothing does), but it moves you from not eligible to eligible, and eligibility is the part that is entirely in your control. The growth mechanics after that are the same as they always were: be findable where your customers look, be quotable when they ask.

## How to measure a before and after

Attribution in AEO is bad. I will not pretend otherwise. You cannot UTM-tag a ChatGPT answer. So measure what you control, in a loop:
1. Run a baseline: `npx aeo.js check yoursite.com`, or the same scan in the browser at check.aeojs.org. Screenshot the result.
2. Fix one layer from the order above. One, not four.
3. Deploy, rescan, compare.
4. Repeat until the scanner has nothing left to say.

The scanner score is a proxy, and you should treat it as one. What it verifies is mechanical: crawlers can reach you, the files exist, the markup parses, the content has liftable answers. The slower signal is referral traffic from answer engines in your analytics. Check that monthly, not daily. It moves slowly.

## What AEO does not fix

The limits, because every post about this skips them:

- **AEO does not fix bad content.** If your pages say nothing, structured data describes the nothing precisely. Answer engines cite pages that contain answers.
- **It does not replace SEO.** The same crawlers and the same content quality bar feed both. AEO is a layer on a working site, not a rescue plan for a broken one.
- **It does not guarantee citations.** Nobody outside the labs knows the ranking function of any answer engine, and the labs are not telling. Anyone selling guaranteed placement is selling something else.

What it does: removes the mechanical reasons an answer engine cannot read you, and makes your best content cheap to find once it can. For most of the 2,259 sites my scanner has seen, that is the gap. Not strategy. Plumbing.

Fix the plumbing first. It is the only part that is free.

*aeo.js is open source. The scanner is free at check.aeojs.org. If your score surprises you, my inbox is open.*
