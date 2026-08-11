import { describe, expect, it, vi } from "vitest";
import { fetchGithubCommitStats } from "../src/lib/github-stats";

const response = (total_count: number, withItem = false) =>
  new Response(JSON.stringify({
    total_count,
    items: withItem ? [{
      sha: "1c8a95ec399c5069ff802f08996d648a544b0743",
      html_url: "https://github.com/rubenmarcus/csbrasil/commit/1c8a95e",
      repository: { full_name: "rubenmarcus/csbrasil" },
      commit: {
        message: "fix: ship the footer\n\nDetails",
        author: { date: "2026-08-11T02:16:30+01:00" },
      },
    }] : [],
  }), { status: 200 });

describe("GitHub public commit stats", () => {
  it("counts all-time, month and today using Lisbon dates", async () => {
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const query = new URL(String(input)).searchParams.get("q") ?? "";
      if (query.includes("author-date:2026-08-11")) return response(4);
      if (query.includes("author-date:>=2026-08-01")) return response(91);
      return response(2_537, true);
    }) as unknown as typeof fetch;

    const stats = await fetchGithubCommitStats({
      fetcher,
      now: new Date("2026-08-11T12:00:00Z"),
    });

    expect(stats).toMatchObject({ total: 2_537, month: 91, today: 4 });
    expect(stats.latest).toEqual({
      repository: "rubenmarcus/csbrasil",
      sha: "1c8a95e",
      message: "fix: ship the footer",
      authoredAt: "2026-08-11T02:16:30+01:00",
      url: "https://github.com/rubenmarcus/csbrasil/commit/1c8a95e",
    });
  });

  it("fails soft when GitHub is unavailable", async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 403 })) as unknown as typeof fetch;
    const stats = await fetchGithubCommitStats({ fetcher });
    expect(stats).toMatchObject({ total: null, month: null, today: null, latest: null });
  });
});
