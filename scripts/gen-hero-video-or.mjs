#!/usr/bin/env node
/**
 * Generate the hero typing loop with an OpenRouter video model
 * (image-to-video from public/art/ruben-hero-scan.png).
 * Output: public/art/ruben-hero-loop.mp4
 *
 * Usage: node scripts/gen-hero-video-or.mjs [model] [seconds]
 *   model   — OpenRouter slug (default google/veo-3.1-fast)
 *   seconds — clip length (default 8)
 *
 * Reads OPENROUTER_API_KEY from .env; never prints it.
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
const KEY = env.OPENROUTER_API_KEY;
if (!KEY) {
  console.error("OPENROUTER_API_KEY missing in .env");
  process.exit(1);
}

const MODEL = process.argv[2] ?? "google/veo-3.1-fast";
const SECONDS = Number(process.argv[3] ?? 8);

const image = readFileSync(join(root, "public/art/ruben-hero-scan.png")).toString("base64");

const PROMPT = `The man types on the laptop keyboard the ENTIRE time: fingers articulate and press keys continuously with natural weight and rhythm, hands always on the keyboard. His eyes stay locked on the screen with a neutral, focused expression — NO nodding, NO smiling, NO facial expression changes, mouth still, eyes steady. The image itself remains COMPLETELY STABLE: the scanline/dither texture does not change, no static, no noise, no signal effects, no flicker, no lightning, no glow — only his fingers, hands and subtle forearm motion move. No camera movement, no cuts, no color shift; the pure black background and framing remain EXACTLY as in the source image. CRITICAL: the green phosphor scanlines exist ONLY where they draw the man and the laptop — his face, head, headphones, arms, hands and the computer. Everywhere else the frame is 100% PURE BLACK: no scanlines, no grain, no texture, no haze, no vignette, no faint green wash in the empty areas. Do not extend, bleed or add any lines into the empty background — keep the void absolutely black at all times. End in a pose close to the start so the clip loops seamlessly.`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log(`submitting to ${MODEL} (${SECONDS}s, 720p)…`);
const submit = await fetch("https://openrouter.ai/api/v1/videos", {
  method: "POST",
  headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
  body: JSON.stringify({
    model: MODEL,
    prompt: PROMPT,
    duration: SECONDS,
    resolution: "720p",
    aspect_ratio: "16:9",
    generate_audio: false,
    frame_images: [
      {
        type: "image_url",
        image_url: { url: `data:image/png;base64,${image}` },
        frame_type: "first_frame",
      },
      {
        type: "image_url",
        image_url: { url: `data:image/png;base64,${image}` },
        frame_type: "last_frame",
      },
    ],
  }),
});
const job = await submit.json();
if (!submit.ok) {
  console.error(`HTTP ${submit.status}`, JSON.stringify(job).slice(0, 800));
  process.exit(1);
}
console.log(`job ${job.id} — polling…`);

let status = job;
while (status.status !== "completed" && status.status !== "failed") {
  await sleep(15000);
  const r = await fetch(job.polling_url, { headers: { authorization: `Bearer ${KEY}` } });
  status = await r.json();
  console.log(status.status);
  if (status.status === "failed") {
    console.error("FAILED:", status.error ?? JSON.stringify(status).slice(0, 500));
    process.exit(1);
  }
}

console.log(`cost: $${status.usage?.cost ?? "?"}`);
const dl = await fetch(`https://openrouter.ai/api/v1/videos/${job.id}/content?index=0`, {
  headers: { authorization: `Bearer ${KEY}` },
});
if (!dl.ok) {
  console.error(`download failed: HTTP ${dl.status}`);
  process.exit(1);
}
const out = join(root, `public/art/ruben-hero-loop-${Date.now()}.mp4`);
writeFileSync(out, Buffer.from(await dl.arrayBuffer()));
console.log(`saved ${out}`);
