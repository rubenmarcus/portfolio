/**
 * Shared GSAP + ScrollTrigger runtime for the whole site.
 *
 * - Registers ScrollTrigger once and keeps it in sync with the Lenis
 *   smooth-scroll instance (Lenis drives the scroll position, ScrollTrigger
 *   just needs `update()` on every Lenis scroll event).
 * - `initScrollFx()` wires every `[data-reveal]` container on the page:
 *   its `[data-reveal-item]` children (or the container itself when it has
 *   none) fade + rise in, staggered, once. Subtle and fast — 300–600ms,
 *   power3.out, no scrolljacking, no pinned sections.
 * - `initMagnetic()` gives `[data-magnetic]` elements a magnetic pull toward
 *   the cursor (≤6px) with an elastic spring back.
 * - Everything is gated behind prefers-reduced-motion: reduced-motion users
 *   get the final, fully-visible state with no animation.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface LenisLike {
  on: (event: "scroll", cb: () => void) => void;
}

/** Called by SmoothScroll.svelte once the Lenis instance exists. */
export function registerLenis(lenis: LenisLike): void {
  lenis.on("scroll", () => ScrollTrigger.update());
}

function revealTargets(root: HTMLElement): HTMLElement[] {
  const items = Array.from(
    root.querySelectorAll<HTMLElement>("[data-reveal-item]"),
  );
  return items.length > 0 ? items : [root];
}

function setFinalState(targets: HTMLElement[]): void {
  gsap.set(targets, { opacity: 1, y: 0, clearProps: "willChange" });
}

/**
 * Wire scroll reveals for every `[data-reveal]` container under `root`.
 * Returns a cleanup function that kills the created triggers.
 */
export function initScrollFx(root: ParentNode = document): () => void {
  const containers = Array.from(
    root.querySelectorAll<HTMLElement>("[data-reveal]"),
  );

  // Nothing to do, or reduced motion: make sure everything is visible.
  if (containers.length === 0) return () => {};
  if (prefersReducedMotion()) {
    containers.forEach((c) => setFinalState(revealTargets(c)));
    return () => {};
  }

  const triggers: ScrollTrigger[] = [];

  containers.forEach((container) => {
    const targets = revealTargets(container);
    gsap.set(targets, { opacity: 0, y: 22, willChange: "opacity, transform" });

    const play = () => {
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: "power3.out",
        stagger: 0.07,
        // Clear transform at rest so CSS hover transforms (card lifts)
        // keep working after the reveal.
        clearProps: "transform,willChange",
      });
    };

    // Already inside the reveal zone (first paint, or right after a
    // client-side navigation while measurements are still settling):
    // play immediately instead of waiting for a scroll event that may
    // never come — sections must never stay hidden until the user scrolls.
    if (container.getBoundingClientRect().top < window.innerHeight * 0.88) {
      play();
      return;
    }

    const st = ScrollTrigger.create({
      trigger: container,
      start: "top 88%",
      once: true,
      onEnter: play,
    });
    triggers.push(st);
  });

  // Layout may shift once webfonts / images land — re-measure triggers.
  if (typeof window !== "undefined") {
    window.addEventListener("load", () => ScrollTrigger.refresh(), {
      once: true,
    });
  }

  return () => triggers.forEach((st) => st.kill());
}

/**
 * Magnetic buttons — translate toward the cursor within a small radius,
 * spring back on leave. Fine-pointer devices only, skipped on reduced motion.
 */
export function initMagnetic(root: ParentNode = document): () => void {
  if (prefersReducedMotion()) return () => {};
  if (typeof window === "undefined") return () => {};
  if (!window.matchMedia("(pointer: fine)").matches) return () => {};

  const MAX = 6; // px of pull at the element's edge
  const cleanups: Array<() => void> = [];

  const els = Array.from(root.querySelectorAll<HTMLElement>("[data-magnetic]"));
  els.forEach((el) => {
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const nx = Math.max(-1, Math.min(1, dx / (r.width / 2)));
      const ny = Math.max(-1, Math.min(1, dy / (r.height / 2)));
      gsap.to(el, {
        x: nx * MAX,
        y: ny * MAX,
        duration: 0.3,
        ease: "power3.out",
        overwrite: "auto",
      });
    };
    const onLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.65,
        ease: "elastic.out(1, 0.45)",
        overwrite: "auto",
      });
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    cleanups.push(() => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      gsap.set(el, { x: 0, y: 0 });
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

export { gsap, ScrollTrigger };
