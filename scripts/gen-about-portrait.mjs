#!/usr/bin/env node
/**
 * Generate the About-page portrait — the reference face photo re-rendered in
 * the site's cover language: dense phosphor-green particles on pure black.
 * The page crossfades particle portrait → real photo on hover.
 *
 * Usage: node scripts/gen-about-portrait.mjs
 * Output: public/art/about-portrait.png
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

const ref = readFileSync(join(root, "public/rubenmarcus.jpeg")).toString("base64");

const prompt = `Recreate the man in the reference photo as a portrait made of a dense luminous swarm of tiny phosphor-green (#00ff41) particles, sparks and hairline light-trails on a 100% pure black background. Keep his exact likeness, face structure, glasses, beard and hair recognizable — the face formed by the particle density itself, brighter where the photo is brighter. Soft phosphor bloom, subtle dot-matrix grain, cinematic contrast, square composition with generous black margins, same framing as the reference. STRICTLY no text, no letters, no solid fills, no other colors. Dark analog occult-techno mood, same style as a CRT oscilloscope render.`;

console.log("about-portrait: generating…");
const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
  body: JSON.stringify({
    model: "google/gemini-2.5-flash-image",
    modalities: ["image", "text"],
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${ref}` } },
        ],
      },
    ],
  }),
});
const json = await res.json();
if (!res.ok) {
  console.error(`HTTP ${res.status}`, JSON.stringify(json).slice(0, 400));
  process.exit(1);
}
const images = json.choices?.[0]?.message?.images ?? [];
const dataUrl = images[0]?.image_url?.url ?? "";
const b64 = dataUrl.startsWith("data:") ? dataUrl.split(",")[1] : undefined;
if (!b64) {
  console.error("no image in response", JSON.stringify(json).slice(0, 400));
  process.exit(1);
}
const outDir = join(root, "public/art");
mkdirSync(outDir, { recursive: true });
const out = join(outDir, "about-portrait.png");
writeFileSync(out, Buffer.from(b64, "base64"));
console.log(`saved ${out}`);
