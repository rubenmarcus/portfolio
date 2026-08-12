import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import { aeoAstroIntegration } from "aeo.js/astro";
import { getBlogPathsFromPathname, PT_BLOG_REDIRECTS } from "./src/lib/blog-routes.ts";
import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

// aeo.js versions before this config emitted raw source Markdown into the
// build directory. Astro's server output can preserve those files between
// builds, so remove only that obsolete generated extension before discovery.
const cleanLegacyAeoMarkdown = {
  name: "clean-legacy-aeo-markdown",
  hooks: {
    "astro:build:start": () => {
      for (const directory of ["dist/client/blog", "dist/client/blog-pt"]) {
        if (!existsSync(directory)) continue;
        for (const entry of readdirSync(directory)) {
          if (entry.endsWith(".md")) unlinkSync(join(directory, entry));
        }
      }
    },
  },
};

export default defineConfig({
  site: "https://www.rubenmarcus.dev",
  redirects: PT_BLOG_REDIRECTS,
  // Pages stay static/prerendered; only /api/hire runs as a function.
  adapter: vercel({
    // Edge middleware lets the curl easter egg intercept static pages too.
    edgeMiddleware: true,
  }),
  // Dev-only: keep the toolbar pill out of visual-gauntlet screenshots.
  devToolbar: { enabled: false },
  build: {
    // Inline all CSS into each page's HTML. The ClientRouter swap otherwise
    // paints the new page while its stylesheet chunk is still fetching —
    // visible as unstyled blue links and a white header hairline.
    inlineStylesheets: "always",
  },
  markdown: {
    // Terminal-phosphor syntax theme — colors come from --shiki-* vars in
    // global.css so code blocks read like the rest of the site.
    shikiConfig: { theme: "css-variables" },
  },
  integrations: [
    cleanLegacyAeoMarkdown,
    aeoAstroIntegration({
      title: "Ruben Marcus — AI Fullstack Engineer",
      description:
        "AI Fullstack Engineer building AI products, agent systems, AEO infrastructure, and high-performance web experiences. Based in Lisbon.",
      url: "https://www.rubenmarcus.dev",
      trailingSlash: "never",
      // Keep generated development artifacts outside public/. Writing raw
      // markdown back into a watched source directory caused a regeneration
      // loop. dist/ is ignored and is also the production output destination.
      outDir: "dist/client",
      generators: {
        // Curated locally because aeo.js 0.0.16 does not yet support
        // Content-Signal or preserving custom llms.txt sections.
        robotsTxt: false,
        llmsTxt: false,
        // Custom canonical generators live in src/pages. aeo.js discovers
        // source filenames as URLs for content collections with translated
        // slugs, so its generic manifest/full-text outputs are disabled.
        llmsFullTxt: false,
        // Astro content collection filenames are internal translation keys,
        // not public URLs. Exporting them would create invalid /blog-pt/*
        // documents alongside the canonical localized routes.
        rawMarkdown: false,
        manifest: false,
        // @astrojs/sitemap below owns the canonical sitemap and hreflang data.
        sitemap: false,
        // Owned by src/pages/ai-index.json.ts and BaseLayout respectively.
        // Keeping one source prevents raw markdown paths from leaking into
        // public discovery files as non-canonical /blog-pt/* URLs.
        aiIndex: false,
        schema: false,
      },
      schema: {
        enabled: true,
        organization: {
          name: "Ruben Marcus",
          url: "https://www.rubenmarcus.dev",
          logo: "https://www.rubenmarcus.dev/favicon.png",
          sameAs: [
            "https://github.com/rubenmarcus",
            "https://x.com/rubenmarcus_dev",
            "https://linkedin.com/in/rubenmarcus",
            "https://www.npmjs.com/~rmarcus",
          ],
        },
        defaultType: "WebPage",
      },
      og: {
        enabled: true,
        image: "https://www.rubenmarcus.dev/og/index.png",
        twitterHandle: "@rubenmarcus_dev",
      },
      widget: {
        enabled: true,
        position: "bottom-right",
        size: "icon-only",
        theme: {
          background: "rgba(5, 7, 12, 0.94)",
          text: "#f5f1ea",
          accent: "#00ff41",
          badge: "#4ade80",
        },
      },
    }),
    svelte(),
    tailwind({ applyBaseStyles: false }),
    // i18n block makes the sitemap emit xhtml:link hreflang alternates
    // (en-US ↔ pt-BR) for every URL pair.
    sitemap({
      // Dev-only preview pages are noindexed; keep them out of the sitemap.
      filter: (page) => !page.includes("-preview"),
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en-US",
          pt: "pt-BR",
        },
      },
      serialize(item) {
        const url = new URL(item.url);
        const paths = getBlogPathsFromPathname(url.pathname);
        if (!paths) return item;
        return {
          ...item,
          links: [
            { lang: "en-US", hreflang: "en", url: new URL(paths.en, url.origin).href },
            { lang: "pt-BR", hreflang: "pt-BR", url: new URL(paths.pt, url.origin).href },
          ],
        };
      },
    }),
  ],
});
