export function canUseWebGL(): boolean {
  if (typeof document === "undefined") return false
  try {
    const canvas = document.createElement("canvas")
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"))
  } catch {
    return false
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
