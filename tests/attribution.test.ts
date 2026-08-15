import { describe, expect, it } from "vitest";
import {
  buildFirstTouchAttribution,
  normalizeSource,
} from "../src/lib/attribution";

describe("first-touch attribution", () => {
  it("groups LinkedIn host variants into one acquisition source", () => {
    expect(normalizeSource("linkedin.com")).toBe("linkedin");
    expect(normalizeSource("https://www.linkedin.com/feed/")).toBe("linkedin");
    expect(normalizeSource("lnkd.in")).toBe("linkedin");
    expect(normalizeSource("android-app://com.linkedin.android")).toBe("linkedin");
  });

  it("groups other strategic referrers", () => {
    expect(normalizeSource("https://www.awwwards.com/sites/rubenmarcus-dev")).toBe("awwwards");
    expect(normalizeSource("https://t.co/example")).toBe("x");
    expect(normalizeSource("https://claude.ai/new")).toBe("claude");
    expect(normalizeSource("https://www.reddit.com/r/SideProject")).toBe("reddit");
    expect(normalizeSource("https://br.pinterest.com/pin/123")).toBe("pinterest");
    expect(normalizeSource("https://land-book.com/websites/123")).toBe("landbook");
    expect(normalizeSource("https://www.behance.net/gallery/123")).toBe("behance");
    expect(normalizeSource("https://www.indiehackers.com/post/example")).toBe("indie_hackers");
  });

  it("uses showcase-directory ref parameters when UTMs are absent", () => {
    const attribution = buildFirstTouchAttribution(
      new URL("https://www.rubenmarcus.dev/?ref=land-book.com"),
    );
    expect(attribution.source).toBe("landbook");
    expect(attribution.utm_source).toBe("");
  });

  it("prefers an explicit UTM source and preserves the landing campaign", () => {
    const attribution = buildFirstTouchAttribution(
      new URL("https://rubenmarcus.dev/services/aeo?utm_source=siteinspire&utm_medium=directory&utm_campaign=portfolio-launch&utm_content=agent-ready"),
      "https://www.awwwards.com/",
    );
    expect(attribution).toEqual({
      source: "siteinspire",
      referrer: "awwwards.com",
      landing: "/services/aeo",
      utm_source: "siteinspire",
      utm_medium: "directory",
      utm_campaign: "portfolio-launch",
      utm_content: "agent-ready",
    });
  });

  it("treats an internal referrer as direct when no first touch exists", () => {
    const attribution = buildFirstTouchAttribution(
      new URL("https://rubenmarcus.dev/contact"),
      "https://rubenmarcus.dev/portfolio",
    );
    expect(attribution.source).toBe("direct");
    expect(attribution.referrer).toBe("direct");
  });

  it("does not mistake www and apex variants for external traffic", () => {
    const attribution = buildFirstTouchAttribution(
      new URL("https://www.rubenmarcus.dev/contact"),
      "https://rubenmarcus.dev/portfolio",
      "www.rubenmarcus.dev",
    );
    expect(attribution.source).toBe("direct");
  });
});
