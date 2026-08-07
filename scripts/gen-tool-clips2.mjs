#!/usr/bin/env node
/**
 * Animate the ref-style tool frames (public/art/frames/<slug>.png) into
 * clips via OpenRouter image-to-video (Veo) — first frame == last frame so
 * the loop is seamless. Motion stays subtle: the frame art does the work.
 *
 * Usage: node scripts/gen-tool-clips2.mjs [slug|all]
 * Output: public/art/clips/<slug>.mp4 (convert to .webm with ffmpeg after)
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

const MOTION = {
  "ralph-starter":
    "The arcs of the cycle diagram rotate slowly and continuously around the three glyphs, arrowheads travelling along the loop. The glyphs pulse faintly in sequence. Everything else stays perfectly still: the dot-matrix, the tick marks, the composition. No camera movement, no morphing, no new elements, no text.",
  autoresearcher:
    "The scattered crosses drift gently upward like a slow starfield while the frontier curve brightens and dims in a slow breathing pulse. A few circles highlight candidate points one after another. Everything else stays perfectly still. No camera movement, no morphing, no new elements, no text.",
  "aeojs":
    "The radar wedge sweeps around the reticle in one slow continuous rotation; the square blips flash briefly as the beam passes over them, then fade. Everything else stays perfectly still. No camera movement, no morphing, no new elements, no text.",
  "corosolto":
    "The crosshair reticle breathes with a slow zoom pulse (2-3% scale), the mil-dots flash in sequence along the horizontal axis, and the corner brackets tighten and loosen slightly. Everything else stays perfectly still. No camera movement, no morphing, no new elements, no text.",
  "scanrepo":
    "The magnifying bracket-frame slides slowly down the file tree, pausing on each branch; the inspected branch brightens while the frame rests. Everything else stays perfectly still. No camera movement, no morphing, no new elements, no text.",
  "aeo-checker":
    "The gauge needle sways gently in a narrow arc and the calibration rings breathe with a slow 2% scale pulse; the globe wireframe rotates very slowly. Everything else stays perfectly still. No camera movement, no morphing, no new elements, no text.",
};

const SHARED = `The image remains COMPLETELY STABLE otherwise: the dot-matrix texture does not change, no static, no noise, no flicker, no color shift, pure black background stays pure black. End in a state close to the start so the clip loops seamlessly.`;

const which = process.argv[2] ?? "all";
const picks = which === "all" ? Object.keys(MOTION) : [which];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const slug of picks) {
  const motion = MOTION[slug];
  if (!motion) {
    console.error(`unknown clip "${slug}" (${Object.keys(MOTION).join("|")}|all)`);
    process.exit(1);
  }
  const image = readFileSync(join(root, `public/art/frames/${slug}.png`)).toString("base64");
  const dataUrl = `data:image/png;base64,${image}`;

  console.log(`${slug}: submitting…`);
  const submit = await fetch("https://openrouter.ai/api/v1/videos", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: "google/veo-3.1-fast",
      prompt: `${motion} ${SHARED}`,
      duration: 8,
      resolution: "720p",
      aspect_ratio: "16:9",
      generate_audio: false,
      frame_images: [
        { type: "image_url", image_url: { url: dataUrl }, frame_type: "first_frame" },
        { type: "image_url", image_url: { url: dataUrl }, frame_type: "last_frame" },
      ],
    }),
  });
  const job = await submit.json();
  if (!submit.ok) {
    console.error(`${slug}: HTTP ${submit.status}`, JSON.stringify(job).slice(0, 600));
    continue;
  }
  console.log(`${slug}: job ${job.id} — polling…`);

  let status = job;
  while (status.status !== "completed" && status.status !== "failed") {
    await sleep(15000);
    const r = await fetch(job.polling_url, { headers: { authorization: `Bearer ${KEY}` } });
    status = await r.json();
    console.log(`${slug}: ${status.status}`);
    if (status.status === "failed") {
      console.error(`${slug}: FAILED:`, status.error ?? JSON.stringify(status).slice(0, 400));
      break;
    }
  }
  if (status.status !== "completed") continue;

  console.log(`${slug}: cost $${status.usage?.cost ?? "?"}`);
  const dl = await fetch(`https://openrouter.ai/api/v1/videos/${job.id}/content?index=0`, {
    headers: { authorization: `Bearer ${KEY}` },
  });
  if (!dl.ok) {
    console.error(`${slug}: download failed HTTP ${dl.status}`);
    continue;
  }
  const out = join(root, `public/art/clips/${slug}.mp4`);
  writeFileSync(out, Buffer.from(await dl.arrayBuffer()));
  console.log(`${slug}: saved ${out}`);
}
console.log("done");
