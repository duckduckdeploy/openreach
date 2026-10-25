import { describe, expect, it } from "vitest";
import {
  AGENT_SKILLS,
  agentSetupPrompt,
  belongsTo,
  CREATOR_FIELDS,
  type Creator,
  describeRules,
  extractEmails,
  filterRecords,
  intentOf,
  intentQueries,
  LEAD_FIELDS,
  LEAD_PRESETS,
  matches,
  MODEL_CATALOG,
  parseCount,
  parseResultMeta,
  postStats,
  relativeToDate,
  ruleGroupSchema,
  SCORING_MODEL,
  sentimentOf,
  sourceById,
  sourceOfUrl,
  SOURCES,
  subredditOf,
  toLead,
} from "./index";

describe("agent setup prompt", () => {
  const prompt = agentSetupPrompt({ mcpUrl: "https://api.example.com/mcp", docsUrl: "https://example.com/docs/mcp" });

  it("points at the install and its docs", () => {
    expect(prompt).toContain("URL: https://api.example.com/mcp");
    expect(prompt).toContain("https://example.com/docs/mcp");
  });

  it("keeps the key out of chat and verifies with free calls only", () => {
    expect(prompt).toMatch(/Never ask me to paste the key into this chat/);
    expect(prompt).toMatch(/OPENREACH_API_KEY/);
    expect(prompt).toMatch(/whoami and list_projects\. Both are free/);
    expect(prompt).toMatch(/do not run any paid lookup/);
  });

  it("lists skills with unique names", () => {
    expect(new Set(AGENT_SKILLS.map((s) => s.name)).size).toBe(AGENT_SKILLS.length);
  });
});

describe("model catalog", () => {
  it("has unique, well-formed model ids, including the scoring model", () => {
    const ids = MODEL_CATALOG.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(SCORING_MODEL);
  });
});

describe("sources", () => {
  it("has unique ids and at least one domain each", () => {
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
    for (const source of SOURCES) expect(source.domains.length, source.id).toBeGreaterThan(0);
    expect(SOURCES.length).toBeGreaterThanOrEqual(60);
  });

  it("matches hosts and subdomains, not lookalikes", () => {
    const reddit = sourceById.get("reddit")!;
    expect(belongsTo(reddit, "https://www.reddit.com/r/CRM/comments/abc")).toBe(true);
    expect(belongsTo(reddit, "https://old.reddit.com/r/CRM")).toBe(true);
    expect(belongsTo(reddit, "https://notreddit.com/r/CRM")).toBe(false);
    expect(belongsTo(reddit, "not a url")).toBe(false);
  });

  it("picks the most specific source for a URL", () => {
    expect(sourceOfUrl("https://www.linkedin.com/pulse/some-article")?.id).toBe("linkedin-articles");
    expect(sourceOfUrl("https://www.linkedin.com/posts/someone_activity")?.id).toBe("linkedin");
    expect(sourceOfUrl("https://example.com/")).toBeUndefined();
  });
});

describe("rules", () => {
  const plumber = toLead({ id: "places/ChIJ1", name: "Ace Plumbing", types: ["plumber", "point_of_interest"], primaryType: "plumber", address: "1 Main St", rating: 4.8, userRatingCount: 12, businessStatus: "OPERATIONAL" }, "plumber in Austin");
  const withSite = toLead({ id: "ChIJ2", name: "Pipe Pros", types: ["plumber"], website: "https://www.pipepros.com/contact", phone: "(512) 555-0100", rating: 3.6, userRatingCount: 240, businessStatus: "OPERATIONAL" });
  const facebookOnly = toLead({ id: "ChIJ3", name: "Drain Guy", website: "https://facebook.com/drainguy", userRatingCount: 3 });

  it("normalises places into leads", () => {
    expect(plumber.placeId).toBe("ChIJ1");
    expect(plumber.types).toEqual(["plumber"]);
    expect(withSite.domain).toBe("pipepros.com");
  });

  it("treats a social profile as no website", () => {
    const noWebsite = LEAD_PRESETS.find((p) => p.id === "no-website")!.rules;
    expect(filterRecords([plumber, withSite, facebookOnly], noWebsite, LEAD_FIELDS).map((l) => l.name)).toEqual(["Ace Plumbing", "Drain Guy"]);
  });

  it("combines all and any groups", () => {
    const group = { match: "all" as const, rules: [{ field: "website", op: "eq" as const, value: true }, { match: "any" as const, rules: [{ field: "rating", op: "lt" as const, value: 4 }, { field: "reviews", op: "lt" as const, value: 20 }] }] };
    expect(matches(group, withSite, LEAD_FIELDS)).toBe(true);
    expect(matches(group, plumber, LEAD_FIELDS)).toBe(false);
    expect(describeRules(group, LEAD_FIELDS)).toBe("website: yes and (rating < 4 or reviews < 20)");
  });

  it("never passes a comparison on a missing number", () => {
    const lead = toLead({ id: "x", name: "No reviews yet" });
    expect(matches({ match: "all", rules: [{ field: "reviews", op: "lt", value: 20 }] }, lead, LEAD_FIELDS)).toBe(false);
    expect(matches({ match: "all", rules: [{ field: "reviews", op: "missing" }] }, lead, LEAD_FIELDS)).toBe(true);
  });

  it("supports text, list, pattern and one-of operators, and refuses bad patterns", () => {
    expect(matches({ match: "all", rules: [{ field: "name", op: "contains", value: "PLUMB" }] }, plumber, LEAD_FIELDS)).toBe(true);
    expect(matches({ match: "all", rules: [{ field: "types", op: "in", value: ["electrician", "plumber"] }] }, plumber, LEAD_FIELDS)).toBe(true);
    expect(matches({ match: "all", rules: [{ field: "phone", op: "matches", value: "^\\(512\\)" }] }, withSite, LEAD_FIELDS)).toBe(true);
    expect(matches({ match: "all", rules: [{ field: "name", op: "matches", value: "([" }] }, plumber, LEAD_FIELDS)).toBe(false);
    expect(matches({ match: "all", rules: [{ field: "nope", op: "exists" }] }, plumber, LEAD_FIELDS)).toBe(false);
  });

  it("validates rule groups", () => {
    expect(ruleGroupSchema.safeParse(LEAD_PRESETS[0]!.rules).success).toBe(true);
    expect(ruleGroupSchema.safeParse({ match: "some", rules: [] }).success).toBe(false);
  });
});

describe("creators", () => {
  it("parses counts as platforms write them", () => {
    expect(parseCount("2.57M")).toBe(2_570_000);
    expect(parseCount("14.5K subscribers")).toBe(14_500);
    expect(parseCount("1,275,546 views")).toBe(1_275_546);
    expect(parseCount(845389)).toBe(845389);
    expect(parseCount("no views")).toBeNull();
  });

  it("finds emails in bios, including spelled-out ones", () => {
    expect(extractEmails("Business: hello@chefmaria.com", "collabs - maria [at] gmail [dot] com.")).toEqual(["hello@chefmaria.com", "maria@gmail.com"]);
    expect(extractEmails("logo@2x.png nothing here")).toEqual([]);
  });

  it("computes averages, engagement and posting frequency", () => {
    const day = 86_400_000;
    const now = Date.parse("2026-10-25T00:00:00Z");
    const posts = [0, 7, 14].map((d, i) => ({ id: String(i), url: "", title: null, views: 1000 * (i + 1), likes: 100, comments: 10, publishedAt: new Date(now - d * day).toISOString() }));
    const stats = postStats(posts, 10_000, "tiktok");
    expect(stats.avgViews).toBe(2000);
    expect(stats.engagementRate).toBe(1.1);
    expect(stats.postsPerWeek).toBe(1.5);
    expect(stats.lastPostAt).toBe(new Date(now).toISOString());
    expect(postStats(posts, 10_000, "youtube").engagementRate).toBe(20);
  });

  it("filters creators", () => {
    const creator: Creator = { platform: "youtube", id: "UC1", handle: "@a", name: "A", url: "", avatar: null, bio: "coffee", followers: 50_000, verified: false, emails: ["a@b.co"] };
    expect(matches({ match: "all", rules: [{ field: "followers", op: "gte", value: 10_000 }, { field: "hasEmail", op: "eq", value: true }] }, creator, CREATOR_FIELDS)).toBe(true);
  });

  it("turns relative times into dates", () => {
    const now = Date.parse("2026-10-25T00:00:00Z");
    expect(relativeToDate("2 weeks ago", now)).toBe(new Date(now - 14 * 86_400_000).toISOString());
    expect(relativeToDate("Streamed live", now)).toBeNull();
  });
});

describe("conversations", () => {
  const now = Date.parse("2026-10-25T00:00:00Z");

  it("reads reply counts and age from Google's result line", () => {
    const meta = parseResultMeta("50+ comments  ·  6 months ago", now);
    expect(meta.comments).toBe(50);
    expect(meta.publishedAt?.slice(0, 7)).toBe("2026-04");
    expect(parseResultMeta("3 answers · Mar 4, 2025", now)).toEqual({ comments: 3, publishedAt: new Date(Date.parse("Mar 4, 2025")).toISOString() });
  });

  it("scores requests for recommendations above plain posts", () => {
    const ask = intentOf({ title: "What's the best CRM for small business owners?", snippet: "Sick of HubSpot pricing", comments: 50, publishedAt: new Date(now - 5 * 86_400_000).toISOString() }, ["HubSpot"], now);
    const post = intentOf({ title: "Our CRM migration story", snippet: "We moved last year", publishedAt: new Date(now - 800 * 86_400_000).toISOString() }, [], now);
    expect(ask.intent).toBeGreaterThan(80);
    expect(ask.signals).toContain("names HubSpot");
    expect(post.intent).toBeLessThan(20);
  });

  it("builds intent queries and reads sentiment and subreddits", () => {
    expect(intentQueries("crm for small business", 2, ["HubSpot"])).toEqual(["crm for small business", "best crm for small business", "HubSpot alternative"]);
    expect(sentimentOf("I love it, works great")).toBe("positive");
    expect(sentimentOf("terrible support, avoid")).toBe("negative");
    expect(subredditOf("https://www.reddit.com/r/CRMSoftware/comments/1")).toBe("r/CRMSoftware");
  });
});
