/**
 * Privacy-safe first-touch attribution for the commercial funnel.
 *
 * Vercel already records each page view and its immediate referrer. This
 * module preserves the original acquisition source while a visitor moves
 * between pages, so a later contact submission can still be attributed to
 * Awwwards, LinkedIn, an MCP directory, or a tagged campaign.
 *
 * Session storage is intentionally used instead of cookies or local storage:
 * the attribution expires with the browsing session and contains no PII.
 */

export const ATTRIBUTION_STORAGE_KEY = "portfolio:first-touch:v1";

export interface FirstTouchAttribution {
  source: string;
  referrer: string;
  landing: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
}

const LIMIT = 240;

const clean = (value: string | null | undefined) =>
  (value ?? "").trim().slice(0, LIMIT);

const hostnameFrom = (value: string) => {
  if (!value) return "";
  try {
    return clean(new URL(value).hostname.toLowerCase().replace(/^www\./, ""));
  } catch {
    return clean(value.toLowerCase().replace(/^www\./, ""));
  }
};

export const normalizeSource = (hostname: string) => {
  const host = hostnameFrom(hostname);
  if (!host) return "direct";
  if (host === "lnkd.in" || host === "linkedin.com" || host.endsWith(".linkedin.com") || host === "com.linkedin.android") return "linkedin";
  if (host === "t.co" || host === "x.com" || host.endsWith(".twitter.com")) return "x";
  if (host === "reddit.com" || host.endsWith(".reddit.com")) return "reddit";
  if (host === "pinterest.com" || host.endsWith(".pinterest.com") || host === "pin.it") return "pinterest";
  if (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.com") return "facebook";
  if (host === "instagram.com" || host.endsWith(".instagram.com")) return "instagram";
  if (host === "awwwards.com" || host.endsWith(".awwwards.com")) return "awwwards";
  if (host === "land-book.com" || host.endsWith(".land-book.com")) return "landbook";
  if (host === "dribbble.com" || host.endsWith(".dribbble.com")) return "dribbble";
  if (host === "behance.net" || host.endsWith(".behance.net")) return "behance";
  if (host === "lapa.ninja" || host.endsWith(".lapa.ninja")) return "lapa_ninja";
  if (host === "siteinspire.com" || host.endsWith(".siteinspire.com")) return "siteinspire";
  if (host === "minimal.gallery" || host.endsWith(".minimal.gallery")) return "minimal_gallery";
  if (host === "indiehackers.com" || host.endsWith(".indiehackers.com")) return "indie_hackers";
  if (host === "google.com" || host.endsWith(".google.com")) return "google";
  if (host === "claude.ai" || host.endsWith(".claude.ai")) return "claude";
  if (host === "chatgpt.com" || host.endsWith(".chatgpt.com")) return "chatgpt";
  if (host === "perplexity.ai" || host.endsWith(".perplexity.ai")) return "perplexity";
  if (host === "github.com" || host.endsWith(".github.com")) return "github";
  return host;
};

export const buildFirstTouchAttribution = (
  locationUrl: URL,
  documentReferrer = "",
  siteHostname = locationUrl.hostname,
): FirstTouchAttribution => {
  const params = locationUrl.searchParams;
  const utmSource = clean(params.get("utm_source"));
  // Showcase directories often append `?ref=<domain>` instead of UTMs.
  // Treat it as an explicit source only when no UTM source was supplied.
  const referralSource = clean(params.get("ref"));
  const referrer = hostnameFrom(documentReferrer);
  const currentHost = hostnameFrom(siteHostname);
  const internalReferrer = referrer === currentHost || referrer.endsWith(`.${currentHost}`);
  const externalReferrer = internalReferrer ? "" : referrer;

  return {
    source: normalizeSource(utmSource || referralSource || externalReferrer),
    referrer: externalReferrer || "direct",
    landing: clean(locationUrl.pathname || "/"),
    utm_source: utmSource,
    utm_medium: clean(params.get("utm_medium")),
    utm_campaign: clean(params.get("utm_campaign")),
    utm_content: clean(params.get("utm_content")),
  };
};

const isAttribution = (value: unknown): value is FirstTouchAttribution => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return ["source", "referrer", "landing", "utm_source", "utm_medium", "utm_campaign", "utm_content"]
    .every((key) => typeof candidate[key] === "string");
};

export const getFirstTouchAttribution = (): FirstTouchAttribution => {
  const fallback = buildFirstTouchAttribution(new URL("https://www.rubenmarcus.dev/"));
  if (typeof window === "undefined") return fallback;

  try {
    const stored = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (isAttribution(parsed)) return parsed;
    }

    const attribution = buildFirstTouchAttribution(
      new URL(window.location.href),
      document.referrer,
      window.location.hostname,
    );
    window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
    return attribution;
  } catch {
    return buildFirstTouchAttribution(
      new URL(window.location.href),
      document.referrer,
      window.location.hostname,
    );
  }
};

/** Four low-cardinality properties suitable for Vercel custom events. */
export const getFunnelEventProperties = (location: string, language: string) => {
  const attribution = getFirstTouchAttribution();
  return {
    source: attribution.source,
    landing: attribution.landing,
    location: clean(location) || "unknown",
    language: clean(language) || "unknown",
  };
};
