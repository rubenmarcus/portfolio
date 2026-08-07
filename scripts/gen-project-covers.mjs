#!/usr/bin/env node
/**
 * Generate green-wireframe cover art for highlighted portfolio projects
 * via OpenRouter (gemini-2.5-flash-image). Same visual language as the
 * tool clips: pure black void, phosphor green (#00ff41) wireframe forms.
 *
 * Usage: node scripts/gen-project-covers.mjs [slug|all]
 * Output: public/art/covers/<slug>.png
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

const STYLE = `A dense luminous swarm of tiny phosphor-green (#00ff41) particles, sparks and hairline light-trails on a 100% pure black background, forming the motif below. Organic depth and parallax, soft phosphor bloom, subtle dot-matrix grain, cinematic contrast, wide composition with generous black margins. STRICTLY no text, no letters, no logos, no people, no solid fills, no other colors. Dark analog occult-techno mood.`;

const COVERS = {
  "ralph-starter": "a glowing swarm flowing through a closed conveyor loop, bright commit nodes orbiting and merging into one pulsing core",
  autoresearcher: "a rising staircase frontier curve drawn in hot bright particles, a vast dimmer swarm of candidate points below it",
  aeojs: "a radar wave of light sweeping across a field of particles, revealing a constellation of document-like nodes that stay lit",
  "ecdsa-fail": "a particle elliptic curve with one eruption point multiplying into orbiting trajectories",
  "qec-decoder": "a particle lattice of qubit nodes with one snaking brighter error-chain being pulled straight",
  mirofish: "a school of particle fish swirling in formation through dark water, dust trailing",
  "bitte-agent-sdk": "a cube of interlocking particle modules connected by beams of light",
  "bitte-ai-runtime": "a particle engine core with concentric orbiting rings and streams of dots flowing through",
  corosolto: "a particle crosshair over a sweeping arena corridor of light trails",
  "aeo-checker": "a particle gauge dial with a needle pointing high, concentric score rings of glowing dots",
  scanrepo: "a particle file-tree whose branches end in small glowing cubes, one branch lit up under a magnifying ring",
};

const which = process.argv[2] ?? "all";
const picks = which === "all" ? Object.keys(COVERS) : [which];

const outDir = join(root, "public/art/covers");
mkdirSync(outDir, { recursive: true });

for (const slug of picks) {
  const motif = COVERS[slug];
  if (!motif) {
    console.error(`unknown cover "${slug}" (${Object.keys(COVERS).join("|")}|all)`);
    process.exit(1);
  }
  console.log(`${slug}: generating…`);
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      modalities: ["image", "text"],
      messages: [
        { role: "user", content: [{ type: "text", text: `${STYLE}\nMOTIF: ${motif}.` }] },
      ],
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
