#!/usr/bin/env node
/**
 * Generate abstract green-wireframe clips for the Open Source tool cards
 * via OpenRouter text-to-video (Veo). Style target: ref/2 — pure black
 * void, phosphor green (#00ff41) wireframe forms, hypnotic drift.
 *
 * Usage: node scripts/gen-tool-clips.mjs [slug|all]
 * Output: public/art/clips/<slug>.mp4
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

const MODEL = "google/veo-3.1-fast";

const STYLE = `Cinematic abstract wireframe animation on a 100% pure black background. Every form is drawn ONLY in thin glowing phosphor-green (#00ff41) wireframe lines, dot grids and scanline textures — CRT oscilloscope / terminal aesthetic with subtle phosphor bloom. STRICTLY NO text, NO letters, NO numbers, NO logos, NO people, NO faces, NO solid surfaces, NO colors other than green on black. Where there is no form the frame stays absolutely black. Slow, hypnotic, seamless-feeling camera drift. Dark analog occult-techno mood.`;

const CLIPS = {
  "ralph-starter": `${STYLE}
MOTIF: an endless looping pipeline of glowing wireframe machinery — code brackets, gear-like rotors and git-commit nodes flowing left to right through a conduit of green mesh, merging into a single pulsing node, then the cycle restarts. Mechanical, precise, rhythmic.`,
  autoresearcher: `${STYLE}
MOTIF: a swarm of glowing wireframe particles exploring dark space like a star field with intent — divergent trajectories that slowly converge onto a rising frontier curve made of green dots; the curve sharpens, holds, dissolves back into the swarm. Organic, searching, hypnotic.`,
  "aeojs": `${STYLE}
MOTIF: a radar scanline sweeping repeatedly across a tilted wireframe grid of document-like rectangles; wherever the beam passes, nodes and connection edges light up and stay glowing, mapping a network of citations. Precise, measured, scanning.`,
  "corosolto": `${STYLE}
MOTIF: a fast first-person flythrough of a glowing green wireframe arena — corridor walls of mesh rushing past, a pulsing crosshair reticle at center frame, muzzle-flash-like line bursts in the distance. Energetic but clean, video-game wireframe test-map aesthetic.`,
};

const which = process.argv[2] ?? "all";
const picks = which === "all" ? Object.keys(CLIPS) : [which];

const outDir = join(root, "public/art/clips");
mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const slug of picks) {
  const prompt = CLIPS[slug];
  if (!prompt) {
    console.error(`unknown clip "${slug}" (${Object.keys(CLIPS).join("|")}|all)`);
    process.exit(1);
  }
  console.log(`${slug}: submitting…`);
  const submit = await fetch("https://openrouter.ai/api/v1/videos", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      duration: 8,
      resolution: "720p",
      aspect_ratio: "16:9",
      generate_audio: false,
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
  const out = join(outDir, `${slug}.mp4`);
  writeFileSync(out, Buffer.from(await dl.arrayBuffer()));
  console.log(`${slug}: saved ${out}`);
}
console.log("done");
