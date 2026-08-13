#!/usr/bin/env node
/**
 * Generate blog post covers — same visual language as the product art:
 * dense luminous green particle forms on pure black, one specific motif
 * per post. Output: public/art/blog/<slug>.png
 *
 * Usage: node scripts/gen-blog-covers.mjs [slug|all]
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

const STYLE = `A dense luminous swarm of tiny phosphor-green (#00ff41) particles, sparks and hairline light-trails on a 100% pure black background, forming the motif below. Organic depth and parallax, soft phosphor bloom, subtle dot-matrix grain, cinematic contrast, wide 16:9 composition with generous black margins. STRICTLY no text, no letters, no logos, no people, no solid fills, no other colors. Dark analog occult-techno mood.`;

const COVERS = {
  "from-prompt-to-product-five-ways-to-build-with-ai":
    "one bright particle artifact traveling through five concentric transformation gates, beginning as a loose spark cloud and emerging as one precise finished geometric object",
  "frontend-ai-harness-prompt-to-pull-request":
    "a glowing wireframe browser window held inside a layered particle test rig, several agent trails entering through measured checkpoints and one clean merge beam exiting",
  "automating-entire-workflows-with-ralph-starter":
    "a branching particle tree like a git graph folding back into itself through glowing loop arrows, one bright merge node at the center",
  "autoresearcher-pareto-frontier":
    "a rising staircase frontier curve drawn in hot bright particles, with a vast dimmer swarm of candidate points scattered below it",
  "getting-started-with-next-js-strapi-security-first":
    "a particle shield hovering over a stack of glowing strata blocks, faint lock-shaped lattice at the shield's core",
  "how-i-hit-1-qec-using-ai":
    "a particle lattice of qubit nodes with one snaking brighter error-chain being pulled straight, correction ripples spreading outward",
  "i-built-my-portfolio-with-a-fleet-of-ai-agents":
    "a fleet of small particle drones flying in formation, together assembling the glowing wireframe outline of a webpage",
  "mini-shai-hulud-dependency-risk":
    "a giant particle sandworm coiling around a cluster of glowing package cubes, grains of sand-like dust trailing off",
  "shipping-a-browser-fps":
    "a particle crosshair reticle over a sweeping arena corridor of light trails, tracer rounds streaking past in long exposure",
  "the-agent-swarm-that-took-1-on-ecdsa-fail":
    "a particle elliptic curve with one eruption point multiplying into orbiting trajectories, a single glowing summit star above",
  "why-use-next-js-strapi":
    "a tall particle N monogram rising from layered glowing strata, scaffolding beams of light around it",
  "rag-in-production":
    "a vast particle library of glowing shelves, one query beam pulling a cluster of bright chunks out of the dark",
  "context-engineering":
    "a wide particle field being compressed through a glowing funnel into one tight bright beam",
  "dag-agent-orchestration":
    "a directed acyclic graph of particle nodes and arrowed light edges flowing downward, parallel branches rejoining",
  "openrouter-routing":
    "a particle star-map of provider nodes with one central router splitting a beam into many glowing paths",
  "mastra-field-notes":
    "a tall ship mast built of particles with rigging lines of light, small agent birds orbiting it",
  "vercel-ai-sdk-streaming":
    "a stream of particles flowing left to right, progressively filling a wireframe chat bubble that glows brighter as it fills",
  "aeo-what-it-moves":
    "a particle lighthouse casting one sweeping beam over a dark sea of document-shaped dots that light up as it passes",
  "agents-welcome-portfolio":
    "a glowing particle doorway standing open in the dark, small agent drones flying through it toward a warm lit terminal",
  "cs-brasil-ai-harness":
    "small particle agent drones circling a glowing arena crosshair, one drone running a test sweep along the walls",
  "llm-cross-pollination":
    "four distinct particle streams arriving from different corners, crossing and braiding into one thicker braided beam, pollen-like sparks exchanging between the streams",
  "agent-command-center":
    "a central particle control tower with radiating ledger lines, small worker drones docking and undocking along the beams, one bright ordered queue of dots",
  "agent-ai-runtime":
    "a central glowing particle brain routing bright beams into five separate constellation clusters, each cluster with its own orbit style",
  "agent-sdk":
    "an open particle toolbox with a glowing manifest scroll unrolling into small tool-shaped glyphs",
  "agent-uniswap":
    "the Uniswap unicorn head logo, rearing unicorn silhouette with its spiral horn, formed entirely of glowing particles, instantly recognizable",
  "agent-gnosis-pilot":
    "the Gnosis owl logo, a geometric owl face with sharp symmetric facets, formed entirely of glowing particles, instantly recognizable",
  "agent-registry":
    "a particle card-catalog of glowing index cards in the dark, one card being pulled out and scanned by a beam",
  "agent-polymarket":
    "a particle balance scale weighing two glowing outcome bubbles, faint candlestick bars of light rising behind it",
  "agent-intents":
    "three rivers of particles flowing from different origins and merging into one bright delta",
  "agent-meme-cooking":
    "a particle cauldron launching a small bright rocket, confetti-like sparks trailing behind it",
  "agent-solana-assistant":
    "the Solana logo, three slanted parallelogram bars stacked with the middle one offset, formed entirely of glowing particles, instantly recognizable",
  "agent-jupiter":
    "a giant particle planet wrapped in glowing swap lanes, two token streams exchanging paths along the brightest ring",
  "agent-morpho":
    "the Morpho protocol logo, a stylized butterfly mark with two symmetric wings, formed entirely of glowing particles, instantly recognizable",
  "agent-aerodrome":
    "the Aerodrome Finance logo, a bold triangular letter A with an aerodynamic swoosh, formed entirely of glowing particles, instantly recognizable",
  "agent-walrus":
    "a particle walrus stacking glowing data cubes onto an icy shelf, one cube being stamped with a seal of light",
  "agent-sui-assistant":
    "the Sui logo, a single rounded water droplet silhouette, formed entirely of glowing particles, instantly recognizable",
  "agent-ens":
    "the ENS logo, a faceted diamond-gem crystal mark, formed entirely of glowing particles, instantly recognizable",
  "agent-snapshot":
    "a particle ballot box with glowing proposal cards feeding in, one vote beam stamping a card mid-air",
  "agent-sui-forge":
    "a particle blacksmith anvil where language-shaped sparks are hammered into a glowing contract glyph",
  "agent-frontier-dissector":
    "a particle scalpel dissecting a glowing crystal layer by layer, each peeled layer trailing fine light filaments",
  "agent-circuit-engineer":
    "a particle circuit board with one bright kernel path being rerouted through shorter glowing traces",
  "agent-density-analyst":
    "a particle histogram of dense clusters, one peak crossing a glowing threshold line drawn across the dark",
  "agent-cuda-engineer":
    "a particle GPU die with thousands of tiny thread-lanes lighting up in warps, one kernel lane glowing hotter than the rest",
  "agent-pod-manager":
    "a particle contract scroll hovering over a rack of glowing server pods, a hard cut-off line severing one pod that crossed its ceiling",
  "agent-research-scout":
    "a particle scout drone sweeping a dark library of paper-shaped dots, beams routing between three glowing waypoints",
  "agent-orchestrator-reviewer":
    "a particle inspector stamping a glowing report card, checkmarks aligning into strict labeled rows of light",
  "agent-combinator":
    "several partial particle arcs arriving from different branches, being welded into one complete glowing ring",
  "agent-gauntlet-critics":
    "seven particle judge drones surrounding a glowing game screen, each holding a small scorecard of light",
  "agent-gauntlet-builders":
    "many particle builder drones welding disjoint glowing sections of one huge wireframe file, dim red no-fly gaps between the sections",
  "agent-regression-hunter":
    "a particle detective with a magnifier comparing two glowing frames side by side, one dimmed corner circled in light",
  "agent-bug-hunter":
    "a particle hunter measuring a glowing insect-like glitch with a ruler of light, a discarded false-lead sign cracked on the ground nearby",
  "agent-asset-review":
    "a newly forged particle helmet prop rotating on a turntable under a hard inspection beam, a stern drone circling it, faint measurement ticks radiating from the surface",
  "agent-regua":
    "a long particle measuring rod laid across a dark gap, its graduation marks flaring bright where a small mutant spark strikes it",
  "agent-content-pipeline":
    "a particle conveyor carrying a helmet, a city block and a weapon crate, each assembling from loose sparks as it advances along the line",
  "agent-faction-pipeline":
    "a particle crest igniting at the center of a ring, small emblem tiles, a banner and a sound waveform sliding into their slots around it",
  "evals-are-the-product":
    "a glowing particle bullseye being measured by two calipers of light, small mutant sparks breaking off a ruler and getting caught by a grid",
  "inside-the-gauntlet-loop":
    "a circular particle arena seen at an angle, a bright builder light-trail looping inside it chased by a sharper hunter trail, stern judge drones orbiting the rim holding glowing scorecards",
};

const which = process.argv[2] ?? "all";
const picks = which === "all" ? Object.keys(COVERS) : [which];

const outDir = join(root, "public/art/blog");
mkdirSync(outDir, { recursive: true });

for (const slug of picks) {
  const motif = COVERS[slug];
  if (!motif) {
    console.error(`unknown cover "${slug}"`);
    process.exit(1);
  }
  console.log(`${slug}: generating…`);
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      modalities: ["image", "text"],
      messages: [{ role: "user", content: [{ type: "text", text: `${STYLE}\nMOTIF: ${motif}.` }] }],
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
