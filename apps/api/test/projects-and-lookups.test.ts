import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { dataDb, db, schema } from "../src/db";
import { client, readyUser, signUp, YEP_KEY } from "./client";
import { harness } from "./harness";

const callsTo = (path: string, since: number) => harness.fake.requests.slice(since).filter((r) => r.path === path);

describe("projects", () => {
  it("defaults to the US market and keeps the product's description, keywords and competitors", async () => {
    const { project } = await readyUser({ description: "Espresso machines for home baristas", keywords: ["home espresso"], competitors: ["Breville"] });
    expect(project).toMatchObject({ locationCode: 2840, country: "us", language: "en", domain: "acme.com", keywords: ["home espresso"], competitors: ["Breville"] });
  });

  it("derives the country and name from a location code", async () => {
    const { api } = await signUp();
    const project = await api.ok("POST", "/projects", { name: "Berlin", locationCode: 2276 });
    expect(project).toMatchObject({ locationCode: 2276, country: "de", locationName: "Germany" });
  });

  it("normalises the domain and stores agent context", async () => {
    const { api } = await signUp();
    const project = await api.ok("POST", "/projects", { name: "N", domain: "https://WWW.Example.com/path" });
    expect(project.domain).toBe("example.com");
    const updated = await api.ok("PATCH", `/projects/${project.id}`, { context: { goal: "find 20 creators" } });
    expect(updated.context).toEqual({ goal: "find 20 creators" });
  });

  it("keeps every project private to its owner", async () => {
    const owner = await readyUser();
    const other = await signUp();
    expect((await other.api.get(`/projects/${owner.project.id}`)).status).toBe(404);
    expect((await other.api.post(`/projects/${owner.project.id}/lookups/find_leads`, { query: "plumber" })).status).toBe(404);
    expect((await other.api.get(`/projects/${owner.project.id}/leads`)).status).toBe(404);
    expect(await other.api.ok("GET", "/projects")).toEqual([]);
  });

  it("deletes a project and everything in it", async () => {
    const { api, project } = await readyUser();
    await api.ok("POST", `/projects/${project.id}/leads`, { leads: [{ placeId: "p1", name: "Ace" }] });
    await api.ok("DELETE", `/projects/${project.id}`);
    expect((await api.get(`/projects/${project.id}`)).status).toBe(404);
    expect(await dataDb.select().from(schema.leads).where(eq(schema.leads.projectId, project.id))).toEqual([]);
  });
});

describe("paid lookups", () => {
  it("prices a lookup without spending", async () => {
    const { api, project } = await readyUser();
    const before = harness.fake.requests.length;
    expect(await api.ok("POST", `/projects/${project.id}/lookups/find_leads?dryRun=1`, { query: "plumber", location: "Austin", pages: 3 })).toMatchObject({ dryRun: true, estimate: { min: 0.07, max: 0.21 } });
    expect(await api.ok("POST", `/projects/${project.id}/lookups/find_creators?dryRun=1`, { platform: "youtube", query: "espresso", pages: 2 })).toMatchObject({ estimate: { min: 0.04, max: 0.04 } });
    expect(harness.fake.requests.length).toBe(before);
  });

  it("runs, logs the spend, then serves repeats from the cache for free", async () => {
    const { api, project, userId } = await readyUser();
    const path = `/projects/${project.id}/lookups/find_leads`;
    const before = harness.fake.requests.length;

    const first = await api.ok("POST", path, { query: "plumber", location: "Austin, TX", pages: 2 });
    expect(first).toMatchObject({ cached: false, costUsd: 0.14 });
    expect(callsTo("/v1/maps/search", before).map((r) => r.body)).toMatchObject([{ query: "plumber in Austin, TX", limit: 20, region: "us" }, { page_token: "1" }]);
    expect(first.data.leads.length).toBe(24);
    expect(first.data.leads[0]).toMatchObject({ placeId: "place_0", category: "plumber", types: ["plumber"] });

    const again = await api.ok("POST", path, { query: "plumber", location: "Austin, TX", pages: 2 });
    expect(again).toMatchObject({ cached: true, costUsd: 0 });
    expect(callsTo("/v1/maps/search", before)).toHaveLength(2);

    await new Promise((resolve) => setTimeout(resolve, 50));
    const usage = await api.ok("GET", "/usage");
    expect(usage.total.costUsd).toBeCloseTo(0.14, 4);
    expect(usage.byFeature[0]).toMatchObject({ feature: "leads" });
    const rows = await db.select().from(schema.usageLog).where(eq(schema.usageLog.userId, userId));
    expect(rows.every((row) => row.projectId === project.id)).toBe(true);
  });

  it("refuses a lookup whose worst case is above max_cost_usd, before calling YepAPI", async () => {
    const { api, project } = await readyUser();
    const before = harness.fake.requests.length;
    const res = await api.post(`/projects/${project.id}/lookups/find_leads?maxCostUsd=0.1`, { query: "plumber", pages: 3 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: "cost_ceiling_exceeded" });
    expect(res.body.error?.message).toContain("up to $0.21");
    expect(harness.fake.requests.length).toBe(before);
  });

  it("validates input and unknown lookups", async () => {
    const { api, project } = await readyUser();
    expect((await api.post(`/projects/${project.id}/lookups/no_such_lookup`, {})).status).toBe(404);
    const bad = await api.post(`/projects/${project.id}/lookups/find_creators`, { platform: "myspace", query: "x" });
    expect(bad.status).toBe(400);
    expect(bad.body.error?.code).toBe("validation_error");
  });

  it("maps provider failures to errors the user can act on", async () => {
    const { api, project } = await readyUser();
    harness.fake.failures.set("/v1/maps/search", [{ status: 402, code: "INSUFFICIENT_BALANCE" }]);
    const res = await api.post(`/projects/${project.id}/lookups/find_leads`, { query: "nocredits" });
    expect(res.status).toBe(402);
    expect(res.body.error?.code).toBe("yepapi_no_credits");
  });

  it("lists sources and filter fields for free", async () => {
    const { api } = await signUp();
    const sources = await api.ok("GET", "/sources");
    expect(sources.sources.find((s: { id: string }) => s.id === "hackernews")).toMatchObject({ via: "api" });
    // Without Reddit app credentials, Reddit goes through Google.
    expect(sources.sources.find((s: { id: string }) => s.id === "reddit")).toMatchObject({ via: "google" });
    const fields = await api.ok("GET", "/filter-fields");
    expect(fields.leads.map((f: { key: string }) => f.key)).toContain("website");
    expect(fields.leadPresets.length).toBeGreaterThan(2);
  });
});

describe("creators", () => {
  it("finds YouTube creators from channel and video search, most-matched first", async () => {
    const { api, project } = await readyUser();
    const before = harness.fake.requests.length;
    const res = await api.ok("POST", `/projects/${project.id}/lookups/find_creators`, { platform: "youtube", query: "home espresso", pages: 2 });
    // Two pages of channels (the second page ends the list) and one of videos.
    expect(callsTo("/v1/youtube/search", before).map((r) => r.body.type)).toEqual(["channel", "channel", "video"]);
    expect(res.costUsd).toBe(0.03);
    const top = res.data.creators[0];
    expect(top).toMatchObject({ platform: "youtube", matchedPosts: 3, followers: 10_000 });
    expect(res.data.creators.length).toBe(12);
  });

  it("finds TikTok creators and leaves private accounts out", async () => {
    const { api, project } = await readyUser();
    const res = await api.ok("POST", `/projects/${project.id}/lookups/find_creators`, { platform: "tiktok", query: "espresso" });
    const handles = res.data.creators.map((c: { handle: string }) => c.handle);
    expect(handles).toContain("brewlab");
    expect(handles).toContain("newcreator3");
    expect(handles).not.toContain("privatebean");
    expect(res.data.creators[0]).toMatchObject({ handle: "brewlab", matchedPosts: 3 });
  });

  it("finds Instagram creators from its search and from Google, and falls back when its search is down", async () => {
    const { api, project } = await readyUser();
    const res = await api.ok("POST", `/projects/${project.id}/lookups/find_creators`, { platform: "instagram", query: "espresso" });
    const handles = res.data.creators.map((c: { handle: string }) => c.handle);
    expect(handles).toContain("brewlab");
    expect(handles).not.toContain("hiddenbeans");
    expect(res.data.creators.filter((c: { followers: number | null }) => c.followers != null).length).toBeGreaterThan(1);
    expect(res.data.creators.some((c: { matchedPosts?: number; followers: number | null }) => c.matchedPosts && c.followers == null)).toBe(true);

    harness.fake.failures.set("/v1/instagram/search", [{ status: 503, code: "UPSTREAM_ERROR", message: "Instagram search failed" }]);
    const fallback = await api.ok("POST", `/projects/${project.id}/lookups/find_creators`, { platform: "instagram", query: "latte art" });
    expect(fallback.data.notes[0]).toMatch(/Google's index/);
    expect(fallback.data.creators.length).toBeGreaterThan(0);
  });

  it("analyses a creator: averages, engagement, frequency and contacts", async () => {
    const { api, project } = await readyUser();
    const tiktok = (await api.ok("POST", `/projects/${project.id}/lookups/analyse_creator`, { platform: "tiktok", handle: "@brewlab" })).data;
    expect(tiktok).toMatchObject({ analysed: true, followers: 4000, avgViews: 20000, engagementRate: 25, emails: ["brewlab@mail.example"], links: ["https://www.instagram.com/brewlab"] });
    expect(tiktok.postsPerWeek).toBeCloseTo(3.9, 0);

    const youtube = await api.ok("POST", `/projects/${project.id}/lookups/analyse_creator`, { platform: "youtube", handle: "@brewlab" });
    // The handle is looked up first, then the about tab and the videos.
    expect(youtube.costUsd).toBe(0.03);
    expect(youtube.data).toMatchObject({ hasBusinessEmail: true, emails: ["brewlab@studio.example"], country: "United Kingdom", links: ["https://brewlab.example"] });

    const instagram = (await api.ok("POST", `/projects/${project.id}/lookups/analyse_creator`, { platform: "instagram", handle: "https://www.instagram.com/brewlab/" })).data;
    expect(instagram).toMatchObject({ handle: "brewlab", emails: ["collabs@brewlab.example"], engagementRate: 3.2, country: "London" });
  });

  it("saves creators, keeps an analysed copy over a search copy, and tracks outreach", async () => {
    const { api, project } = await readyUser();
    const base = `/projects/${project.id}/creators`;
    const analysed = (await api.ok("POST", `/projects/${project.id}/lookups/analyse_creator`, { platform: "tiktok", handle: "brewlab" })).data;
    await api.ok("POST", base, { creators: [analysed], tags: ["coffee"] });
    // The same creator again from a search result: numbers stay, status and tags merge.
    await api.ok("POST", base, { creators: [{ platform: "tiktok", id: analysed.id, handle: "brewlab", url: analysed.url, followers: null }], tags: ["shortlist"] });
    const list = await api.ok("GET", base);
    expect(list.total).toBe(1);
    expect(list.creators[0]).toMatchObject({ followers: 4000, emails: ["brewlab@mail.example"], status: "new" });
    expect(list.creators[0].tags.sort()).toEqual(["coffee", "shortlist"]);
    expect(list.creators[0].data.analysed).toBe(true);

    const id = list.creators[0].id;
    await api.ok("PATCH", `${base}/${id}`, { status: "contacted", notes: "DM sent" });
    await api.ok("POST", `${base}/bulk`, { ids: [id], removeTags: ["coffee"] });
    expect((await api.ok("GET", `${base}?status=contacted`)).creators[0]).toMatchObject({ notes: "DM sent", tags: ["shortlist"] });

    expect(await api.ok("POST", `${base}/analyse?dryRun=1`, { ids: [id] })).toMatchObject({ estimate: { min: 0.02, max: 0.03 } });
    expect(await api.ok("POST", `${base}/analyse`, { ids: [id] })).toMatchObject({ analysed: 1, failed: [] });
    await api.ok("POST", `${base}/delete`, { ids: [id] });
    expect((await api.ok("GET", base)).total).toBe(0);
  });
});

describe("leads", () => {
  it("finds emails for leads with their own website, and skips the rest for free", async () => {
    const { api, project } = await readyUser();
    const leads = (await api.ok("POST", `/projects/${project.id}/lookups/find_leads`, { query: "plumber" })).data.leads.slice(0, 5);
    const priced = await api.ok("POST", `/projects/${project.id}/lookups/lead_emails?dryRun=1`, { leads, method: "website" });
    expect(priced.estimate.max).toBe(0.03);
    const res = await api.ok("POST", `/projects/${project.id}/lookups/lead_emails`, { leads, method: "website" });
    const withSite = res.data.results.find((r: { placeId: string }) => r.placeId === "place_1");
    expect(withSite.emails).toEqual(["hello@place1.example", "joe.plumber@gmail.com"]);
    // place_0 has no website and place_4 only a Facebook page: nothing to read, nothing paid.
    expect(res.data.results.find((r: { placeId: string }) => r.placeId === "place_0").emails).toEqual([]);
    expect(res.data.results.find((r: { placeId: string }) => r.placeId === "place_4").emails).toEqual([]);
    expect(res.costUsd).toBe(0.02);
  });
});

describe("standalone lookups", () => {
  it("run without a project, in the US market by default", async () => {
    const { api, userId } = await signUp();
    await api.ok("PUT", "/settings/yepapi-key", { apiKey: YEP_KEY });
    const before = harness.fake.requests.length;
    await api.ok("POST", "/lookups/find_creators", { platform: "youtube", query: "espresso" });
    expect(callsTo("/v1/youtube/search", before)[0]?.body).toMatchObject({ geo: "US", lang: "en" });
    let rows: (typeof schema.usageLog.$inferSelect)[] = [];
    for (let i = 0; i < 50 && rows.length === 0; i++) {
      rows = await db.select().from(schema.usageLog).where(eq(schema.usageLog.userId, userId));
      if (!rows.length) await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(new Set(rows.map((r) => r.projectId))).toEqual(new Set([null]));
  });

  it("need a signed-in user", async () => {
    const res = await client({}).post("/lookups/find_leads", { query: "x" });
    expect(res.status).toBe(401);
  });
});
