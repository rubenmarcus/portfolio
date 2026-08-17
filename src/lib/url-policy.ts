/**
 * Site-wide URL policy: one canonical form per page — no trailing slash,
 * except the bare root ("/"). Vercel serves both "/x" and "/x/" for
 * directory-format builds, so every generated URL (canonical, hreflang,
 * sitemap) must agree on one form and the other must 308 to it
 * (scripts/vercel-route-policy.mjs injects that redirect at deploy).
 */
export const canonicalPath = (path: string): string => {
  const prefixed = path.startsWith("/") ? path : `/${path}`;
  const stripped = prefixed.replace(/\/+$/, "");
  return stripped === "" ? "/" : stripped;
};
