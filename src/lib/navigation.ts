export interface NavItem {
  label: string;
  href: string;
  index: string; // bracketed mono index — Nillion signature
}

export const navItems: NavItem[] = [
  { label: "Portfolio", href: "/portfolio", index: "00" },
  { label: "AI",        href: "/ai",        index: "01" },
  { label: "Lab",       href: "/lab",       index: "02" },
  { label: "Blog",      href: "/blog",      index: "03" },
  { label: "About",     href: "/about",     index: "04" },
  { label: "Contact",   href: "/contact",   index: "05" },
  { label: "MCP",       href: "/connect",   index: "06" },
  { label: "Agents",    href: "/agents",    index: "07" },
];

/** pt-BR labels keyed by EN href — Header swaps them in on /pt routes. */
export const navLabelsPt: Record<string, string> = {
  "/portfolio": "Portfólio",
  "/ai": "AI",
  "/lab": "Lab",
  "/blog": "Blog",
  "/about": "Sobre",
  "/contact": "Contato",
  "/connect": "MCP",
  "/agents": "Agentes",
};

export const socialLinks = [
  { label: "GitHub",   href: "https://github.com/rubenmarcus" },
  { label: "X",        href: "https://x.com/rubenmarcus_dev" },
  { label: "LinkedIn", href: "https://linkedin.com/in/rubenmarcus" },
  { label: "Email",    href: "mailto:ruben@rubenmarcus.dev" },
  { label: "Telegram", href: "https://t.me/rubenmarcus" },
  { label: "npm",      href: "https://www.npmjs.com/~rmarcus" },
];

export const siteMeta = {
  name: "Ruben Marcus",
  role: "Senior AI Fullstack Engineer",
  tagline: "13 years shipping web3, fintech, and AI tooling. Built 10+ DeFi agents across Solana, EVM, SUI, NEAR, and Cardano.",
  base: "Lisbon · Worldwide",
  email: "ruben@rubenmarcus.dev",
  phone: "+351 912 892 825",
};
