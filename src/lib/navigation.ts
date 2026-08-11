import { CAREER_YEARS } from "./site-facts";

export interface NavItem {
  label: string;
  href: string;
  index: string; // bracketed mono index — Nillion signature
}

export const navItems: NavItem[] = [
  { label: "Portfolio", href: "/portfolio", index: "00" },
  { label: "AI",        href: "/ai",        index: "01" },
  { label: "Skills",    href: "/skills",    index: "02" },
  { label: "Lab",       href: "/lab",       index: "03" },
  { label: "Blog",      href: "/blog",      index: "04" },
  { label: "About",     href: "/about",     index: "05" },
  { label: "Contact",   href: "/contact",   index: "06" },
  { label: "Agents",    href: "/agents",    index: "07" },
];

/** pt-BR labels keyed by EN href — Header swaps them in on /pt routes. */
export const navLabelsPt: Record<string, string> = {
  "/portfolio": "Portfólio",
  "/ai": "AI",
  "/skills": "Skills",
  "/lab": "Lab",
  "/blog": "Blog",
  "/about": "Sobre",
  "/contact": "Contato",
  "/agents": "Agentes",
};

export const socialLinks = [
  { label: "GitHub",   href: "https://github.com/rubenmarcus" },
  { label: "X",        href: "https://x.com/rubenmarcus_dev" },
  { label: "LinkedIn", href: "https://linkedin.com/in/rubenmarcus" },
  { label: "Telegram", href: "https://t.me/rubenmarcus" },
  { label: "npm",      href: "https://www.npmjs.com/~rmarcus" },
];

export const siteMeta = {
  name: "Ruben Marcus",
  role: "AI Fullstack Engineer",
  tagline: `${CAREER_YEARS} years shipping web3, fintech, and AI tooling. Built 10+ DeFi agents across Solana, EVM, SUI, NEAR, and Cardano.`,
  base: "Lisbon · Worldwide",
  phone: "+351 912 892 825",
};
