/**
 * Text-scramble effect.
 *
 * Two surfaces:
 *  1. `scramble` — Svelte action: `<span use:scramble>BUILD</span>`
 *  2. `bindScramble(el, opts)` — vanilla helper for Astro / global wiring
 *
 * Behaviour: on mouseenter, the element's text is replaced with random
 * characters that progressively resolve back to the original. On mouseleave
 * the original text snaps back. Whitespace + punctuation is preserved so the
 * shape of the word holds. Honours prefers-reduced-motion.
 */

import type { Action } from "svelte/action";

// Three-way mix: Latin letters, numbers, katakana (matrix-rain feel),
// with a sprinkle of symbols. Each group is weighted so all three feel
// equally represented in the shuffle.
const LATIN_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const KATAKANA =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン" +
  "ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ";
const SYMBOLS = "!@#$%^&*+-=<>?/\\";
// Repeat each group so the pool stays balanced regardless of source size.
// Letters x2 (most common), numbers x4 (10 chars compete with 52 latin),
// katakana x2, symbols once.
const CHARS =
  LATIN_LETTERS + LATIN_LETTERS +
  NUMBERS + NUMBERS + NUMBERS + NUMBERS +
  KATAKANA + KATAKANA +
  SYMBOLS;

export interface ScrambleOptions {
  /** ms between iterations — lower = faster shuffle. Default 48. */
  tick?: number;
  /** how many chars to lock per iteration. Higher = quicker resolve. Default 0.35. */
  speed?: number;
  /** preserve these chars without scrambling */
  preserve?: RegExp;
}

const DEFAULT_PRESERVE = /[\s.,!?'"():;_\-—–·/\\]/;

function isReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function bindScramble(node: HTMLElement, opts: ScrambleOptions = {}): () => void {
  const tick = opts.tick ?? 48;
  const speed = opts.speed ?? 0.35;
  const preserve = opts.preserve ?? DEFAULT_PRESERVE;

  const original = (node.textContent ?? "").trim();
  if (!original) return () => {};
  // Preserve original text in dataset so we can restore safely
  node.dataset.scrambleOriginal = original;

  let interval: ReturnType<typeof setInterval> | null = null;
  let running = false;

  function stop() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    running = false;
    node.textContent = node.dataset.scrambleOriginal ?? original;
  }

  function start() {
    if (running) return;
    if (isReducedMotion()) return;
    running = true;
    const target = node.dataset.scrambleOriginal ?? original;
    let progress = 0;

    interval = setInterval(() => {
      const keep = Math.floor(progress);
      let next = "";
      for (let i = 0; i < target.length; i++) {
        const ch = target[i];
        if (preserve.test(ch)) {
          next += ch;
        } else if (i < keep) {
          next += ch;
        } else {
          next += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }
      node.textContent = next;
      progress += speed;
      if (progress >= target.length) stop();
    }, tick);
  }

  node.addEventListener("mouseenter", start);
  node.addEventListener("focus", start, true);

  return () => {
    node.removeEventListener("mouseenter", start);
    node.removeEventListener("focus", start, true);
    stop();
  };
}

export const scramble: Action<HTMLElement, ScrambleOptions | undefined> = (node, opts) => {
  let cleanup = bindScramble(node, opts);
  return {
    update(next) {
      cleanup();
      cleanup = bindScramble(node, next);
    },
    destroy() {
      cleanup();
    },
  };
};

/**
 * Mount scramble on every `[data-scramble]` element currently in the DOM.
 * Call once after page load. Safe to call multiple times — adds idempotently
 * because we tag bound elements with `data-scramble-bound`.
 */
export function mountScrambleGlobals(): void {
  const els = document.querySelectorAll<HTMLElement>("[data-scramble]");
  els.forEach((el) => {
    if (el.dataset.scrambleBound === "true") return;
    el.dataset.scrambleBound = "true";
    bindScramble(el, {});
  });
}
