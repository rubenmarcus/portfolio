/**
 * Shared types for the internal 3D-ASCII asset library.
 *
 * An icon is authored as a small text grid (see icons/*.ts) where each
 * character encodes a voxel column height. The same definition feeds three
 * renderers: flat ASCII (<pre>), isometric canvas 2D, and a Three.js
 * instanced-voxel showcase.
 */

export interface IconDefinition {
  /** Human-readable name — used for aria labels and the preview page. */
  readonly label: string;
  /**
   * Row-major art, one character per cell:
   * `·` (or space) = empty, `░ ▒ ▓ █` = height 1–4.
   * Rectangular, max 16×16.
   */
  readonly grid: readonly string[];
}

export interface Voxel {
  readonly x: number;
  readonly y: number;
  /** 0-based stack level within the column. */
  readonly z: number;
}

export interface ParsedGrid {
  readonly cols: number;
  readonly rows: number;
  /** Row-major column heights, 0–4. */
  readonly heights: Uint8Array;
  /** One entry per unit of height — the voxel cloud all renderers share. */
  readonly voxels: readonly Voxel[];
  readonly maxHeight: number;
}

export interface SvgIconDef {
  readonly label: string;
  /** Inner SVG markup (paths/shapes), no outer <svg> element. */
  readonly body: string;
  /** Defaults to "0 0 24 24" — some brand marks need their own box. */
  readonly viewBox?: string;
}
