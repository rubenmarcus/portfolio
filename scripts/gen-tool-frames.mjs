#!/usr/bin/env node
/**
 * Generate crisp ref-style first frames for the tool clips — flat 2D,
 * dot-matrix, hairline green on pure black (see ref/2). These frames are
 * the first/last frame input for gen-tool-clips2.mjs (image-to-video).
 *
 * Usage: node scripts/gen-tool-frames.mjs [slug|all]
 * Output: public/art/frames/<slug>.png
 *
 * Reads OPENROUTER_API_KEY from .env; never prints it.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env"), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const KEY = env.OPENROUTER_API_KEY;
if (!KEY) {
  console.error("OPENROUTER_API_KEY missing in .env");
  process.exit(1);
}

const STYLE = `Flat 2D technical-graphic illustration. Ultra-crisp hairline phosphor green (#00ff41) linework on a 100% pure black background, over a faint dense dot-matrix grid. Sharp vector-precision geometry: fine 1px lines, crosshair ticks, dashed measurement marks, small square registration marks, subtle CRT scanline texture. STRICTLY flat — NO 3D, NO perspective, NO glow haze, NO fog, NO bloom wash, NO gradients, NO text, NO letters, NO numbers, NO people. High contrast, poster-like composition with generous pure-black margins, y2k terminal-aesthetic.`;

const FRAMES = {
  "ralph-starter": `${STYLE}
MOTIF: an engineering cycle diagram — three small abstract geometric glyphs (a branching tree, a gear, an eye) arranged in a triangle, connected by crisp circular arcs with arrowheads forming a closed loop, dashed orbit rings, tick marks along the arcs.`,
  autoresearcher: `${STYLE}
MOTIF: a scatter field of small crosses and plus marks rising from the lower left toward a single crisp ascending frontier curve drawn in a hotter line, concentric measurement arcs centered off-frame, a few candidate points circled.`,
  "aeojs": `${STYLE}
MOTIF: a radar reticle — concentric hairline circles, one sweeping wedge sector slightly brighter, small square blips scattered at detection points, full-frame crosshair lines, corner registration brackets.`,
  "corosolto": `${STYLE}
MOTIF: a large sniper crosshair reticle — circle with perpendicular hairlines, range-finder tick marks, mil-dots along the horizontal axis, four corner brackets marking a capture zone, faint flat dot-grid floor suggested by dashed horizontal lines.`,
  "scanrepo": `${STYLE}
MOTIF: a repository tree under inspection — a vertical file-tree drawn in hairlines on the left (folder and file glyphs, NO text), with a large magnifying bracket-frame hovering over one branch, measurement ticks and a dashed baseline grid.`,
  "aeo-checker": `${STYLE}
MOTIF: a precision gauge dial — semicircular arc with fine tick marks and a needle pointing high, a small globe wireframe at the pivot, corner registration brackets, faint concentric calibration rings.`,
};

const which = process.argv[2] ?? "all";
const picks = which === "all" ? Object.keys(FRAMES) : [which];

const outDir = join(root, "public/art/frames");
mkdirSync(outDir, { recursive: true });

for (const slug of picks) {
  const prompt = FRAMES[slug];
  if (!prompt) {
    console.error(`unknown frame "${slug}" (${Object.keys(FRAMES).join("|")}|all)`);
    process.exit(1);
  }
  console.log(`${slug}: generating…`);
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      modalities: ["image", "text"],
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    console.error(`${slug}: HTTP ${res.status}`, JSON.stringify(json).slice(0, 400));
    continue;
  }
  const images = json.choices?.[0]?.message?.images ?? [];
  const dataUrl = images[0]?.image_url?.url ?? "";
  const b64 = dataUrl.startsWith("data:") ? dataUrl.split(",")[1] : undefined;
  if (!b64) {
    console.error(`${slug}: no image in response`, JSON.stringify(json).slice(0, 400));
    continue;
  }
  const out = join(outDir, `${slug}.png`);
  writeFileSync(out, Buffer.from(b64, "base64"));
  console.log(`${slug}: saved ${out}`);
}
console.log("done");
