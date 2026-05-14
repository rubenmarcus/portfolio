import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://rubenmarcus.dev",
  integrations: [
    svelte(),
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
});
