#!/usr/bin/env node
/**
 * Generate green 3D-wireframe logo renders for client/brand cards.
 * Famous marks are redrawn from the model's knowledge; lesser-known ones
 * (quantum, bitte, mintbase) pass a reference image fetched from the web.
 *
 * Usage: node scripts/gen-logo-wireframe.mjs [slug|all]
 * Output: public/art/logos/<slug>.png
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

const STYLE = (brand, extra) => `The ${brand} logo, redrawn as a glowing phosphor-green (#00ff41) 3D WIREFRAME sculpture on a 100% pure black background — the exact ${brand} mark and wordmark, built from thin green mesh lines and dot lattices, like a CRT oscilloscope render of the logo. Subtle phosphor bloom, faint dot-matrix grid behind, generous black margins, centered composition. STRICTLY no other colors, no solid fills, no background scenery, no extra text. ${extra}`;

// brand slug → prompt; ref: optional image to pass as reference
const LOGOS = {
  panasonic: { prompt: STYLE("Panasonic", "The wordmark letters drawn as hollow wireframe tubes.") },
  samsung: { prompt: STYLE("Samsung", "The wordmark inside its oval ellipse, all in wireframe mesh.") },
  itau: {
    prompt: STYLE("Itaú", "Reproduce the reference EXACTLY: the lowercase 'itaú' wordmark, its exact letterforms, inside the rounded-square badge. Wireframe mesh."),
    ref: "/tmp/logos/itau.com.br.png",
  },
  santander: { prompt: STYLE("Santander", "The flame symbol plus wordmark of the bank, wireframe mesh.") },
  "under-armour": { prompt: STYLE("Under Armour", "The overlapping U/A monogram, wireframe mesh.") },
  flamengo: {
    prompt: STYLE("Flamengo (Clube de Regatas do Flamengo, the Brazilian football club)", "Reproduce the GEOMETRY of the reference EXACTLY: the intertwined CRF monogram — the big C wrapping around the R, the F sharing the top stroke — inside the upper-left box, with the horizontal stripes of the shield below. CRITICAL: ignore the reference colors completely — no red, no white, no cream, no solid fills. Only phosphor-green wireframe lines and dot lattices on pure black, the stripes shown as stacked wireframe bands."),
    ref: "/tmp/logos/flamengo.png",
  },
  grover: {
    prompt: STYLE("Grover", "Reproduce the reference EXACTLY: the imperfect hand-drawn ring/circle mark, plus the Grover wordmark below it. Wireframe mesh."),
    ref: "/tmp/logos/grover.com.png",
  },
  quantum: {
    prompt: STYLE("Quantum (the post-quantum L1 blockchain at quantum.systems)", "Follow the reference mark closely."),
    ref: "/tmp/logos/quantum.systems.png",
  },
  bitte: {
    prompt: STYLE("Bitte Protocol", "Follow the reference mark closely."),
    ref: "/tmp/logos/bitte.ai.png",
  },
  mintbase: {
    prompt: STYLE("Mintbase", "Follow the reference mark closely."),
    ref: "/tmp/logos/mintbase.io.png",
  },
  cyrela: { prompt: STYLE("Cyrela", "The Cyrela real-estate wordmark, wireframe mesh.") },
  estadao: {
    prompt: STYLE("Estadão (O Estado de S. Paulo newspaper)", "Reproduce the reference EXACTLY: the knight on horseback heraldic mark, plus the Estadão serif wordmark below. Wireframe mesh."),
    ref: "/tmp/logos/estadao.com.br.png",
  },
  monsanto: { prompt: STYLE("Monsanto", "The Monsanto wordmark with its leaf-vine M symbol, wireframe mesh.") },
  centauro: {
    prompt: STYLE("Centauro", "Reproduce the reference EXACTLY: the dynamic C swoosh with speed-line cuts, plus the Centauro wordmark below. Wireframe mesh."),
    ref: "/tmp/logos/centauro.com.br.png",
  },
  printi: { prompt: STYLE("Printi", "The Printi online-printing wordmark, wireframe mesh.") },
  jsl: { prompt: STYLE("JSL", "The JSL logistics letters with their road-swoosh, wireframe mesh.") },
  near: {
    prompt: STYLE("NEAR Protocol", "Reproduce the reference EXACTLY: the angular overlapping-stroke N glyph. Wireframe mesh, no wordmark."),
    ref: "/tmp/logos/near.org.png",
  },
  sui: { prompt: STYLE("Sui", "The Sui water-droplet mark plus wordmark, wireframe mesh.") },
  ethereum: { prompt: STYLE("Ethereum", "The octahedron diamond mark, wireframe mesh.") },
  eigenlabs: { prompt: STYLE("EigenLayer", "The EigenLayer cube-of-cubes mark, wireframe mesh.") },
  cowswap: {
    prompt: STYLE("CoW Swap", "Reproduce the reference EXACTLY: the cow-head mark with its ear/horn shapes inside the circle. Wireframe mesh."),
    ref: "/tmp/logos/cow.fi.png",
  },
  solana: { prompt: STYLE("Solana", "The three slanted parallelogram bars of the Solana mark, wireframe mesh.") },
  jupiter: {
    prompt: STYLE("Jupiter (the Solana DEX aggregator)", "Reproduce the reference EXACTLY: the Jupiter cat-astronaut mark. Wireframe mesh."),
    ref: "/tmp/logos/jup.ag.png",
  },
  stackspot: {
    prompt: STYLE("StackSpot", "Reproduce the reference EXACTLY: the hexagonal hive of dots forming an S spiral, plus the StackSpot wordmark below. Wireframe mesh."),
    ref: "/tmp/logos/stackspot.com.png",
  },
};

const which = process.argv[2] ?? "all";
const picks = which === "all" ? Object.keys(LOGOS) : [which];

const outDir = join(root, "public/art/logos");
mkdirSync(outDir, { recursive: true });

for (const slug of picks) {
  const { prompt, ref } = LOGOS[slug];
  if (!prompt) {
    console.error(`unknown logo "${slug}"`);
    process.exit(1);
  }
  console.log(`${slug}: generating…`);
  const content = [{ type: "text", text: prompt }];
  if (ref) {
    try {
      const b64 = readFileSync(ref).toString("base64");
      content.push({ type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } });
    } catch {
      console.warn(`${slug}: reference ${ref} not found, text-only`);
    }
  }
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      modalities: ["image", "text"],
      messages: [{ role: "user", content }],
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
