/**
 * lab/registry — single source of truth for the /lab drops. Each entry
 * pairs the demo component with its own raw source (Vite `?raw` import)
 * plus the AI prompt that regenerates the same animation. These power the
 * per-card "source" and "prompt" modals (LabSource / LabPrompt).
 *
 * Adding a new demo: build the component in this folder, then add one
 * entry here (and one data entry in lab.astro + pt/lab.astro).
 */

import ContourScanDemo from "./ContourScanDemo.svelte";
import FlowFieldDemo from "./FlowFieldDemo.svelte";
import GlyphRainDemo from "./GlyphRainDemo.svelte";
import BoidsDemo from "./BoidsDemo.svelte";
import HarmonographDemo from "./HarmonographDemo.svelte";
import ReactionDiffusionDemo from "./ReactionDiffusionDemo.svelte";
import RippleDemo from "./RippleDemo.svelte";
import CellularAutomatonDemo from "./CellularAutomatonDemo.svelte";
import CircuitTraceDemo from "./CircuitTraceDemo.svelte";
import VoronoiDriftDemo from "./VoronoiDriftDemo.svelte";
import LSystemDemo from "./LSystemDemo.svelte";
import MazeSolverDemo from "./MazeSolverDemo.svelte";
import WarpFieldDemo from "./WarpFieldDemo.svelte";
import OrbitalBodiesDemo from "./OrbitalBodiesDemo.svelte";
import WaveInterferenceDemo from "./WaveInterferenceDemo.svelte";
import PhosphorFireDemo from "./PhosphorFireDemo.svelte";

import contourScanSrc from "./ContourScanDemo.svelte?raw";
import flowFieldSrc from "./FlowFieldDemo.svelte?raw";
import glyphRainSrc from "./GlyphRainDemo.svelte?raw";
import boidsSrc from "./BoidsDemo.svelte?raw";
import harmonographSrc from "./HarmonographDemo.svelte?raw";
import reactionDiffusionSrc from "./ReactionDiffusionDemo.svelte?raw";
import rippleSrc from "./RippleDemo.svelte?raw";
import automatonSrc from "./CellularAutomatonDemo.svelte?raw";
import circuitTraceSrc from "./CircuitTraceDemo.svelte?raw";
import voronoiDriftSrc from "./VoronoiDriftDemo.svelte?raw";
import lSystemSrc from "./LSystemDemo.svelte?raw";
import mazeSolverSrc from "./MazeSolverDemo.svelte?raw";
import warpFieldSrc from "./WarpFieldDemo.svelte?raw";
import orbitalBodiesSrc from "./OrbitalBodiesDemo.svelte?raw";
import waveInterferenceSrc from "./WaveInterferenceDemo.svelte?raw";
import phosphorFireSrc from "./PhosphorFireDemo.svelte?raw";

export interface LabDemoEntry {
  // Astro's Svelte shim widens component props with client directives, so the
  // native Svelte Component type is too narrow here. Every demo shares this
  // no-required-props component shape.
  component: typeof ContourScanDemo;
  source: string;
  filename: string;
  /** The AI prompt that regenerates this same animation. */
  prompt: string;
}

const PROMPT_PREFIX =
  "Self-contained Svelte 5 component, canvas 2D only, no dependencies. ";

export const labRegistry: Record<string, LabDemoEntry> = {
  "contour-scan": {
    component: ContourScanDemo,
    source: contourScanSrc,
    filename: "ContourScanDemo.svelte",
    prompt:
      PROMPT_PREFIX +
      "Draw dotted isolines of a time-drifting implicit scalar field swept by a vertical scanline. Moving the pointer over the canvas adds a Gaussian blob to the field that warps the contours. Phosphor-green palette (#00ff41) on near-black. Cap DPR at 1.5, pause offscreen via IntersectionObserver, and render a single static frame under prefers-reduced-motion.",
  },
  "flow-field": {
    component: FlowFieldDemo,
    source: flowFieldSrc,
    filename: "FlowFieldDemo.svelte",
    prompt:
      PROMPT_PREFIX +
      "A few thousand particles advected through a time-drifting curl-noise field (divergence-free, hashed value noise). Flicking the pointer injects a vortex scaled by pointer velocity; trails come from alpha-fading the previous frame, not per-particle history. Fast particles render brighter. Phosphor palette. Cap DPR 1.5, scale particle count to area, pause offscreen, static frame under reduced-motion.",
  },
  "glyph-rain": {
    component: GlyphRainDemo,
    source: glyphRainSrc,
    filename: "GlyphRainDemo.svelte",
    prompt:
      PROMPT_PREFIX +
      "Phosphor falling-glyph rain: columns of monospace glyphs (hex/symbols/katakana), each with a bright leading head and a fading tail, using per-frame alpha-fade (fillRect with low alpha) for soft decay. The pointer's column speeds up and flares brighter, with a small neighborhood boost. Phosphor-green on near-black, DPR cap 1.5, pause offscreen, static frame under reduced-motion.",
  },
  "boids": {
    component: BoidsDemo,
    source: boidsSrc,
    filename: "BoidsDemo.svelte",
    prompt:
      PROMPT_PREFIX +
      "Reynolds flocking of 120–180 boids with separation, alignment, and cohesion, toroidal edge wrap, speed clamped. Draw short streaks in phosphor green with brighter heads; trails via alpha-fade. When the pointer is inside, boids within ~160px are gently attracted toward it. Cap DPR 1.5, pause offscreen, static frame under reduced-motion.",
  },
  "harmonograph": {
    component: HarmonographDemo,
    source: harmonographSrc,
    filename: "HarmonographDemo.svelte",
    prompt:
      PROMPT_PREFIX +
      "A harmonograph where x and y are each the sum of two damped sinusoids with slightly irrational frequency ratios, so the Lissajous-like curve never closes. Draw the accumulating trail in bright phosphor with a very slow per-frame alpha-fade so the figure builds up. Re-inject energy when amplitude decays. Pointer X morphs a frequency ratio and pointer Y a phase offset (eased). Static completed figure under reduced-motion.",
  },
  "reaction-diffusion": {
    component: ReactionDiffusionDemo,
    source: reactionDiffusionSrc,
    filename: "ReactionDiffusionDemo.svelte",
    prompt:
      PROMPT_PREFIX +
      "Gray-Scott reaction-diffusion on a fixed 200×150 grid (Du=1.0, Dv=0.5, feed≈0.0545, kill≈0.062), 3×3 Laplacian (corners 0.05, edges 0.2, center -1), 2 substeps/frame, ping-pong Float32Arrays, clamp to [0,1]. Render v→phosphor brightness via an offscreen ImageData scaled up with smoothing. Seed blobs of v=1; the pointer paints v=1 discs to grow new patterns. Run ~300 steps then freeze under reduced-motion.",
  },
  "ripple": {
    component: RippleDemo,
    source: rippleSrc,
    filename: "RippleDemo.svelte",
    prompt:
      PROMPT_PREFIX +
      "A 2D water surface on a fixed 220×160 height-field grid using the classic double-buffered, damped wave equation (next = neighbors/2 − previous, ×0.985, swap). Render height→phosphor brightness via an offscreen ImageData upscaled with smoothing. Pointerdown/move stamps a Gaussian splash into the current buffer and wavefronts propagate outward. Seed a centered splash on init; ~120 steps then a static frame under reduced-motion.",
  },
  "automaton": {
    component: CellularAutomatonDemo,
    source: automatonSrc,
    filename: "CellularAutomatonDemo.svelte",
    prompt:
      PROMPT_PREFIX +
      "A 1D elementary cellular automaton (rule 30) grown from a single center cell. Each step builds the next row from the current one via the rule-30 bit table and draws it; when the canvas fills, shift the canvas up by one cell and keep going. Live cells render as bright phosphor squares on dark. Pointermove paints a small neighborhood of cells alive in the current bottom row, perturbing all future generations. Render a fully evolved static frame under reduced-motion.",
  },
  "circuit-trace": {
    component: CircuitTraceDemo,
    source: circuitTraceSrc,
    filename: "CircuitTraceDemo.svelte",
    prompt:
      PROMPT_PREFIX +
      "PCB-style autorouting: traces routed between pads on the canvas edges (start and end on different edges, inset from corners), every segment a multiple of 45° — a greedy octilinear router (8 candidate directions scored by remaining distance plus jitter, straight-run bonus, no doubling back, in-bounds only) with a diagonal-then-axial final approach. Vias at each bend, bright pads at endpoints. Each trace carries a bright packet with a short gradient tail that travels its length and loops. While the pointer is inside, an eased repulsion field (~110px radius, quadratic falloff, ~44px peak push) displaces nearby vertices so traces bend around the cursor; clicking clears and re-routes the whole board. Trace count scaled to card area (8–16). Phosphor palette, DPR cap 1.5, pause offscreen, static board under reduced-motion.",
  },
  "voronoi-drift": {
    component: VoronoiDriftDemo,
    source: voronoiDriftSrc,
    filename: "VoronoiDriftDemo.svelte",
    prompt:
      PROMPT_PREFIX +
      "A drifting Voronoi diagram drawn as dotted cell borders on a 4px dot grid: at each grid point compare the two nearest seed distances and light a dot where they are nearly equal (two brightness buckets, batched Path2D fills). 18–36 seeds (area-scaled) wander slowly with toroidal wrap; while the pointer is inside, the nearest seed eases toward it, dragging its cell along. Seeds render as brighter dots. Phosphor-green on near-black, DPR cap 1.5, pause offscreen, single static frame under reduced-motion.",
  },
  "l-system": {
    component: LSystemDemo,
    source: lSystemSrc,
    filename: "LSystemDemo.svelte",
    prompt:
      PROMPT_PREFIX +
      "A bracketed L-system tree (axiom X, random production picked per cycle from a small set like F+[[X]-X]-F[-FX]+X, F→FF half the time, random 16–29° branch angle, 4–5 iterations, string cap ~60k). Run the turtle once with unit steps, then normalize the segment list to fit the card, rooted at bottom center. Reveal segments progressively over ~4s with a bright glowing frontier that dims to the base stroke behind it; hold, then fade out via slow alpha fillRects and regrow with a new random rule set. Clicking fells the current tree early. Static fully-grown tree under reduced-motion; DPR cap 1.5, pause offscreen.",
  },
  "maze-solver": {
    component: MazeSolverDemo,
    source: mazeSolverSrc,
    filename: "MazeSolverDemo.svelte",
    prompt:
      PROMPT_PREFIX +
      "A perfect maze carved by the iterative recursive backtracker (wall bitflags per cell, ~26 cells across the short axis), then solved by BFS from the top-left: the visitation order replays as a flood wavefront of dim phosphor cell-dots with a brighter frontier band; once the flood completes, the parent-chain solution path is traced entrance→exit in bright green. Walls are prerendered once per maze to an offscreen canvas. Hold, then regenerate and repeat; clicking restarts with a fresh maze. DPR cap 1.5, pause offscreen, fully solved static maze under reduced-motion.",
  },
  "warp-field": {
    component: WarpFieldDemo,
    source: warpFieldSrc,
    filename: "WarpFieldDemo.svelte",
    prompt:
      PROMPT_PREFIX +
      "A starfield warp: a few hundred stars (area-scaled, ~320–750) with (x,y) in [-1,1]² and depth z in (0,1], projected as screen = vanishingPoint + (x/z, y/z)·f. Each frame z shrinks (faster at low z) and the star is drawn as a speed line between its previous and current projection, bucketed dim/bright by depth; respawn at z<0.06. The pointer steers the warp — the vanishing point eases toward it and drifts back to center on leave. Trails via background alpha-fade. Phosphor palette, DPR cap 1.5, pause offscreen, a few synchronous steps for a static streak frame under reduced-motion.",
  },
  "orbital-bodies": {
    component: OrbitalBodiesDemo,
    source: orbitalBodiesSrc,
    filename: "OrbitalBodiesDemo.svelte",
    prompt:
      PROMPT_PREFIX +
      "A tiny n-body toy: one heavy center mass (GM≈5200 in css-px units, softened inverse-square, softening²≈90) and 13 particles seeded on near-circular prograde orbits (v = sqrt(GM/r) with slight jitter). Integrate per frame and stroke each body's step; a very slow alpha-fade (0.06) makes the orbits read as long-exposure rings. Clicking drops a temporary gravity well (≈0.9·GM, ~2.8s ease-out TTL, max 3) that perturbs orbits; escapees and core-divers respawn on stable orbits. The center mass is redrawn as a bright radial glow each frame. DPR cap 1.5, pause offscreen, ~420 synchronous steps for a static ring frame under reduced-motion.",
  },
  "wave-interference": {
    component: WaveInterferenceDemo,
    source: waveInterferenceSrc,
    filename: "WaveInterferenceDemo.svelte",
    prompt:
      PROMPT_PREFIX +
      "Overlapping circular wave sources rendered as an interference moiré of dotted crest lines: on a 4px dot grid each point sums cos(k·r − ωt + φ) over all sources and lights a dot where the normalized sum passes a crest threshold (two brightness buckets, batched Path2D fills). Three ambient sources at fixed positions with distinct k/ω/φ; clicking drops a new source with randomized parameters (cap 7, oldest non-ambient recycled). Sources render as bright marker dots. Phosphor-green on near-black, DPR cap 1.5, pause offscreen, one static frame under reduced-motion.",
  },
  "phosphor-fire": {
    component: PhosphorFireDemo,
    source: phosphorFireSrc,
    filename: "PhosphorFireDemo.svelte",
    prompt:
      PROMPT_PREFIX +
      "The classic Doom fire algorithm in phosphor green: a fixed low-res heat grid (~150 columns, height from card aspect) whose bottom row is stoked to ~180–255 each step; every other cell inherits the heat of a randomly jittered cell below minus 0–2 decay, so flames rise and wobble. Render heat through a black → #00ff41 → bright → near-white 256-entry palette into an ImageData with every other row darkened ~18% for baked scanlines, upscaled with smoothing disabled for chunky pixels. Pointermove stirs Gaussian heat blobs into the grid. DPR cap 1.5, pause offscreen, ~90 synchronous steps then a static frame under reduced-motion.",
  },
};
