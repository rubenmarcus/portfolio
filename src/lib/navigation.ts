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
  { label: "Email",    href: "mailto:ruben@rubenmarcus.dev" },
  { label: "Telegram", href: "https://t.me/rubenmarcus" },
  { label: "dev.to",   href: "https://dev.to/rubenmarcus" },
];

export const siteMeta = {
  name: "Ruben Marcus",
  role: "AI Fullstack & Web3 Engineer",
  tagline: "Building autonomous AI tooling, post-quantum infrastructure, and on-chain product surfaces.",
  base: "Lisbon · Worldwide",
  org: "MultiVM Labs",
};
