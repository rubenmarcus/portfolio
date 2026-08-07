/**
 * Utility SVG icon bodies — absorbed from the old Icon.astro (deleted).
 * Bodies are inner SVG markup for a 24×24 stroke-based frame
 * (fill="none" stroke="currentColor" on the <svg>, see SvgIcon.svelte);
 * fill-based marks override with fill="currentColor" stroke="none" inline.
 */

import type { SvgIconDef } from "../types";

export const arrowRight: SvgIconDef = {
  label: "Arrow right",
  body: '<path d="M5 12h14M13 5l7 7-7 7" />',
};

export const arrowUpRight: SvgIconDef = {
  label: "Arrow up-right",
  body: '<line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />',
};

export const arrowDown: SvgIconDef = {
  label: "Arrow down",
  body: '<path d="M12 5v14M5 12l7 7 7-7" />',
};

export const external: SvgIconDef = {
  label: "External link",
  body: '<path d="M15 3h6v6" /><path d="M10 14L21 3" /><path d="M21 14v7H3V3h7" />',
};

export const github: SvgIconDef = {
  label: "GitHub",
  body: '<path d="M12 2A10 10 0 0 0 8.84 21.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.69.92.69 1.85V21c0 .27.16.59.67.5A10 10 0 0 0 12 2z" fill="currentColor" stroke="none" />',
};

export const xTwitter: SvgIconDef = {
  label: "X (Twitter)",
  body: '<path d="M18.244 2H21.5l-7.5 8.572L23 22h-6.91l-4.81-6.288L5.7 22H2.44l8.02-9.166L1.5 2h7.05l4.34 5.745L18.244 2zm-1.21 18h1.91L7.06 4H5.05l11.985 16z" fill="currentColor" stroke="none" />',
};

export const linkedin: SvgIconDef = {
  label: "LinkedIn",
  body: '<path d="M4 4h4v16H4zM6 2.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM10 8h3.8v2.2h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V20h-4v-5.7c0-1.36-.03-3.1-1.9-3.1-1.9 0-2.2 1.48-2.2 3v5.8h-4V8z" fill="currentColor" stroke="none" />',
};

export const mail: SvgIconDef = {
  label: "Email",
  body: '<rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />',
};

export const telegram: SvgIconDef = {
  label: "Telegram",
  body: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />',
};

export const devTo: SvgIconDef = {
  label: "dev.to",
  body: '<rect x="2.5" y="4.5" width="19" height="15" rx="2" /><path d="M7 9v6M5.5 9h3M5.5 12h2.5M5.5 15h3" stroke-width="1.8" /><path d="M11 9l1.7 6L14.4 9" stroke-width="1.8" /><path d="M17 9v6h2.5M17 12h1.8" stroke-width="1.8" />',
};

export const npm: SvgIconDef = {
  label: "npm",
  body: '<path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" fill="currentColor" stroke="none" />',
};

export const terminal: SvgIconDef = {
  label: "Terminal",
  body: '<polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />',
};

export const zap: SvgIconDef = {
  label: "Zap",
  body: '<path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />',
};

export const code: SvgIconDef = {
  label: "Code",
  body: '<polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />',
};

export const pkg: SvgIconDef = {
  label: "Package",
  body: '<path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />',
};

export const sparkles: SvgIconDef = {
  label: "Sparkles",
  body: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2" />',
};

export const feather: SvgIconDef = {
  label: "Feather",
  body: '<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" /><line x1="16" y1="8" x2="2" y2="22" /><line x1="17.5" y1="15" x2="9" y2="15" />',
};

export const globe: SvgIconDef = {
  label: "Globe",
  body: '<circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z" />',
};

export const command: SvgIconDef = {
  label: "Command",
  body: '<path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />',
};

export const circleDot: SvgIconDef = {
  label: "Circle dot",
  body: '<circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />',
};

export const rss: SvgIconDef = {
  label: "RSS",
  body: '<path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1.2" fill="currentColor" stroke="none" />',
};
