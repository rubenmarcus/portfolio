export const site = {
  name: "José Ramón García Del Risco",
  brand: "jseramn",
  url: "https://jseramn.tech",
  tagline: {
    en: "Helping people with technology while I build things",
    es: "Ayudo a las personas con tecnología mientras construyo cosas",
  },
  roles: ["tech lead", "cybersecurity", "web developer", "founder"] as const,
  locationLine: "Colombian builder between Cartagena and Medellín.",
  githubUser: "jseramn",
  email: "contacto@jseramn.tech",
  contactEmail: {
    from: "jseramn <contacto@jseramn.tech>",
    to: "contacto@jseramn.tech",
  },
  socials: [
    { id: "github", href: "https://github.com/jseramn", icon: "Github" },
    { id: "x", href: "https://x.com/jseramn_", icon: "Twitter" },
    { id: "linkedin", href: "https://linkedin.com/in/jseramn", icon: "Linkedin" },
    { id: "instagram", href: "https://instagram.com/jseramn", icon: "Instagram" },
    { id: "email", href: "mailto:contacto@jseramn.tech", icon: "Mail" },
  ] as const,
  marqueeOrgs: [
    { label: "tech @ Mallanet.org", href: "https://mallanet.org" },
    { label: "founding Presencia Pyme", href: "#" },
  ] as const,
  tracks: [{ id: "7MR49w84OHY", start: 0, title: "Now playing" }] as const,
  seo: {
    title: "José Ramón García Del Risco | jseramn",
    description:
      "José Ramón García Del Risco (jseramn) — tech lead, cybersecurity, web developer, and founder. Helping people with technology while I build things.",
    keywords:
      "José Ramón García Del Risco, jseramn, Ayudo a las personas con tecnología mientras construyo cosas, cybersecurity, web developer, tech lead, founder, Colombia, Cartagena, Medellín",
    ogImage: "https://jseramn.tech/thumbnail.png",
    twitter: "@jseramn_",
    knowsAbout: ["Cybersecurity", "Web Development", "Technology", "Entrepreneurship"],
    worksFor: [
      { "@type": "Organization" as const, name: "Mallanet.org", url: "https://mallanet.org" },
    ],
  },
  videoSrcWebm: "/videobg.webm",
  videoSrcMp4: "/videobg.mp4",
  contactCrypto: {
    ageRepo: "https://github.com/FiloSottile/age",
    typageRepo: "https://github.com/FiloSottile/typage",
    /** Social profiles where visitors should DM the decryption key */
    keyDeliverySocials: [
      { id: "x", label: "X", href: "https://x.com/jseramn_" },
      { id: "instagram", label: "Instagram", href: "https://instagram.com/jseramn" },
    ] as const,
  },
} as const

export type Site = typeof site
