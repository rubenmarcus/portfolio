/**
 * Public surface of the internal 3D-ASCII asset library.
 * Everything outside src/lib/assets/ imports from this barrel only —
 * it is the extraction boundary if this ever ships as an npm package.
 */

export type { IconDefinition, ParsedGrid, SvgIconDef, Voxel } from "./types";
export { VOXEL_ICONS, SVG_ICONS } from "./registry";
export type { VoxelIconName, SvgIconName } from "./registry";
export { getParsed, parseGrid, asciiRows, seededRng, HEIGHT_GLYPHS } from "./grid";
export { ACCENT, ACCENT_SOFT, ACCENT_DEEP, GLYPH_COLOR } from "./palette";

export { default as AsciiIcon } from "./AsciiIcon.svelte";
export { default as VoxelIcon } from "./VoxelIcon.svelte";
export { default as SvgIcon } from "./SvgIcon.svelte";
