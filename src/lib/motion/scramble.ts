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

// Latin glyphs + katakana (Matrix-rain feel). Katakana is preferred over
// kanji/hiragana because individual characters are visually distinct and
// roughly the same width as a Latin letter at the same point size.
const KATAKANA =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン" +
  "ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ";
const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const SYMBOLS = "!@#$%^&*+-=<>?/\\";
// Weighted pool — repeat Latin a couple times so output stays readable
// while katakana still appears regularly.
const CHARS = LATIN + LATIN + KATAKANA + SYMBOLS;

export interface ScrambleOptions {
  /** ms between iterations — lower = faster shuffle. Default 28. */
  tick?: number;
  /** how many chars to lock per iteration. Higher = quicker resolve. Default 0.6. */
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
  const tick = opts.tick ?? 28;
  const speed = opts.speed ?? 0.6;
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
