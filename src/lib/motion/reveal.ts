import { animate } from "animejs";

export interface RevealOptions {
  selector?: string;
  duration?: number;
  delay?: number;
  stagger?: number;
  offset?: number;
  easing?: string;
}

const defaults: Required<Omit<RevealOptions, "selector">> = {
  duration: 760,
  delay: 0,
  stagger: 90,
  offset: 16,
  easing: "outExpo",
};

function getTargets(root: HTMLElement, selector?: string): HTMLElement[] {
  if (selector) {
    return Array.from(root.querySelectorAll<HTMLElement>(selector));
  }

  const scoped = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal-item]"));
  if (scoped.length > 0) return scoped;

  const children = Array.from(root.children).filter(
    (c): c is HTMLElement => c instanceof HTMLElement,
  );
  return children.length > 0 ? children : [root];
}

function setFinalState(targets: HTMLElement[]): void {
  targets.forEach((t) => {
    t.style.opacity = "1";
    t.style.transform = "translateY(0px)";
  });
}

export function reveal(root: HTMLElement, options: RevealOptions = {}): void {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const merged = { ...defaults, ...options };
  const targets = getTargets(root, options.selector);
  if (targets.length === 0) return;

  if (prefersReducedMotion) {
    setFinalState(targets);
    return;
  }

  targets.forEach((t) => {
    t.style.opacity = "0";
    t.style.transform = `translateY(${merged.offset}px)`;
    t.style.willChange = "opacity, transform";
  });

  animate(targets, {
    opacity: [0, 1],
    translateY: [merged.offset, 0],
    duration: merged.duration,
    delay: (_el: Element, index: number) => merged.delay + index * merged.stagger,
    ease: merged.easing,
    onComplete: () => {
      targets.forEach((t) => {
        t.style.willChange = "auto";
      });
    },
  });
}
