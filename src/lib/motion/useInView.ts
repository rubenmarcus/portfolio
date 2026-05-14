import type { Action } from "svelte/action";

export interface InViewOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  onEnter?: (node: HTMLElement) => void;
  onLeave?: (node: HTMLElement) => void;
}

interface PoolEntry {
  observer: IntersectionObserver;
  refCount: number;
}

const pool = new Map<string, PoolEntry>();

interface ElementMeta {
  options: InViewOptions;
  node: HTMLElement;
}

const elementMeta = new WeakMap<Element, ElementMeta>();

function poolKey(threshold: number, rootMargin: string): string {
  return `${threshold}|${rootMargin}`;
}

function getPooledObserver(threshold: number, rootMargin: string): IntersectionObserver {
  const key = poolKey(threshold, rootMargin);
  let entry = pool.get(key);

  if (!entry) {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const ioEntry of entries) {
          const meta = elementMeta.get(ioEntry.target);
          if (!meta) continue;

          if (ioEntry.isIntersecting) {
            meta.options.onEnter?.(meta.node);
            meta.node.dataset.inview = "true";

            if (meta.options.once) {
              obs.unobserve(ioEntry.target);
              elementMeta.delete(ioEntry.target);
              releasePooledObserver(threshold, rootMargin);
            }
          } else if (!meta.options.once) {
            meta.node.dataset.inview = "false";
            meta.options.onLeave?.(meta.node);
          }
        }
      },
      { threshold, rootMargin },
    );
    entry = { observer: obs, refCount: 0 };
    pool.set(key, entry);
  }

  entry.refCount++;
  return entry.observer;
}

function releasePooledObserver(threshold: number, rootMargin: string): void {
  const key = poolKey(threshold, rootMargin);
  const entry = pool.get(key);
  if (!entry) return;

  entry.refCount--;
  if (entry.refCount <= 0) {
    entry.observer.disconnect();
    pool.delete(key);
  }
}

function applyInView(node: HTMLElement, options: InViewOptions = {}): () => void {
  const { threshold = 0.2, rootMargin = "0px 0px -8% 0px", once = true } = options;

  node.dataset.inview = "false";
  elementMeta.set(node, { options, node });

  const observer = getPooledObserver(threshold, rootMargin);
  observer.observe(node);

  return () => {
    observer.unobserve(node);
    elementMeta.delete(node);
    releasePooledObserver(threshold, rootMargin);
  };
}

export const useInView: Action<HTMLElement, InViewOptions> = (node, options) => {
  let cleanup = applyInView(node, options);

  return {
    update(nextOptions) {
      cleanup();
      cleanup = applyInView(node, nextOptions);
    },
    destroy() {
      cleanup();
    },
  };
};
