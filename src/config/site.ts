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
  /** GitHub contribution graph days align with this IANA zone on the site. */
  activityTimeZone: "America/Bogota",
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
  tracks: [
    { id: "7iDtrh0K4Vg", start: 0, title: "Qual é seu desejo? — Tz da Coronel" },
    { id: "0iJsBi3D7wA", start: 0, title: "CAMARO — Big Soto" },
    { id: "N7EKS2aW_oc", start: 0, title: "Formula — Labrinth" },
    { id: "h6NmsUEHIYk", start: 0, title: "Paranoid (Just Raw Instrumental) — Aloboi" },
    { id: "L1IPbx28wAM", start: 0, title: "Sierra — Argy, Baset" },
    { id: "WHHmiWUqIZA", start: 0, title: "Aria — Argy, Omnya" },
    { id: "-HXEyh_s57Y", start: 0, title: "Droid Rage — OGRE Sound" },
    { id: "UaXqj5CBtMU", start: 0, title: "Perros Salvajes — Daddy Yankee" },
    { id: "IcWUy754seA", start: 0, title: "Somos de Calle — Daddy Yankee" },
    { id: "toitHzseExQ", start: 0, title: "Como Soy — Pacho El Antifeka" },
    { id: "BGpzGu9Yp6Y", start: 0, title: "Make It Bun Dem — Skrillex" },
    { id: "jnuu6doLeIQ", start: 0, title: "Encendedor — La Nota Ignota" },
    { id: "PVs8rdUeW2Y", start: 0, title: "Gtfb Drill Mix — Drama Theme" },
    { id: "F_-cbD1SXzY", start: 0, title: "California Killed Me — Night Club" },
    { id: "CYvA83VhPxg", start: 0, title: "On My Shit (Freestyle) — Snow Tha Product" },
    { id: "1foJW6XHK0U", start: 0, title: "Gracias — Akapellah" },
    { id: "tt7gP_IW-1w", start: 0, title: "Yamborghini High — A$AP Mob" },
  ] as const,
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
