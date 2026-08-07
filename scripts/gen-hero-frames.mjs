#!/usr/bin/env node
/**
 * Generate typing-animation frames for the hero: same image as
 * public/art/ruben-hero-scan.png, only the hands change (different
 * mid-keystroke positions). Output: public/art/ruben-hero-scan-frame-<n>.png
 *
 * Usage: node scripts/gen-hero-frames.mjs [count]   (default 2)
 * Key handling: reads OPENROUTER_API_KEY from .env; never prints it.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
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

const base = readFileSync(join(root, "public/art/ruben-hero-scan.png")).toString("base64");
const count = Number(process.argv[2] ?? 2);
const OFFSET = 6; // new strict-typing set starts at frame-7

const POSES = [
  "BOTH hands stay flat on the laptop keyboard in a typing position — only the FINGERS change: different fingers pressing different keys. No hand is raised, no hand leaves the keyboard",
  "BOTH hands stay flat on the laptop keyboard in a typing position — only the FINGERS change: index and middle fingers of the right hand pressing keys, left hand fingers resting on keys. No hand is raised, no hand leaves the keyboard",
  "BOTH hands stay flat on the laptop keyboard in a typing position — only the FINGERS change: left hand fingers curled pressing keys on the left side, right hand fingers extended. No hand is raised, no hand leaves the keyboard",
  "BOTH hands stay flat on the laptop keyboard in a typing position — only the FINGERS change: fingers of both hands mid-press on different keys, thumbs near the spacebar. No hand is raised, no hand leaves the keyboard",
  "BOTH hands stay flat on the laptop keyboard in a typing position — only the FINGERS change: right pinky reaching a far key, other fingers on home row. No hand is raised, no hand leaves the keyboard",
  "BOTH hands stay flat on the laptop keyboard in a typing position — only the FINGERS change: left hand reaching upper keys, right hand fingers on home row. No hand is raised, no hand leaves the keyboard",
];

const prompt = (pose) => `Edit this exact image. Keep EVERYTHING identical — same man, same face, same tattoos, same headphones, same laptop, same framing, same black background, same green phosphor scanline/dither render style, same color tone. Change ONLY the hands: ${pose}. The head may tilt down a barely-perceptible amount, nothing else moves. The result must look like the next frame of the same scene, not a new image.`;

for (let i = 0; i < count; i++) {
  const out = join(root, `public/art/ruben-hero-scan-frame-${i + 1 + OFFSET}.png`);
  if (existsSync(out)) {
    console.log(`frame ${i + 1}: exists, skipping (${out})`);
    continue;
  }
  console.log(`frame ${i + 1}: generating…`);
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
            { type: "text", text: prompt(POSES[i % POSES.length]) },
            { type: "image_url", image_url: { url: `data:image/png;base64,${base}` } },
          ],
        },
      ],
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    console.error(`frame ${i + 1}: HTTP ${res.status}`, JSON.stringify(json).slice(0, 400));
    continue;
  }
  const dataUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? "";
  const b64 = dataUrl.startsWith("data:") ? dataUrl.split(",")[1] : undefined;
  if (!b64) {
    console.error(`frame ${i + 1}: no image`, JSON.stringify(json).slice(0, 400));
    continue;
  }
  writeFileSync(out, Buffer.from(b64, "base64"));
  console.log(`frame ${i + 1}: saved ${out}`);
}
