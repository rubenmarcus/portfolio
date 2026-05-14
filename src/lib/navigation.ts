export interface NavItem {
  label: string;
  href: string;
  index: string; // bracketed mono index — Nillion signature
}

export const navItems: NavItem[] = [
  { label: "Index",     href: "/",          index: "00" },
  { label: "Portfolio", href: "/portfolio", index: "01" },
  { label: "AI",        href: "/ai",        index: "02" },
  { label: "Blog",      href: "/blog",      index: "03" },
  { label: "About",     href: "/about",     index: "04" },
  { label: "Contact",   href: "/contact",   index: "05" },
];

export const socialLinks = [
  { label: "GitHub",   href: "https://github.com/rubenmarcus" },
  { label: "X",        href: "https://x.com/rubenmarcus_dev" },
  { label: "LinkedIn", href: "https://linkedin.com/in/rubenmarcus" },
  { label: "Email",    href: "mailto:rubenmarcus.dev@gmail.com" },
  { label: "Telegram", href: "https://t.me/rubenmarcus" },
  { label: "dev.to",   href: "https://dev.to/rubenmarcus" },
];

export const siteMeta = {
  name: "Ruben Marcus",
  role: "Senior AI Fullstack Engineer",
  tagline: "13 years shipping web3, fintech, and AI tooling. Built 10+ DeFi agents across Solana, EVM, SUI, NEAR, and Cardano.",
  base: "Lisbon · Worldwide",
  org: "MultiVM Labs",
  email: "rubenmarcus.dev@gmail.com",
  phone: "+351 912 892 825",
};
