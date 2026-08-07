/**
 * Shared GSAP runtime for the whole site.
 *
 * - `initScrollFx()` wires every `[data-reveal]` container on the page:
 *   its `[data-reveal-item]` children (or the container itself when it has
 *   none) fade + rise in, staggered, once. Subtle and fast — 300–600ms,
 *   power3.out, no scrolljacking, no pinned sections.
 * - Visibility is driven by IntersectionObserver, not ScrollTrigger:
 *   scroll-triggered reveals coupled to Lenis kept breaking across route
 *   changes (sections stuck invisible until a scroll nudge). IO observes
 *   real intersection and fires no matter how the scroll is driven.
 * - `initMagnetic()` gives `[data-magnetic]` elements a magnetic pull toward
 *   the cursor (≤6px) with an elastic spring back.
 * - Everything is gated behind prefers-reduced-motion: reduced-motion users
 *   get the final, fully-visible state with no animation.
 */

import gsap from "gsap";

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
 * Returns a cleanup function that disconnects the observer.
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

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const container = entry.target as HTMLElement;
        io.unobserve(container);
        gsap.to(revealTargets(container), {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: "power3.out",
          stagger: 0.07,
          // Clear transform at rest so CSS hover transforms (card lifts)
          // keep working after the reveal.
          clearProps: "transform,willChange",
        });
      }
    },
    // Reveal a bit before the section fully enters — same feel as the old
    // "top 88%" trigger, but measured by the compositor, not scroll math.
    { rootMargin: "0px 0px -12% 0px", threshold: 0 },
  );

  containers.forEach((container) => {
    gsap.set(revealTargets(container), {
      opacity: 0,
      y: 22,
      willChange: "opacity, transform",
    });
    io.observe(container);
  });

  return () => io.disconnect();
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

export { gsap };
