import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { dataDb, schema } from "../src/db";
import "../src/jobs/scheduler";
import { processMonitorRun } from "../src/services/monitors";
import { readyUser } from "./client";
import { harness } from "./harness";

const since = () => harness.fake.requests.length;
const callsTo = (path: string, from: number) => harness.fake.requests.slice(from).filter((r) => r.path === path);

describe("brand mentions", () => {
  it("searches Google per source and the free APIs, keeps only pages on each source that name the brand", async () => {
    const { api, project } = await readyUser();
    const before = since();
    const priced = await api.ok("POST", `/projects/${project.id}/lookups/brand_mentions?dryRun=1`, { terms: ["acmecrm"], sources: ["reddit", "hackernews", "github", "quora"] });
    // Reddit and Quora through Google, Hacker News and GitHub free.
    expect(priced.estimate).toMatchObject({ min: 0.02, max: 0.04 });
    expect(priced.estimate.formula).toMatch(/2 Google searches .* 2 free API searches/);

    const res = await api.ok("POST", `/projects/${project.id}/lookups/brand_mentions`, { terms: ["acmecrm"], excludes: ["jobs"], sources: ["reddit", "hackernews", "github", "quora"] });
    const serps = callsTo("/v1/serp/google", before).map((r) => r.body.query);
    expect(serps.sort()).toEqual(["acmecrm quora -jobs", "acmecrm reddit -jobs"]);
    expect(callsTo("/hn/api/v1/search_by_date", before)).toHaveLength(1);
    expect(res.costUsd).toBe(0.02);
    const mentions = res.data.mentions as { url: string; sourceId: string; community: string | null }[];
    // Google's stray off-site result is dropped.
    expect(mentions.some((m) => m.url.includes("softwarefinder"))).toBe(false);
    expect(new Set(mentions.map((m) => m.sourceId))).toEqual(new Set(["reddit", "quora", "hackernews", "github"]));
    expect(mentions.find((m) => m.sourceId === "reddit")?.community).toMatch(/^r\//);
    expect(res.data.communities[0]).toMatchObject({ threads: expect.any(Number) });
  });

  it("falls back to site: when the plain search finds nothing on the source, and drops off-topic conversations", async () => {
    const { api, project } = await readyUser();
    const before = since();
    const res = await api.ok("POST", `/projects/${project.id}/lookups/brand_mentions`, { terms: ["plainmiss"], sources: ["quora"] });
    expect(callsTo("/v1/serp/google", before).map((r) => r.body.query)).toEqual(["plainmiss quora", "site:quora.com plainmiss"]);
    expect(res.costUsd).toBe(0.02);
    expect(res.data.mentions.length).toBeGreaterThan(0);

    const { onTopic } = await import("../src/lib/mention-search");
    expect(onTopic("Best CRM for small businesses?", "crm for small business", [])).toBe(true);
    expect(onTopic("Can someone explain em dash?", "crm for small business", [])).toBe(false);
    expect(onTopic("Leaving HubSpot, what next?", "crm for small business", ["HubSpot"])).toBe(true);
  });

  it("keeps going when one free API fails, and says so", async () => {
    const { api, project } = await readyUser();
    harness.fake.failures.set("/github/search/issues", [{ status: 403, code: "rate limited" }]);
    const res = await api.ok("POST", `/projects/${project.id}/lookups/brand_mentions`, { terms: ["acmefail"], sources: ["github", "hackernews"] });
    expect(res.data.warnings[0]).toMatch(/GitHub.*rate limiting/);
    expect(res.data.mentions.length).toBeGreaterThan(0);
    // A result with a failed part is not cached.
    expect((await api.ok("POST", `/projects/${project.id}/lookups/brand_mentions`, { terms: ["acmefail"], sources: ["github", "hackernews"] })).cached).toBe(false);
  });
});

describe("customer finder", () => {
  it("asks each Google source in request phrasings, ranks by intent and groups communities", async () => {
    const { api, project } = await readyUser();
    const before = since();
    const res = await api.ok("POST", `/projects/${project.id}/lookups/find_conversations`, { problems: ["crm for plumbers"], competitors: ["HubSpot"], sources: ["reddit"], phrasings: 2 });
    const queries = callsTo("/v1/serp/google", before).map((r) => r.body.query as string);
    expect(queries).toHaveLength(3);
    expect(queries[0]).toMatch(/^crm for plumbers reddit after:\d{4}-\d{2}-\d{2}$/);
    expect(queries.some((q) => q.includes("HubSpot alternative"))).toBe(true);
    const intents = (res.data.mentions as { intent: number }[]).map((m) => m.intent);
    expect(intents).toEqual([...intents].sort((a, b) => b - a));
    expect(res.data.communities.every((c: { community: string }) => c.community.startsWith("r/"))).toBe(true);
  });

  it("lets AI drop off-topic results and rescore the rest, priced as open-ended", async () => {
    const { api, project } = await readyUser();
    const priced = await api.ok("POST", `/projects/${project.id}/lookups/find_conversations?dryRun=1`, { problems: ["unrelated topic"], sources: ["hackernews"], aiScoring: true });
    expect(priced.estimate).toMatchObject({ min: 0.01, max: null });
    const before = since();
    const res = await api.ok("POST", `/projects/${project.id}/lookups/find_conversations`, { problems: ["latte tools"], sources: ["hackernews"], aiScoring: true });
    expect(callsTo("/v1/ai/chat", before)).toHaveLength(1);
    expect(res.data.mentions[0]).toMatchObject({ aiNote: "Asks for a tool." });
  });

  it("finds the subreddits where a topic is discussed most", async () => {
    const { api, project } = await readyUser();
    const res = await api.ok("POST", `/projects/${project.id}/lookups/find_subreddits`, { topics: ["invoicing for freelancers"], phrasings: 2 });
    expect(res.costUsd).toBe(0.04);
    const subs = res.data.subreddits as { community: string; threads: number }[];
    expect(subs.length).toBeGreaterThan(1);
    expect(subs[0]!.threads).toBeGreaterThanOrEqual(subs[1]!.threads);
  });
});

describe("monitors", () => {
  it("prices a run and a month, then runs: new pages are added once and keep their status", async () => {
    const { api, project } = await readyUser({ description: "A CRM for plumbers" });
    const draft = { kind: "brand", terms: ["acmewatch"], sources: ["reddit", "hackernews"], schedule: "weekly" };
    const priced = await api.ok("POST", `/projects/${project.id}/monitors?dryRun=1`, draft);
    expect(priced.estimate).toMatchObject({ googleSearches: 1, freeSearches: 1, run: { min: 0.01, max: 0.02 }, month: { min: 0.04 } });

    const monitor = await api.ok("POST", `/projects/${project.id}/monitors`, draft);
    expect(monitor.nextRunAt).not.toBeNull();
    const run = await api.ok("POST", `/monitors/${monitor.id}/runs`);
    expect(harness.enqueued.at(-1)).toEqual({ name: "monitor.run", data: { runId: run.id } });
    // A second run while the first is queued is refused.
    expect((await api.post(`/monitors/${monitor.id}/runs`)).status).toBe(409);
    await processMonitorRun(run.id);

    const done = await api.ok("GET", `/monitor-runs/${run.id}`);
    expect(done).toMatchObject({ status: "completed", searchesDone: 2, costUsd: 0.01 });
    expect(done.added).toBeGreaterThan(0);
    const feed = await api.ok("GET", `/projects/${project.id}/mentions?monitorId=${monitor.id}`);
    expect(feed.total).toBe(done.added);

    // Hacker News answers the same threads again on the next run.
    const hn = feed.mentions.find((m: { sourceId: string }) => m.sourceId === "hackernews");
    await api.ok("POST", `/projects/${project.id}/mentions/status`, { ids: [hn.id], status: "replied" });
    const second = await api.ok("POST", `/monitors/${monitor.id}/runs`);
    await processMonitorRun(second.id);
    const again = await api.ok("GET", `/monitor-runs/${second.id}`);
    const after = await api.ok("GET", `/projects/${project.id}/mentions?monitorId=${monitor.id}&limit=1000`);
    // Pages seen before are not added twice and keep their status.
    expect(after.total).toBe(done.added + again.added);
    const hnCount = (list: { sourceId: string }[]) => list.filter((m) => m.sourceId === "hackernews").length;
    expect(hnCount(after.mentions)).toBe(hnCount(feed.mentions));
    expect((await api.ok("GET", `/projects/${project.id}/mentions?status=replied`)).mentions.map((m: { id: string }) => m.id)).toEqual([hn.id]);

    const list = await api.ok("GET", `/projects/${project.id}/monitors`);
    expect(list[0]).toMatchObject({ mentions: { total: after.total }, lastRun: { id: second.id } });
    expect((await api.ok("GET", `/projects/${project.id}/communities`)).length).toBeGreaterThan(0);
  });

  it("scores only new pages with AI and does not store the ones it rejects", async () => {
    const { api, project } = await readyUser();
    const monitor = await api.ok("POST", `/projects/${project.id}/monitors`, { kind: "topic", terms: ["unrelated thing"], sources: ["hackernews"], aiScoring: true, schedule: "manual" });
    expect(monitor.nextRunAt).toBeNull();
    const run = await api.ok("POST", `/monitors/${monitor.id}/runs`);
    await processMonitorRun(run.id);
    const stored = await dataDb.select().from(schema.mentions).where(eq(schema.mentions.monitorId, monitor.id));
    // The fake rejects titles saying "unrelated"; the Show HN comment survives.
    expect(stored.every((m) => !/unrelated/i.test(m.title))).toBe(true);
  });

  it("is started by the scheduler when due, and pausing clears the schedule", async () => {
    const { api, project } = await readyUser();
    const monitor = await api.ok("POST", `/projects/${project.id}/monitors`, { kind: "brand", terms: ["acmesched"], sources: ["hackernews"], schedule: "daily" });
    await dataDb.update(schema.monitors).set({ nextRunAt: new Date(Date.now() - 60_000) }).where(eq(schema.monitors.id, monitor.id));
    await harness.jobs.get("scheduler.tick")!({}, { info: () => {}, error: () => {} });
    expect(harness.enqueued.at(-1)?.name).toBe("monitor.run");
    const [after] = await dataDb.select().from(schema.monitors).where(eq(schema.monitors.id, monitor.id));
    expect(after!.nextRunAt!.getTime()).toBeGreaterThan(Date.now());

    const paused = await api.ok("PATCH", `/monitors/${monitor.id}`, { active: false });
    expect(paused.nextRunAt).toBeNull();
  });
});

describe("lead searches", () => {
  it("prices every query in every place, then saves the places that pass the filters", async () => {
    const { api, project } = await readyUser();
    const body = {
      queries: ["plumber", "drain cleaning"],
      locations: ["Austin, TX", "Round Rock, TX"],
      pages: 2,
      filters: { match: "all", rules: [{ field: "website", op: "eq", value: false }] },
    };
    const priced = await api.ok("POST", `/projects/${project.id}/lead-searches?dryRun=1`, body);
    expect(priced.estimate).toMatchObject({ searches: 4, maxCalls: 8, min: 0.28, max: 0.56 });
    expect((await api.post(`/projects/${project.id}/lead-searches?maxCostUsd=0.5`, body)).body.error?.code).toBe("cost_ceiling_exceeded");

    const search = await api.ok("POST", `/projects/${project.id}/lead-searches`, body);
    expect(harness.enqueued.at(-1)).toEqual({ name: "leads.run", data: { searchId: search.id } });
    const { processLeadSearch } = await import("../src/services/lead-search");
    await processLeadSearch(search.id);

    const done = await api.ok("GET", `/lead-searches/${search.id}`);
    expect(done).toMatchObject({ status: "completed", doneCalls: 4, costUsd: 0.56 });
    // The same places come back for every query and place: found once each.
    expect(done.found).toBe(24);
    expect(done.places.every((p: { matched: boolean; website: string | null }) => p.matched === (!p.website || p.website.includes("facebook")))).toBe(true);
    const leads = await api.ok("GET", `/projects/${project.id}/leads?searchId=${search.id}`);
    expect(leads.total).toBe(done.saved);
    expect(done.saved).toBe(done.matched);
    expect(leads.leads.every((l: { domain: string | null }) => !l.domain || l.domain === "facebook.com")).toBe(true);
  });

  it("covers a city with a grid, and refuses searches over the call limit or while two run", async () => {
    const { api, project } = await readyUser();
    const grid = { queries: ["plumber"], mode: "grid", grid: { latitude: 30.27, longitude: -97.74, size: 3, spacingKm: 2 } };
    expect((await api.ok("POST", `/projects/${project.id}/lead-searches?dryRun=1`, grid)).estimate).toMatchObject({ searches: 9, max: 0.63 });
    const huge = await api.post(`/projects/${project.id}/lead-searches`, { ...grid, grid: { ...grid.grid, size: 15 }, queries: ["plumber", "drain cleaning", "boiler repair"], pages: 3 });
    expect(huge.body.error?.code).toBe("too_large");

    await api.ok("POST", `/projects/${project.id}/lead-searches`, grid);
    await api.ok("POST", `/projects/${project.id}/lead-searches`, grid);
    expect((await api.post(`/projects/${project.id}/lead-searches`, grid)).status).toBe(409);
  });

  it("stops at a cancel and keeps what it found", async () => {
    const { api, project } = await readyUser();
    const search = await api.ok("POST", `/projects/${project.id}/lead-searches`, { queries: ["plumber"], locations: ["Town A", "Town B", "Town C"] });
    await api.ok("POST", `/lead-searches/${search.id}/cancel`);
    const { processLeadSearch } = await import("../src/services/lead-search");
    await processLeadSearch(search.id);
    expect((await api.ok("GET", `/lead-searches/${search.id}`)).status).toBe("cancelled");
    expect((await api.delete(`/lead-searches/${search.id}`)).status).toBe(200);
  });

  it("finds and stores emails for saved leads", async () => {
    const { api, project } = await readyUser();
    await api.ok("POST", `/projects/${project.id}/leads`, { leads: [{ placeId: "p1", name: "Site Co", website: "https://www.siteco.example/", domain: "siteco.example" }, { placeId: "p2", name: "No Site" }] });
    const list = await api.ok("GET", `/projects/${project.id}/leads`);
    const ids = list.leads.map((l: { id: string }) => l.id);
    expect(await api.ok("POST", `/projects/${project.id}/leads/emails?dryRun=1`, { ids, method: "directory" })).toMatchObject({ leads: 1, estimate: { max: 0.03 } });
    const res = await api.ok("POST", `/projects/${project.id}/leads/emails`, { ids, method: "directory" });
    expect(res).toMatchObject({ checked: 1, withEmails: 1, costUsd: 0.03 });
    // The directory's low-confidence guess (info@, 30%) is left out.
    expect((await api.ok("GET", `/projects/${project.id}/leads?q=Site Co`)).leads[0].emails).toEqual(["jane@siteco.example"]);
  });
});
