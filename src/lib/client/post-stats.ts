/**
 * Blog-index decoration: fills every `[data-post-stats]` placeholder with
 * live view/like counts from the batch endpoints (GET /api/views, /api/likes
 * — one round trip each, CDN-cached). Placeholders stay hidden unless there
 * is something to show, and they sit at the end of the meta line so
 * appearing never pushes content around.
 *
 * Wired to astro:page-load so it survives ClientRouter swaps; no-ops on
 * pages without placeholders.
 */
type Counters = Record<string, number>;

const run = async (): Promise<void> => {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-post-stats]"));
  if (nodes.length === 0) return;
  try {
    const [viewsRes, likesRes] = await Promise.all([fetch("/api/views"), fetch("/api/likes")]);
    if (!viewsRes.ok || !likesRes.ok) return;
    const views: Counters = (await viewsRes.json()).counters ?? {};
    const likes: Counters = (await likesRes.json()).counters ?? {};
    for (const node of nodes) {
      const slug = node.dataset.postStats ?? "";
      const parts: string[] = [];
      if (typeof views[slug] === "number") parts.push(`${views[slug].toLocaleString("en-US")} views`);
      if (typeof likes[slug] === "number" && likes[slug] > 0) parts.push(`♥ ${likes[slug].toLocaleString("en-US")}`);
      if (parts.length > 0) {
        node.textContent = `· ${parts.join(" · ")}`;
        node.hidden = false;
      }
    }
  } catch {
    // Offline or store disabled — placeholders stay hidden.
  }
};

document.addEventListener("astro:page-load", () => void run());
