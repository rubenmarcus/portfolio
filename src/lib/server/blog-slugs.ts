/**
 * Slug validation for the views/likes endpoints. Two layers:
 *  - shape check (cheap, always available — also what vitest exercises)
 *  - membership check against the blog collection, loaded lazily because
 *    astro:content only resolves inside an Astro build/runtime.
 *
 * Counters key on the translation key (EN collection id): the PT mirror of
 * a post shares the row with its EN original.
 */
const SLUG_SHAPE = /^[a-z0-9][a-z0-9-]{0,79}$/;

let knownSlugs: Set<string> | null = null;

const loadKnownSlugs = async (): Promise<Set<string> | null> => {
  if (knownSlugs) return knownSlugs;
  try {
    const { getCollection } = await import("astro:content");
    const posts = await getCollection("blog");
    knownSlugs = new Set(posts.map((post) => post.id));
    return knownSlugs;
  } catch {
    return null; // outside an Astro runtime (unit tests) — shape check only
  }
};

export const isValidBlogSlug = async (value: string): Promise<boolean> => {
  if (!SLUG_SHAPE.test(value)) return false;
  // Lab demos also carry like counters, keyed `lab-<slug>`. Their slugs are
  // page-local data (src/pages/lab.astro), so membership is shape-only —
  // importing the lab registry here would drag every demo component into
  // the server bundle.
  if (value.startsWith("lab-")) return /^lab-[a-z0-9][a-z0-9-]*$/.test(value);
  const known = await loadKnownSlugs();
  return known ? known.has(value) : true;
};
