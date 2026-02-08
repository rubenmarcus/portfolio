import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://rubenmarcus.dev", lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: "https://rubenmarcus.dev/about", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://rubenmarcus.dev/portfolio", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://rubenmarcus.dev/contact", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ]
}
