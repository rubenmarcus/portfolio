#!/usr/bin/env node
/**
 * Generate the hero typing loop with Veo 3 (image-to-video) from
 * public/art/ruben-hero-scan.png. Output: public/art/ruben-hero-loop.mp4
 *
 * Usage: node scripts/gen-hero-video.mjs [fast|full]   (default fast)
 *
 * Requires GEMINI_API_KEY in .env with AI Studio prepaid credits
 * (https://ai.studio/projects). Veo has no free tier. Key is never printed.
 */

import { readFileSync, writeFileSync } from "node:fs";
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
const KEY = env.GEMINI_API_KEY;
if (!KEY) {
  console.error("GEMINI_API_KEY missing in .env");
  process.exit(1);
}

const MODEL =
  process.argv[2] === "full" ? "veo-3.0-generate-001" : "veo-3.0-fast-generate-001";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

const image = readFileSync(join(root, "public/art/ruben-hero-scan.png")).toString("base64");

const PROMPT = `The man types continuously on the laptop keyboard: fingers articulate and press keys with natural weight and rhythm, hands stay on the keyboard, subtle head movement as he reads the screen, faint breathing motion in the shoulders. Everything else stays still. The green phosphor scanline render style, the black background, the framing and the color tone remain EXACTLY as in the source image — no camera movement, no cuts, no new elements. The motion should loop seamlessly: end in a pose close to the start.`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log(`submitting to ${MODEL}…`);
const submit = await fetch(`${BASE}/models/${MODEL}:predictLongRunning`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-goog-api-key": KEY },
  body: JSON.stringify({
    instances: [
      { prompt: PROMPT, image: { bytesBase64Encoded: image, mimeType: "image/png" } },
    ],
    parameters: { aspectRatio: "16:9", resolution: "1080p", negativePrompt: "camera movement, zoom, scene change, color change, realistic skin, photorealistic" },
  }),
});
const op = await submit.json();
if (!submit.ok) {
  console.error(`HTTP ${submit.status}`, JSON.stringify(op).slice(0, 600));
  process.exit(1);
}
console.log(`operation: ${op.name}`);

// poll
let status = op;
while (!status.done) {
  await sleep(10000);
  const r = await fetch(`${BASE}/${op.name}`, { headers: { "x-goog-api-key": KEY } });
  status = await r.json();
  console.log(status.done ? "done" : "still running…");
  if (status.error) {
    console.error("FAILED", JSON.stringify(status.error).slice(0, 600));
    process.exit(1);
  }
}

const video = status.response?.generateVideoResponse?.generatedSamples?.[0]?.video;
if (!video?.uri) {
  console.error("no video in response", JSON.stringify(status).slice(0, 600));
  process.exit(1);
}
const dl = await fetch(`${video.uri}&key=${KEY}`);
if (!dl.ok) {
  console.error(`download failed: HTTP ${dl.status}`);
  process.exit(1);
}
const out = join(root, "public/art/ruben-hero-loop.mp4");
writeFileSync(out, Buffer.from(await dl.arrayBuffer()));
console.log(`saved ${out}`);
