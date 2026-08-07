#!/usr/bin/env node
/**
 * Generate hero artwork with Gemini "nano banana" (gemini-2.5-flash-image).
 *
 * Inputs:
 *   - public/reference/ruben-face.jpeg  (identity reference — Ruben's face)
 *   - ref/f3ba3e90a7b313cf5ff460ddfa825cd8.jpg (style reference — green phosphor contours)
 *
 * Usage:
 *   node scripts/gen-hero-image.mjs [variant]
 *   variant: 1|2|3|all  (default: all)
 *
 * Output: qa/hero-gen/variant-<n>-<ts>.png
 *
 * Key handling: reads keys from .env; never prints them.
 * Provider: GEN_PROVIDER=openrouter (default if OPENROUTER_API_KEY exists) or gemini.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- load .env (no dependency) -------------------------------------------
const envText = readFileSync(join(root, ".env"), "utf8");
const env = Object.fromEntries(
  envText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const KEY_GEMINI = env.GEMINI_API_KEY;
const KEY_OR = env.OPENROUTER_API_KEY;
const PROVIDER = env.GEN_PROVIDER ?? (KEY_OR ? "openrouter" : "gemini");
if (PROVIDER === "openrouter" && !KEY_OR) {
  console.error("OPENROUTER_API_KEY missing in .env");
  process.exit(1);
}
if (PROVIDER === "gemini" && !KEY_GEMINI) {
  console.error("GEMINI_API_KEY missing in .env");
  process.exit(1);
}

const MODEL =
  PROVIDER === "openrouter" ? "google/gemini-2.5-flash-image" : "gemini-2.5-flash-image";
const URL =
  PROVIDER === "openrouter"
    ? "https://openrouter.ai/api/v1/chat/completions"
    : `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const face = readFileSync(join(root, "public/reference/ruben-face.jpeg")).toString("base64");
const style = readFileSync(join(root, "ref/f3ba3e90a7b313cf5ff460ddfa825cd8.jpg")).toString("base64");

const STYLE_DESC = `
RENDER STYLE (follow the second reference image exactly):
- Black background, deep and empty.
- The entire scene is drawn as glowing phosphor-green (#00ff41) contour lines —
  dense horizontal scanlines that bend and flow over the surfaces of the subject,
  like a CRT topographic scan / 1980s wireframe oscilloscope portrait.
- Lines are continuous, thin, evenly spaced, with subtle waviness; denser where
  surfaces curve toward the viewer, sparse in shadowed areas.
- No solid fills, no gradients, no realistic shading, no color other than the
  green lines on black. Slight phosphor glow / bloom around the lines.
`.trim();

const IDENTITY = `
IDENTITY (follow the first reference photo exactly):
- The man from the photo: shaved head covered in gothic-letter tattoos, tattoos
  on his face and neck, short dark beard, strong eyebrows, wearing large black
  over-ear headphones.
- His face, head shape, beard and tattoo pattern must remain clearly HIS —
  this is a portrait of that specific person, not a generic man.
`.trim();

const STYLE_DESC_V2 = `
RENDER STYLE (follow the second reference image with absolute fidelity):
- Pure black background, deep and empty, faint film grain.
- The subject is drawn ONLY with dense, thin HORIZONTAL scanlines in phosphor
  green (#00ff41) — like a CRT oscilloscope scan or analog video feedback.
- The scanlines are continuous and flow left-to-right across the whole frame;
  they bend, warp and ripple where they pass over the subject's surfaces,
  mapping the 3D form purely through their waviness (topographic video-scan look).
- WHERE THERE IS NO SUBJECT, THE SCANLINES DISAPPEAR — the background stays
  pure empty black. Do NOT fill the background with lines.
- STRICTLY NO cross-hatching, NO mesh/net patterns, NO outline strokes, NO
  contour rings, NO solid fills, NO gradients. Only the flowing horizontal lines.
- Brightness varies psychedelically along the lines: hot glowing peaks on the
  most lit ridges of the face and hands, fading to dim ghost-lines in shadow.
- Slight phosphor bloom around the brightest lines; dark, hypnotic, analog
  occult-techno mood — not cartoon, not toy, not neon signage.
- The scanline warping is AGGRESSIVE and glitchy: ripples, tears and analog
  feedback distortions radiate from the laptop screen and across the subject,
  high contrast between hot glowing line-peaks and pure black. This raw
  dark-scanline texture is the most important quality of the image.
`.trim();

const ARMS = `His forearms are FULL BLACKWORK sleeves — from wrist to elbow both
forearms are ENTIRELY covered in solid black tattoo ink, dense opaque black
coverage with only small negative-space geometric gaps (rendered as solid dark
masses the scanlines flow over). NOT fine-line tattoos, NOT ornamental outlines —
heavy solid-black blackwork.`;

const VARIANTS = {
  1: `${IDENTITY}\n${STYLE_DESC}\n
SCENE: Three-quarter portrait of him seated at a desk, typing on an open laptop.
We see him from the side-front: head slightly bowed toward the screen, hands on
the keyboard, laptop silhouette in front of him, desk line below. Composition
fills the frame like the style reference — head and shoulders dominant, laptop
in the lower third.`,
  2: `${IDENTITY}\n${STYLE_DESC}\n
SCENE: Wide cinematic shot of him seated at a desk in profile, facing right,
typing on an open laptop. The desk, the chair back, the laptop and a coffee mug
are all drawn in the same green contour style. His body occupies the left half;
the right half is empty black space (room for website headline text).`,
  3: `${IDENTITY}\n${STYLE_DESC}\n
SCENE: Close-up of his head and hands over the laptop keyboard, seen from a low
three-quarter angle, like the style reference's framing. The glow of the laptop
screen is suggested by denser, brighter contour lines on his face. Headphones
on, focused expression, fingers mid-keystroke.`,
  4: `${IDENTITY}\n${STYLE_DESC_V2}\n
SCENE: Three-quarter portrait of him seated at a desk, typing on an open laptop.
Head slightly bowed toward the screen, hands on the keyboard, laptop silhouette
in the lower third. His form emerges from the pure black purely through the
warped horizontal scanlines — the face and hands glow hottest, the rest fades
into darkness.`,
  5: `${IDENTITY}\n${STYLE_DESC_V2}\n
SCENE: Close-up head-and-shoulders portrait framed like the style reference:
his face occupies the upper two-thirds, bowed slightly toward an unseen laptop
below the frame, headphones on. The gothic head tattoos distort the scanlines
across his shaved skull. Maximum likeness, maximum mood — a hypnotic analog
scan of a real person.`,
  6: `${IDENTITY}\n${STYLE_DESC_V2}\n
SCENE: His head and tattooed hands over the laptop keyboard, low three-quarter
angle. The laptop screen's glow is rendered as the brightest, densest scanline
peaks washing up over his face and beard. Hands mid-keystroke, fingers warping
the lines. Everything else falls to pure black.`,
  7: `${IDENTITY}\n${STYLE_DESC_V2}\n
SCENE: Three-quarter portrait of him seated at a desk, typing on an open laptop.
Head slightly bowed toward the screen, hands on the keyboard. CRITICAL FRAMING:
the ENTIRE laptop is fully visible inside the frame — lid, screen, keyboard,
base and all four corners — nothing is cropped by any edge of the image. His
head, headphones, shoulders and both hands are also fully inside the frame with
comfortable black margin around the whole composition. His form emerges from
the pure black purely through the warped horizontal scanlines — face and hands
glow hottest, the rest fades into darkness.`,
  8: `${IDENTITY}\n${STYLE_DESC_V2}\n
SCENE: Him bowed in concentration over the laptop, tattooed hands mid-keystroke
on the keyboard, low three-quarter angle. CRITICAL FRAMING: the ENTIRE laptop
is fully visible inside the frame — lid, screen, keyboard deck and base, all
four corners — nothing cropped by any edge. His whole head with headphones and
both forearms fully in frame, generous black margin around the composition.
The laptop screen's glow renders as the brightest, densest scanline peaks
washing up over his face and beard. Everything else falls to pure black.`,
  9: `${IDENTITY}\n${ARMS}\n${STYLE_DESC_V2}\n
SCENE: Three-quarter portrait of him seated at a desk, typing on an open
laptop, head slightly bowed toward the screen. CRITICAL FRAMING: the ENTIRE
laptop is fully visible inside the frame — lid, glowing screen, keyboard, base,
all four corners — nothing cropped by any edge. Head, headphones, shoulders and
both tattooed forearms fully in frame, comfortable black margin all around.
Face and hands glow hottest; glitchy scanline ripples radiate from the laptop
screen across his body; everything else pure black.`,
  10: `${IDENTITY}\n${ARMS}\n${STYLE_DESC_V2}\n
SCENE: Him bowed in deep concentration over the laptop, blackwork-tattooed
hands mid-keystroke, low three-quarter angle. CRITICAL FRAMING: the ENTIRE
laptop fully visible inside the frame — lid, screen, keyboard deck, base, all
four corners — nothing cropped. Whole head with headphones and both forearms
fully in frame, generous black margin around the composition. The screen's
glow washes up over his face and beard as the brightest scanline peaks;
aggressive analog glitch ripples; everything else pure black.`,
  11: `${IDENTITY}\n${ARMS}\n${STYLE_DESC_V2}\n
SCENE: Three-quarter portrait of him seated at a desk, typing on an open
laptop, head slightly bowed toward the screen. CRITICAL FRAMING: the ENTIRE
laptop is fully visible inside the frame — lid, glowing screen, keyboard, base,
all four corners — nothing cropped by any edge. Head, headphones, shoulders and
both full-blackwork forearms fully in frame, comfortable black margin all
around. Face and hands glow hottest; glitchy scanline ripples radiate from the
laptop screen across his body; everything else pure black.`,
  12: `${IDENTITY}\n${ARMS}\n${STYLE_DESC_V2}\n
SCENE: Him bowed in deep concentration over the laptop, full-blackwork hands
and forearms mid-keystroke, low three-quarter angle. CRITICAL FRAMING: the
ENTIRE laptop fully visible inside the frame — lid, screen, keyboard deck,
base, all four corners — nothing cropped. Whole head with headphones and both
blackwork forearms fully in frame, generous black margin around the
composition. The screen's glow washes up over his face and beard as the
brightest scanline peaks; aggressive analog glitch ripples; everything else
pure black.`,
};

const which = process.argv[2] ?? "all";
const picks = which === "all" ? Object.keys(VARIANTS) : [which];

const outDir = join(root, "qa/hero-gen");
mkdirSync(outDir, { recursive: true });

for (const v of picks) {
  const prompt = VARIANTS[v];
  if (!prompt) {
    console.error(`unknown variant "${v}" (use 1|2|3|all)`);
    process.exit(1);
  }
  console.log(`variant ${v}: generating via ${PROVIDER}…`);
  const faceData = `data:image/jpeg;base64,${face}`;
  const styleData = `data:image/jpeg;base64,${style}`;

  let res;
  if (PROVIDER === "openrouter") {
    res = await fetch(URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${KEY_OR}`,
      },
      body: JSON.stringify({
        model: MODEL,
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: faceData } },
              { type: "image_url", image_url: { url: styleData } },
            ],
          },
        ],
      }),
    });
  } else {
    res = await fetch(URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": KEY_GEMINI },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: face } },
              { inline_data: { mime_type: "image/jpeg", data: style } },
            ],
          },
        ],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    });
  }
  const json = await res.json();
  if (!res.ok) {
    console.error(`variant ${v}: HTTP ${res.status}`, JSON.stringify(json).slice(0, 500));
    continue;
  }

  let b64;
  if (PROVIDER === "openrouter") {
    const images = json.choices?.[0]?.message?.images ?? [];
    const dataUrl = images[0]?.image_url?.url ?? "";
    b64 = dataUrl.startsWith("data:") ? dataUrl.split(",")[1] : undefined;
  } else {
    const parts = json.candidates?.[0]?.content?.parts ?? [];
    b64 = parts.find((p) => p.inlineData?.data)?.inlineData?.data;
  }
  if (!b64) {
    console.error(`variant ${v}: no image in response`, JSON.stringify(json).slice(0, 500));
    continue;
  }
  const file = join(outDir, `variant-${v}-${Date.now()}.png`);
  writeFileSync(file, Buffer.from(b64, "base64"));
  console.log(`variant ${v}: saved ${file}`);
}
