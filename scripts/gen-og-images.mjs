#!/usr/bin/env node
/**
 * Generate OG images (1200×630) per page and per blog post, plus the
 * LinkedIn (1584×396) and X (1500×500) profile banners.
 *
 * Backgrounds come from the existing generated art (blog covers, hero scan)
 * or from a one-off OpenRouter generation for the main pages. Text is
 * composited locally with sharp via SVG (Menlo, terminal style), so titles
 * are deterministic and typo-free.
 *
 * Usage:
 *   node scripts/gen-og-images.mjs            # compose everything (skip existing gen bgs)
 *   node scripts/gen-og-images.mjs --force-gen # regenerate the OpenRouter backgrounds too
 *
 * Reads OPENROUTER_API_KEY from .env; never prints it.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env"), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const KEY = env.OPENROUTER_API_KEY;
const FORCE_GEN = process.argv.includes("--force-gen");

const GREEN = "#00ff41";
const INK = "#f5f1ea";
const MUTED = "#8a9488";

const GEN_STYLE = `A dense luminous swarm of tiny phosphor-green (#00ff41) particles, sparks and hairline light-trails on a 100% pure black background, forming the motif below. Organic depth, soft phosphor bloom, subtle dot-matrix grain, cinematic contrast, wide 16:9 composition with generous black margins, darker toward the left half so overlaid text stays readable. STRICTLY no text, no letters, no logos, no people, no solid fills, no other colors. Dark analog occult-techno mood.`;

// ── Page OG definitions ────────────────────────────────────────────────
// bg: absolute-ish path under public/, or { gen: "<motif>" } to create one.
const PAGES = [
  {
    out: "index",
    bg: "art/ruben-hero-scan.png",
    kicker: "RUBENMARCUS.DEV",
    title: "The first portfolio made for agents",
  },
  {
    out: "portfolio",
    bg: { gen: "a floating grid of glowing project cards orbiting one bright central card, faint timeline rail below" },
    kicker: "RUBENMARCUS.DEV /PORTFOLIO",
    title: "14 years of shipped work",
  },
  {
    out: "ai",
    bg: { gen: "a particle terminal window with a streaming beam of tokens flowing out of it into a tool rack" },
    kicker: "RUBENMARCUS.DEV /AI",
    title: "AI tooling, built and shipped",
  },
  {
    out: "agents",
    bg: { gen: "a fleet of small particle drones in formation docking into a glowing control tower" },
    kicker: "RUBENMARCUS.DEV /AGENTS",
    title: "A fleet of AI agents that actually transact",
  },
  {
    out: "blog",
    bg: { gen: "a stack of glowing particle documents, one page lifting off and unfolding into light trails" },
    kicker: "RUBENMARCUS.DEV /BLOG",
    title: "Writing for humans and machines",
  },
  {
    out: "about",
    bg: "art/about-portrait.png",
    kicker: "RUBENMARCUS.DEV /ABOUT",
    title: "Sr. AI Fullstack Engineer",
  },
  {
    out: "contact",
    bg: { gen: "a single glowing particle doorway slightly open, a beam of light spilling out onto the dark floor" },
    kicker: "RUBENMARCUS.DEV /CONTACT",
    title: "Ship an AI feature end to end",
  },
  {
    out: "lab",
    bg: { gen: "a particle workbench with small experiment flasks of light, one beeping waveform hovering above" },
    kicker: "RUBENMARCUS.DEV /LAB",
    title: "Weekly demos and experiments",
  },
  {
    out: "connect",
    bg: { gen: "two particle nodes shaking hands across a glowing link beam, smaller nodes lighting up around them" },
    kicker: "RUBENMARCUS.DEV /CONNECT",
    title: "Say hello, human or agent",
  },
];

// PT mirrors share the background, only the title changes.
const PAGES_PT = {
  portfolio: "14 anos de trabalho entregue",
  ai: "Ferramentas de IA, construídas e entregues",
  agents: "Uma frota de agentes de IA que transacionam de verdade",
  blog: "Escrita para humanos e máquinas",
  about: "Engenheiro Fullstack de IA Sênior",
  contact: "Tire uma feature de IA do papel",
  lab: "Demos e experimentos semanais",
  connect: "Diga olá, humano ou agente",
};

const SOCIAL = [
  {
    out: "art/social/readme-cover.png",
    w: 1200,
    h: 630,
    bg: "art/ruben-hero-scan.png",
    slogan: "rubenmarcus.dev",
    sub: "the first portfolio made for agents",
  },
  {
    out: "art/social/linkedin-cover.png",
    w: 1584,
    h: 396,
    bg: { gen: "a wide panoramic terminal horizon made of particles, one long glowing command line stretching across with a bright block cursor, depth fading to the right" },
    slogan: "the first portfolio made for agents",
    sub: "rubenmarcus.dev · ruben@rubenmarcus.dev · github.com/rubenmarcus",
  },
  {
    out: "art/social/x-cover.png",
    w: 1500,
    h: 500,
    bg: { gen: "a wide panoramic terminal horizon made of particles, one long glowing command line stretching across with a bright block cursor, depth fading to the right" },
    slogan: "the first portfolio made for agents",
    sub: "rubenmarcus.dev · ruben@rubenmarcus.dev · github.com/rubenmarcus",
  },
];

// ── helpers ─────────────────────────────────────────────────────────────
const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function wrap(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Terminal-styled OG text overlay: green kicker, wrapped Menlo title, rule. */
function ogSvg({ w, h, kicker, title }) {
  const m = 64;
  let size = 46;
  let lines = wrap(title, 34);
  if (lines.length > 3 || lines.some((l) => l.length > 34)) {
    size = 38;
    lines = wrap(title, 42);
  }
  const lh = size * 1.25;
  const titleTop = h - m - (lines.length - 1) * lh;
  const texts = lines
    .map(
      (l, i) =>
        `<text x="${m}" y="${titleTop + i * lh}" font-family="Menlo, monospace" font-weight="bold" font-size="${size}" fill="${INK}">${esc(l)}</text>`
    )
    .join("\n");
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="black" opacity="0.52"/>
  <rect width="${w}" height="${h}" fill="url(#fade)"/>
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="black" stop-opacity="0.55"/>
      <stop offset="0.6" stop-color="black" stop-opacity="0.1"/>
      <stop offset="1" stop-color="black" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="${m}" y="${titleTop - size - 34}" width="72" height="4" fill="${GREEN}"/>
  <text x="${m}" y="${m}" font-family="Menlo, monospace" font-size="22" letter-spacing="3" fill="${GREEN}">${esc(kicker)}</text>
  ${texts}
  <text x="${w - m}" y="${h - m + 8}" text-anchor="end" font-family="Menlo, monospace" font-size="18" fill="${MUTED}">rubenmarcus.dev</text>
</svg>`;
}

/** Banner overlay for LinkedIn/X: big slogan, contacts line. */
function socialSvg({ w, h, slogan, sub }) {
  const m = Math.round(w * 0.05);
  const size = Math.round(h * 0.14);
  const lines = wrap(slogan, Math.floor((w * 0.62) / (size * 0.6)));
  const lh = size * 1.2;
  const top = h / 2 - ((lines.length - 1) * lh) / 2;
  const texts = lines
    .map(
      (l, i) =>
        `<text x="${m}" y="${top + i * lh}" font-family="Menlo, monospace" font-weight="bold" font-size="${size}" fill="${INK}">${esc(l)}</text>`
    )
    .join("\n");
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="black" opacity="0.5"/>
  <rect x="${m}" y="${top - size - 26}" width="88" height="5" fill="${GREEN}"/>
  ${texts}
  <text x="${m}" y="${h - Math.round(h * 0.09)}" font-family="Menlo, monospace" font-size="${Math.round(h * 0.055)}" fill="${GREEN}">${esc(sub)}</text>
</svg>`;
}

async function genBg(motif, outPath) {
  if (!KEY) throw new Error("OPENROUTER_API_KEY missing in .env");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      modalities: ["image", "text"],
      messages: [{ role: "user", content: [{ type: "text", text: `${GEN_STYLE}\nMOTIF: ${motif}.` }] }],
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
  const images = json.choices?.[0]?.message?.images ?? [];
  const dataUrl = images[0]?.image_url?.url ?? "";
  const b64 = dataUrl.startsWith("data:") ? dataUrl.split(",")[1] : undefined;
  if (!b64) throw new Error("no image in response");
  writeFileSync(outPath, Buffer.from(b64, "base64"));
}

async function composite(bgPath, svg, outPath, w, h) {
  await sharp(bgPath)
    .resize(w, h, { fit: "cover", position: "attention" })
    .composite([{ input: Buffer.from(svg) }])
    .png()
    .toFile(outPath);
}

function readTitle(mdPath) {
  const src = readFileSync(mdPath, "utf8");
  const m = src.match(/^title:\s*["']?(.*?)["']?\s*$/m);
  return m ? m[1] : null;
}

// ── main ────────────────────────────────────────────────────────────────
const ogDir = join(root, "public/og");
const bgDir = join(ogDir, "bg");
mkdirSync(bgDir, { recursive: true });
mkdirSync(join(ogDir, "blog"), { recursive: true });
mkdirSync(join(ogDir, "blog-pt"), { recursive: true });
mkdirSync(join(root, "public/art/social"), { recursive: true });

async function resolveBg(bg, key) {
  if (typeof bg === "string") return join(root, "public", bg);
  const out = join(bgDir, `${key}.png`);
  if (!existsSync(out) || FORCE_GEN) {
    console.log(`gen bg: ${key}…`);
    await genBg(bg.gen, out);
  }
  return out;
}

// Pages (EN + PT mirrors)
for (const p of PAGES) {
  const bgPath = await resolveBg(p.bg, p.out);
  await composite(bgPath, ogSvg({ w: 1200, h: 630, ...p }), join(ogDir, `${p.out}.png`), 1200, 630);
  console.log(`og: ${p.out}.png`);
  const ptTitle = PAGES_PT[p.out];
  if (ptTitle) {
    await composite(
      bgPath,
      ogSvg({ w: 1200, h: 630, kicker: p.kicker, title: ptTitle }),
      join(ogDir, `pt-${p.out}.png`),
      1200, 630
    );
    console.log(`og: pt-${p.out}.png`);
  }
}

// Blog posts (EN + PT), backgrounds are the existing covers
for (const f of readdirSync(join(root, "src/content/blog")).filter((f) => f.endsWith(".md"))) {
  const slug = f.replace(/\.md$/, "");
  const title = readTitle(join(root, "src/content/blog", f));
  const cover = join(root, "public/art/blog", `${slug}.png`);
  if (!title || !existsSync(cover)) {
    console.warn(`skip ${slug}: ${!title ? "no title" : "no cover"}`);
    continue;
  }
  await composite(cover, ogSvg({ w: 1200, h: 630, kicker: "RUBENMARCUS.DEV /BLOG", title }), join(ogDir, "blog", `${slug}.png`), 1200, 630);
  console.log(`og: blog/${slug}.png`);
}
for (const f of readdirSync(join(root, "src/content/blog-pt")).filter((f) => f.endsWith(".md"))) {
  const slug = f.replace(/\.md$/, "");
  const title = readTitle(join(root, "src/content/blog-pt", f));
  const cover = join(root, "public/art/blog", `${slug}.png`);
  if (!title || !existsSync(cover)) {
    console.warn(`skip pt/${slug}: ${!title ? "no title" : "no cover"}`);
    continue;
  }
  await composite(cover, ogSvg({ w: 1200, h: 630, kicker: "RUBENMARCUS.DEV /BLOG", title }), join(ogDir, "blog-pt", `${slug}.png`), 1200, 630);
  console.log(`og: blog-pt/${slug}.png`);
}

// Social banners
for (const s of SOCIAL) {
  const key = s.out.includes("linkedin") ? "banner-linkedin" : "banner-x";
  const bgPath = await resolveBg(s.bg, key);
  await composite(bgPath, socialSvg(s), join(root, "public", s.out), s.w, s.h);
  console.log(`social: ${s.out}`);
}

console.log("done");
