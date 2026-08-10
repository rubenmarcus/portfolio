import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import { aeoAstroIntegration } from "aeo.js/astro";

export default defineConfig({
  site: "https://rubenmarcus.dev",
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
    aeoAstroIntegration({
      title: "Ruben Marcus — AI Fullstack Engineer",
      description:
        "Senior AI Fullstack Engineer building autonomous AI tooling, agents, and on-chain product surfaces. Based in Lisbon.",
      url: "https://rubenmarcus.dev",
      trailingSlash: "never",
      generators: {
        // Curated locally because aeo.js 0.0.16 does not yet support
        // Content-Signal or preserving custom llms.txt sections.
        robotsTxt: false,
        llmsTxt: false,
        llmsFullTxt: true,
        rawMarkdown: true,
        manifest: true,
        sitemap: true,
        aiIndex: true,
        schema: true,
      },
      schema: {
        enabled: true,
        organization: {
          name: "Ruben Marcus",
          url: "https://rubenmarcus.dev",
          logo: "https://rubenmarcus.dev/favicon.png",
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
        image: "https://rubenmarcus.dev/og/index.png",
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
    }),
  ],
});
