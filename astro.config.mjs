import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import tailwind from "@astrojs/tailwind"
import sitemap from "@astrojs/sitemap"

export default defineConfig({
  site: "https://jseramn.tech",
  integrations: [react(), tailwind({ applyBaseStyles: false }), sitemap()],
})
