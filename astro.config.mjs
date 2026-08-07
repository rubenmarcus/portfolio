import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

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
