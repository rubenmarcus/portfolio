import { describe, expect, it } from "vitest";
import { canonicalPath } from "../src/lib/url-policy";

describe("canonicalPath", () => {
  it("keeps the bare root", () => {
    expect(canonicalPath("/")).toBe("/");
  });

  it("strips a trailing slash from pages", () => {
    expect(canonicalPath("/about/")).toBe("/about");
    expect(canonicalPath("/pt/")).toBe("/pt");
    expect(canonicalPath("/pt/blog/evals-sao-o-produto/")).toBe("/pt/blog/evals-sao-o-produto");
  });

  it("leaves canonical paths untouched", () => {
    expect(canonicalPath("/about")).toBe("/about");
    expect(canonicalPath("/pt")).toBe("/pt");
  });

  it("collapses repeated trailing slashes", () => {
    expect(canonicalPath("/blog/x//")).toBe("/blog/x");
  });

  it("normalizes missing leading slash and empty input", () => {
    expect(canonicalPath("about/")).toBe("/about");
    expect(canonicalPath("")).toBe("/");
  });
});
