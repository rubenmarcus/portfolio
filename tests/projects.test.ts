/**
 * projects.ts invariants — the portfolio archive is the source of truth for
 * /portfolio. Pins two regressions: slugs must stay unique (they key the
 * work pages) and dead-site links must not come back (everything up to and
 * including the Bitte era is offline, so those entries carry no url).
 */
import { it, expect } from "vitest";
import { projects, groupLabels, groupOrder } from "../src/lib/data/projects";

it("slugs are unique", () => {
  const slugs = projects.map((p) => p.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
});

it("every project has the required fields and a known group", () => {
  for (const p of projects) {
    expect(p.title.length).toBeGreaterThan(0);
    expect(p.org.length).toBeGreaterThan(0);
    expect(p.period.length).toBeGreaterThan(0);
    expect(p.description.length).toBeGreaterThan(0);
    expect(groupOrder).toContain(p.group);
  }
});

it("every group has a label and a place in the order", () => {
  for (const g of groupOrder) expect(groupLabels[g]).toBeTruthy();
  expect(Object.keys(groupLabels).sort()).toEqual([...groupOrder].sort());
});

it("no links to dead sites: pre-Grover groups and the Bitte era carry no url", () => {
  const linkless = ["bitte", "zup-fiap", "freelance-modern", "agency", "early"];
  const offenders = projects.filter(
    (p) => p.url && linkless.includes(p.group),
  );
  expect(offenders).toEqual([]);
});

it("remaining urls are https", () => {
  for (const p of projects) {
    if (p.url) expect(p.url).toMatch(/^https:\/\//);
  }
});
