/**
 * Single editable source for the home STATS section.
 * Static numbers are hardcoded here — update them as they grow.
 * Live stats (GitHub stars, npm downloads) are fetched client-side and
 * fall back to the values below when the APIs are unreachable.
 */

import { aiAgents } from "./aiAgents";
import { AEO_TOTAL_SCANS, AEO_UNIQUE_SITES } from "../site-facts";

export const NPM_PACKAGES = [
  "aeo.js",
  "make-agent",
  "qday",
  "ralph-starter",
  "autoresearcher",
  "elendil",
  "new-agent",
  "scanrepo",
];

export interface Stat {
  id: string;
  label: string;
  /** Static target. Ignored for live stats once the fetch lands. */
  value: number;
  /** Divide before display (1e6 → millions). */
  divisor?: number;
  /** Decimals kept after dividing. */
  decimals?: number;
  /** Appended to the formatted number. */
  suffix?: string;
  /** Live fetcher key — see StatsGrid. */
  live?: "github-stars" | "npm-downloads";
}

export const STATS: Stat[] = [
  {
    id: "bitte-messages",
    value: 2_850_000,
    divisor: 1e6,
    decimals: 2,
    suffix: "M+",
    label: "agent messages processed",
  },
  {
    id: "bitte-users",
    value: 24_164,
    label: "unique users on AI agents",
  },
  {
    id: "agents-built",
    value: aiAgents.length,
    label: "AI agents I built",
  },
  {
    id: "aeo-scans",
    value: AEO_TOTAL_SCANS,
    label: "AEO scans run",
  },
  {
    id: "aeo-sites",
    value: AEO_UNIQUE_SITES,
    label: "unique websites scanned",
  },
  {
    id: "career-loc",
    value: 2_000_000,
    divisor: 1e6,
    decimals: 0,
    suffix: "M+",
    label: "lines of code, career estimate",
  },
  {
    id: "github-stars",
    value: 0,
    label: "GitHub stars",
    live: "github-stars",
  },
  {
    id: "npm-downloads",
    value: 0,
    label: "npm downloads, all time",
    live: "npm-downloads",
  },
];

export const STATS_FOOTNOTE =
  "33K+ LinkedIn followers · 3M+ people reached by posts on X";
