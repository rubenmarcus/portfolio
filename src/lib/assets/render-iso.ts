/**
 * Tier A renderer — dimetric voxel projection on a 2D canvas.
 *
 * Each grid cell with height h becomes a column of h cubes; every cube is
 * drawn as three faces (top / front / side) with a 12% inset so the result
 * reads as the site's dot-matrix language rather than a solid mesh.
 *
 * `angle` (0..1) rotates the grid around its center by up to 40° — capped
 * below 45° so the same two cube faces always face the viewer and painter's
 * ordering stays trivial. One call renders one frame; no internal state.
 */

import type { ParsedGrid } from "./types";
import { ACCENT, ACCENT_SOFT, ACCENT_DEEP } from "./palette";

const MAX_TURN = (40 * Math.PI) / 180;
/** Cube half-extent in grid units (leaves the dot-matrix gap). */
const HALF = 0.44;
/** Screen-space slope of the dimetric axes. */
const ISO_X = 1;
const ISO_Y = 0.5;
/** Height of one voxel level in projected units — tall enough that height
    differences read at 48px (0.62 rendered as a flat pancake). */
const LEVEL = 1.0;

interface P2 {
  x: number;
  y: number;
}

function project(px: number, py: number, z: number): P2 {
  return { x: (px - py) * ISO_X, y: (px + py) * ISO_Y - z * LEVEL };
}

export function renderIso(
  ctx: CanvasRenderingContext2D,
  parsed: ParsedGrid,
  size: number,
  angle = 0,
): void {
  const { cols, rows, heights } = parsed;
  const theta = Math.max(0, Math.min(1, angle)) * MAX_TURN;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;

  const rot = (x: number, y: number): P2 => ({
    x: cx + (x - cx) * cosT - (y - cy) * sinT,
    y: cy + (x - cx) * sinT + (y - cy) * cosT,
  });

  // Rotated corner offsets of a cube footprint (±HALF square).
  const corner = (dx: number, dy: number): P2 => ({
    x: dx * cosT - dy * sinT,
    y: dx * sinT + dy * cosT,
  });
  const oA = corner(-HALF, -HALF);
  const oB = corner(HALF, -HALF);
  const oC = corner(HALF, HALF);
  const oD = corner(-HALF, HALF);

  // Fit: project the grid's bounding footprint at z=0 and z=maxHeight.
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const consider = (p: P2) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  };
  for (const [gx, gy] of [
    [0, 0],
    [cols - 1, 0],
    [0, rows - 1],
    [cols - 1, rows - 1],
  ] as const) {
    const c = rot(gx, gy);
    for (const o of [oA, oB, oC, oD]) {
      consider(project(c.x + o.x, c.y + o.y, 0));
      consider(project(c.x + o.x, c.y + o.y, parsed.maxHeight));
    }
  }
  const pad = size * 0.06;
  const scale = Math.min(
    (size - pad * 2) / Math.max(1e-6, maxX - minX),
    (size - pad * 2) / Math.max(1e-6, maxY - minY),
  );
  const offX = (size - (maxX - minX) * scale) / 2 - minX * scale;
  const offY = (size - (maxY - minY) * scale) / 2 - minY * scale;
  const S = (p: P2): P2 => ({ x: p.x * scale + offX, y: p.y * scale + offY });

  // Painter's order: columns sorted by rotated depth (x+y), back to front.
  const columns: { gx: number; gy: number; h: number; depth: number }[] = [];
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const h = heights[gy * cols + gx] ?? 0;
      if (h === 0) continue;
      const c = rot(gx, gy);
      columns.push({ gx, gy, h, depth: c.x + c.y });
    }
  }
  columns.sort((a, b) => a.depth - b.depth);

  ctx.clearRect(0, 0, size, size);
  const quad = (a: P2, b: P2, c: P2, d: P2, fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(d.x, d.y);
    ctx.closePath();
    ctx.fill();
  };

  for (const col of columns) {
    const c = rot(col.gx, col.gy);
    for (let z = 0; z < col.h; z++) {
      // Bottom / top corners of this cube.
      const a0 = project(c.x + oA.x, c.y + oA.y, z);
      const b0 = project(c.x + oB.x, c.y + oB.y, z);
      const c0 = project(c.x + oC.x, c.y + oC.y, z);
      const d0 = project(c.x + oD.x, c.y + oD.y, z);
      const a1 = project(c.x + oA.x, c.y + oA.y, z + 1);
      const b1 = project(c.x + oB.x, c.y + oB.y, z + 1);
      const c1 = project(c.x + oC.x, c.y + oC.y, z + 1);
      const d1 = project(c.x + oD.x, c.y + oD.y, z + 1);

      // Front (+y) and side (+x) faces stay viewer-facing for θ < 45°.
      quad(S(d1), S(c1), S(c0), S(d0), ACCENT_SOFT); // front
      quad(S(b1), S(c1), S(c0), S(b0), ACCENT_DEEP); // side
      quad(S(a1), S(b1), S(c1), S(d1), ACCENT); // top
    }
  }
}
