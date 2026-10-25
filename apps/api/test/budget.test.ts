import { describe, expect, it } from "vitest";
import { processLeadSearch } from "../src/services/lead-search";
import { getYep, monthSpend } from "../src/lib/yep";
import { readyUser } from "./client";
import { harness } from "./harness";

async function settled(userId: string, total: number) {
  // Usage rows are written just after each call returns.
  for (let i = 0; i < 50 && (await monthSpend(userId)) < total - 1e-9; i++) await new Promise((r) => setTimeout(r, 10));
}

describe("monthly budget", () => {
  it("refuses paid lookups once the month's spend reaches the limit", async () => {
    const { api, project, userId } = await readyUser();
    await api.ok("PUT", "/settings/budget", { monthlyBudgetUsd: 0.1 });
    await api.ok("POST", `/projects/${project.id}/lookups/find_leads`, { query: "plumber", pages: 2 }); // $0.07, then $0.07
    await settled(userId, 0.14);

    const before = harness.fake.requests.length;
    const res = await api.post(`/projects/${project.id}/lookups/find_creators`, { platform: "tiktok", query: "espresso" });
    expect(res.status).toBe(402);
    expect(res.body.error).toMatchObject({ code: "budget_reached" });
    expect(harness.fake.requests.length).toBe(before);

    // Free things keep working: cached results, dry runs and the balance.
    expect((await api.ok("POST", `/projects/${project.id}/lookups/find_leads`, { query: "plumber", pages: 2 })).cached).toBe(true);
    expect((await api.ok("POST", `/projects/${project.id}/lookups/find_creators?dryRun=1`, { platform: "tiktok", query: "espresso" })).dryRun).toBe(true);
    expect((await api.ok("GET", "/balance")).balanceUsd).toBe(5);
  });

  it("counts calls in flight, so calls made together cannot all pass the limit", async () => {
    const { userId, api } = await readyUser();
    await api.ok("PUT", "/settings/budget", { monthlyBudgetUsd: 0.1 });
    const yep = await getYep({ userId, feature: "test" });
    const before = harness.fake.requests.length;
    // $0.07 each. The first reserves its price before any has a usage row; the second sees $0.07
    // (under the limit) and runs, the third sees $0.14 and is refused.
    const results = await Promise.allSettled([1, 2, 3].map(() => yep.maps.search({ query: "a" })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(2);
    expect(results.filter((r) => r.status === "rejected").map((r) => (r as PromiseRejectedResult).reason)).toMatchObject([{ code: "budget_reached" }]);
    expect(harness.fake.requests.length - before).toBe(2);
  });

  it("pays once when the same lookup is made twice at the same time", async () => {
    const { api, project } = await readyUser();
    const before = harness.fake.requests.length;
    const [first, second] = await Promise.all([
      api.ok("POST", `/projects/${project.id}/lookups/find_creators`, { platform: "tiktok", query: "same" }),
      api.ok("POST", `/projects/${project.id}/lookups/find_creators`, { platform: "tiktok", query: "same" }),
    ]);
    expect([first.cached, second.cached].sort()).toEqual([false, true]);
    expect(first.data).toEqual(second.data);
    expect(harness.fake.requests.length - before).toBe(2);
  });

  it("stops a background lead search at the limit instead of finishing it", async () => {
    const { api, project, userId } = await readyUser();
    const search = await api.ok("POST", `/projects/${project.id}/lead-searches`, { queries: ["plumber"], locations: Array.from({ length: 12 }, (_, i) => `Town ${i}`) });
    await api.ok("PUT", "/settings/budget", { monthlyBudgetUsd: 0.2 });
    await processLeadSearch(search.id);

    const done = await api.ok("GET", `/lead-searches/${search.id}?limit=0`);
    expect(done.status).toBe("failed");
    expect(done.error).toMatch(/spending limit/);
    // Searches already in flight (three at a time, $0.07 each) may complete, so the month ends a little over.
    await settled(userId, 0.2);
    const spent = await monthSpend(userId);
    expect(spent).toBeGreaterThanOrEqual(0.2);
    expect(spent).toBeLessThan(0.2 + 3 * 0.07 + 1e-9);
    expect(done.doneCalls).toBeLessThan(12);
  });
});
