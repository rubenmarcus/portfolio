/**
 * Canvas/Three renderers can't read CSS custom properties, so the terminal
 * palette is mirrored here (same precedent as CardAscii's hardcoded rgba).
 * Values track --accent / --accent-soft / --accent-deep in global.css.
 */

/** Voxel top face — brightest. */
export const ACCENT = "#00ff41";
/** Voxel front face. */
export const ACCENT_SOFT = "#4ade80";
/** Voxel side face — darkest; graphic use only, never text. */
export const ACCENT_DEEP = "#15803d";
/** Default glyph color for flat ASCII renders. */
export const GLYPH_COLOR = "rgba(74, 222, 128, 0.85)";
