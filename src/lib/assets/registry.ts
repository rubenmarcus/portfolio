/**
 * Typed icon registries. Names derive from the object keys
 * (same `keyof typeof` pattern as mint-assets.json's ModelKey).
 */

import type { IconDefinition, SvgIconDef } from "./types";
import * as tech from "./icons/tech";
import * as ui from "./icons/ui";
import * as status from "./icons/status";
import * as y2k from "./icons/y2k";
import * as svgUi from "./svg/ui";
import * as svgLogos from "./svg/logos";

export const VOXEL_ICONS = {
  ...tech,
  ...ui,
  ...status,
  ...y2k,
} as const satisfies Record<string, IconDefinition>;

export type VoxelIconName = keyof typeof VOXEL_ICONS;

export const SVG_ICONS = {
  ...svgUi,
  ...svgLogos,
} as const satisfies Record<string, SvgIconDef>;

export type SvgIconName = keyof typeof SVG_ICONS;
