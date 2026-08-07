// Stub for Astro's virtual "astro:middleware" module so middleware.ts can
// be imported in unit tests. defineMiddleware is identity at runtime.
export const defineMiddleware = <T>(fn: T): T => fn;
