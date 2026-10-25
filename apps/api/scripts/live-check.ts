/**
 * Runs each engine once against the real YepAPI and prints a summary, to catch response shapes that
 * drifted from what the code expects. Costs about $0.25. Not part of the test suite.
 *
 *   YEPAPI_KEY=yep_sk_… pnpm --filter @openreach/api exec tsx scripts/live-check.ts
 */
import { createYepApi } from "@openreach/yepapi";

process.env.DATABASE_URL ??= "postgres://unused";
process.env.AUTH_SECRET ??= "live-check-secret-that-is-long-enough-xx";
process.env.ENCRYPTION_KEY ??= Buffer.alloc(32, 1).toString("base64");

const key = process.env.YEPAPI_KEY;
if (!key) throw new Error("Set YEPAPI_KEY");
const { analyseCreator, discoverCreators } = await import("../src/lib/creators");
const { searchPlaces } = await import("../src/lib/leads");
const { planSearches, rankCommunities, runSearches } = await import("../src/lib/mention-search");

let spent = 0;
const yep = createYepApi({ apiKey: key, onCall: (call) => void (spent += call.costUsd) });

async function check(name: string, run: () => Promise<unknown>) {
  try {
    console.log(`✅ ${name}:`, JSON.stringify(await run()));
  } catch (error) {
    console.log(`❌ ${name}: ${(error as Error).message}`);
  }
}

await check("youtube discover", async () => {
  const r = await discoverCreators(yep, "youtube", "home espresso", { pages: 1, country: "us", language: "en" });
  return { count: r.creators.length, top: r.creators.slice(0, 3).map((c) => [c.handle, c.followers, c.matchedPosts]) };
});
await check("tiktok discover", async () => {
  const r = await discoverCreators(yep, "tiktok", "home espresso", { pages: 1 });
  return { count: r.creators.length, top: r.creators.slice(0, 3).map((c) => [c.handle, c.followers, c.matchedPosts]) };
});
await check("instagram discover", async () => {
  const r = await discoverCreators(yep, "instagram", "home espresso", { pages: 1 });
  return { count: r.creators.length, notes: r.notes, top: r.creators.slice(0, 3).map((c) => [c.handle, c.followers]) };
});
await check("youtube analyse", async () => {
  const { creator: c } = await analyseCreator(yep, "youtube", "@jameshoffmann");
  return { followers: c.followers, avgViews: c.avgViews, er: c.engagementRate, ppw: c.postsPerWeek, last: c.lastPostAt, hasEmail: c.hasBusinessEmail, links: c.links?.length };
});
await check("tiktok analyse", async () => {
  const { creator: c } = await analyseCreator(yep, "tiktok", "jameshoffmann");
  return { followers: c.followers, avgViews: c.avgViews, er: c.engagementRate, posts: c.recent?.length };
});
await check("instagram analyse", async () => {
  const { creator: c } = await analyseCreator(yep, "instagram", "jimseven");
  return { followers: c.followers, avgLikes: c.avgLikes, er: c.engagementRate, ppw: c.postsPerWeek, emails: c.emails, links: c.links };
});
await check("maps", async () => {
  const r = await searchPlaces(yep, { query: "plumber", location: "Austin, TX", pages: 1 });
  return { count: r.leads.length, first: r.leads[0] && [r.leads[0].name, r.leads[0].domain, r.leads[0].reviews] };
});
await check("brand mentions (reddit via Google, HN, GitHub, Stack Overflow)", async () => {
  const request = { mode: "brand" as const, terms: ["posthog"], sources: ["reddit", "hackernews", "github", "stackoverflow"], since: new Date(Date.now() - 60 * 86_400_000) };
  const r = await runSearches(yep, planSearches(request), request);
  const bySource: Record<string, number> = {};
  for (const m of r.mentions) bySource[m.sourceId] = (bySource[m.sourceId] ?? 0) + 1;
  return { found: r.mentions.length, bySource, warnings: r.warnings, sample: r.mentions.slice(0, 2).map((m) => [m.sourceId, m.community, m.title.slice(0, 60)]) };
});
await check("subreddits", async () => {
  const request = { mode: "topic" as const, terms: ["crm for small business"], sources: ["reddit"], phrasings: 1, depth: 20 };
  const r = await runSearches(yep, planSearches(request), request);
  return rankCommunities(r.mentions).slice(0, 5).map((c) => [c.community, c.threads, c.comments]);
});
console.log(`Spent about $${spent.toFixed(2)}`);
