#!/usr/bin/env node
/**
 * Text gate — enforces .claude/skills/blog-voice/SKILL.md mechanically.
 * Scans blog posts (EN+PT) and the prose-heavy pages for AI-tells and
 * banned patterns. Exits 1 with file:line for every violation.
 *
 * Usage: node scripts/text-gate.mjs [file ...]   (no args = full scan)
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const TARGETS = [
  "src/content/blog",
  "src/content/blog-pt",
  "src/pages/about.astro",
  "src/pages/pt/about.astro",
  "src/pages/ai.astro",
  "src/pages/pt/ai.astro",
  "src/pages/agents.astro",
  "src/pages/pt/agents.astro",
];

// Each rule: [regex, message]. Keep messages in PT — Ruben reads the output.
const RULES = [
  [/—/, "em-dash (—) proibido: use ponto, dois-pontos ou parênteses"],
  [/–/, "en-dash (–) proibido: use hífen simples ou reescreva"],
  [/\bwrong question\b/i, "framing 'wrong question' é clichê de IA"],
  [/but here'?s the thing/i, "'But here's the thing' é muleta de IA"],
  [/here'?s the kicker/i, "'Here's the kicker' é muleta de IA"],
  [/plot twist/i, "'Plot twist' é muleta de IA"],
  [/\bin conclusion\b/i, "'In conclusion' é conclusão óbvia — feche com uma lição"],
  [/\bin summary\b/i, "'In summary' é conclusão óbvia — feche com uma lição"],
  [/at the end of the day/i, "'At the end of the day' é encheção"],
  [/so there you have it/i, "'So there you have it' é encheção"],
  [/game-?chang/i, "'game-changer' é hype vazio"],
  [/\bdelve\b/i, "'delve' é sinal de IA"],
  [/\bsupercharg/i, "'supercharge' é hype vazio"],
  [/\bunlock(ing|s|ed)?\b/i, "'unlock' é hype vazio — diga o que muda"],
  [/full disclosure|let me be honest/i, "anunciar honestidade é teatro — seja honesto"],
  [/boring (was|is) the feature/i, "aforismo sobre o próprio post — corte"],
  [/!/, "ponto de exclamação em prosa técnica — remova"],
];

function* walk(p) {
  const s = statSync(p);
  if (s.isDirectory()) {
    for (const f of readdirSync(p)) yield* walk(join(p, f));
  } else if (/\.(md|astro)$/.test(p)) {
    yield p;
  }
}

// (region-aware prose extraction below replaced the old line scanner)

const args = process.argv.slice(2);
const files = args.length ? args : TARGETS.flatMap((t) => [...walk(join(root, t))]);

// For .astro files, only prose is gated: skip the frontmatter fence,
// <script>/<style> blocks, and markdown fenced code in .md files.
function proseLines(file) {
  const lines = readFileSync(file, "utf8").split("\n");
  const out = [];
  let region = "prose"; // prose | frontmatter | script | style | code
  let seenFrontmatter = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (file.endsWith(".astro")) {
      if (i === 0 && l.trim() === "---") { region = "frontmatter"; seenFrontmatter = true; continue; }
      if (region === "frontmatter" && l.trim() === "---") { region = "prose"; continue; }
      if (region === "prose" && /<script/.test(l)) region = "script";
      else if (region === "script" && /<\/script>/.test(l)) { region = "prose"; continue; }
      if (region === "prose" && /<style/.test(l)) region = "style";
      else if (region === "style" && /<\/style>/.test(l)) { region = "prose"; continue; }
      if (region !== "prose") continue;
      if (/^\s*(\/\/|\/\*|\*)/.test(l)) continue; // JS comments inside markup expressions
      if (/^\s*<!--/.test(l)) continue; // HTML comments are markup, not prose
    } else if (file.endsWith(".md")) {
      if (/^```/.test(l)) { region = region === "code" ? "prose" : "code"; continue; }
      if (region === "code") continue;
      if (seenFrontmatter === false && i === 0 && l.trim() === "---") { region = "frontmatter"; seenFrontmatter = true; continue; }
      if (region === "frontmatter" && l.trim() === "---") { region = "prose"; continue; }
      if (region === "frontmatter") continue;
    }
    out.push([i + 1, l]);
  }
  return out;
}

let violations = 0;
for (const file of files) {
  for (const [lineNo, line] of proseLines(file)) {
    for (const [re, msg] of RULES) {
      if (re.test(line)) {
        console.error(`${file}:${lineNo}: ${msg}\n    ${line.trim().slice(0, 120)}`);
        violations++;
      }
    }
  }
}

if (violations) {
  console.error(`\ntext-gate: ${violations} violação(ões). Ver .claude/skills/blog-voice/SKILL.md`);
  process.exit(1);
}
console.log(`text-gate: limpo (${files.length} arquivos)`);
