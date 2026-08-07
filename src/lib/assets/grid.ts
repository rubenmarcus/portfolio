/**
 * Grid parsing + shared helpers. `parseGrid` turns an authored text grid
 * into the voxel cloud every renderer consumes; results are cached per
 * definition object.
 */

import type { IconDefinition, ParsedGrid, Voxel } from "./types";

const HEIGHT_BY_CHAR: Record<string, number> = {
  "·": 0,
  " ": 0,
  "░": 1,
  "▒": 2,
  "▓": 3,
  "█": 4,
};

/** Glyph ramp for flat ASCII renders, indexed by height. */
export const HEIGHT_GLYPHS = [" ", "░", "▒", "▓", "█"] as const;

const MAX_DIM = 16;

export function parseGrid(def: IconDefinition): ParsedGrid {
  const rows = def.grid.length;
  const cols = def.grid[0]?.length ?? 0;
  if (import.meta.env.DEV) {
    if (rows === 0 || cols === 0 || rows > MAX_DIM || cols > MAX_DIM) {
      throw new Error(`[assets] "${def.label}": grid must be 1–${MAX_DIM} rows/cols`);
    }
    for (const row of def.grid) {
      if (row.length !== cols) {
        throw new Error(`[assets] "${def.label}": ragged grid (expected ${cols} cols, got ${row.length})`);
      }
      for (const ch of row) {
        if (!(ch in HEIGHT_BY_CHAR)) {
          throw new Error(`[assets] "${def.label}": unknown char "${ch}" (use · ░ ▒ ▓ █)`);
        }
      }
    }
  }

  const heights = new Uint8Array(rows * cols);
  const voxels: Voxel[] = [];
  let maxHeight = 0;
  for (let y = 0; y < rows; y++) {
    const row = def.grid[y] ?? "";
    for (let x = 0; x < cols; x++) {
      const h = HEIGHT_BY_CHAR[row[x] ?? "·"] ?? 0;
      heights[y * cols + x] = h;
      if (h > maxHeight) maxHeight = h;
      for (let z = 0; z < h; z++) voxels.push({ x, y, z });
    }
  }
  return { cols, rows, heights, voxels, maxHeight };
}

const parseCache = new WeakMap<IconDefinition, ParsedGrid>();

/** Cached parse — safe to call from every component instance. */
export function getParsed(def: IconDefinition): ParsedGrid {
  let parsed = parseCache.get(def);
  if (!parsed) {
    parsed = parseGrid(def);
    parseCache.set(def, parsed);
  }
  return parsed;
}

/** Flat ASCII rows — height mapped back onto the glyph ramp. */
export function asciiRows(parsed: ParsedGrid): string[] {
  const out: string[] = [];
  for (let y = 0; y < parsed.rows; y++) {
    let line = "";
    for (let x = 0; x < parsed.cols; x++) {
      line += HEIGHT_GLYPHS[parsed.heights[y * parsed.cols + x] ?? 0];
    }
    out.push(line);
  }
  return out;
}

/**
 * Deterministic PRNG from a string seed — FNV-1a into mulberry32.
 * (Same approach as CardAscii; duplicated here so the lib stays
 * self-contained for future extraction.)
 */
export function seededRng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let t = h >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
