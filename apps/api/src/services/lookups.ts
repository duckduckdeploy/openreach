import { DEFAULT_CONVERSATION_SOURCES, DEFAULT_MENTION_SOURCES, type Lead, PLATFORM_IDS, SOURCE_IDS } from "@openreach/shared";
import type { YepApi } from "@openreach/yepapi";
import { z } from "zod";
import { analyseCreator, ANALYSE_USD, discoverCreators, discoveryCalls, similarInstagram } from "../lib/creators";
import { dedupeLeads, EMAIL_USD, findLeadEmails, MAPS_PAGE_USD, searchPlaces } from "../lib/leads";
import { AI_MIN_USD, aiScore, applyVerdicts, planSearches, rankCommunities, runSearches, type SearchRequest } from "../lib/mention-search";
import { mapLimit } from "../lib/pool";

/**
 * The market a lookup runs in: a project's, or one chosen for a standalone tool (id null).
 * Omitted country and language fields in a lookup's input fall back to it.
 */
export type Market = { id: string | null; locationCode: number; country: string; language: string; description?: string | null };
type Project = Market;
export type Estimate = { min: number; max: number | null; formula?: string };
/** `partial`: some paid parts failed; the result is returned but not cached. */
type Result = { data: unknown; costUsd: number; partial?: boolean };

export type Lookup<S extends z.ZodObject = z.ZodObject> = {
  name: string;
  title: string;
  description: string;
  feature: string;
  /** Seconds a result is reused for the same user and input. 0 = never cached. */
  ttl: number;
  input: S;
  estimate: (input: z.infer<S>, project: Project) => Estimate;
  /** `maxCostUsd` is passed only to lookups without an upper price (estimate.max null), which must stay under it while running. */
  run: (yep: YepApi, input: z.infer<S>, project: Project, limits: { maxCostUsd?: number }) => Promise<Result>;
};

const HOUR = 3600;
const DAY = 24 * HOUR;

const round = (n: number) => Math.round(n * 100) / 100;
const flat = (usd: number, formula: string): Estimate => ({ min: round(usd), max: round(usd), formula });

function define<S extends z.ZodObject>(lookup: Lookup<S>): Lookup {
  return lookup as unknown as Lookup;
}

const platform = z.enum(PLATFORM_IDS as ["youtube", "tiktok", "instagram"]);
const handle = z.string().trim().min(1).max(200).describe("Handle (with or without @), profile URL, or YouTube channel ID");
const country = z.string().trim().length(2).toLowerCase().optional().describe("ISO country code, e.g. us. Defaults to the project's country.");
const language = z.string().min(2).max(10).optional().describe("Language code, e.g. en. Defaults to the project's language.");
const terms = (max: number, what: string) => z.array(z.string().trim().min(2).max(120)).min(1).max(max).describe(what);
const sources = (fallback: string[]) =>
  z
    .array(z.enum(SOURCE_IDS as [string, ...string[]]))
    .min(1)
    .max(SOURCE_IDS.length)
    .default(fallback)
    .describe("Source IDs to search (see list_sources). Defaults to the usual communities.");
const depth = z.union([z.literal(10), z.literal(20)]).default(10).describe("Google results read per source search: 10 ($0.01) or 20 ($0.02)");
const days = z.number().int().min(1).max(3650).optional().describe("Only pages from the last N days");
const aiScoring = z.boolean().default(false).describe("Let an AI model check each result's relevance, intent and sentiment. About $0.01 per 25 results.");

const since = (d?: number) => (d ? new Date(Date.now() - d * DAY) : undefined);

/** Price of a community search: Google searches, plus the AI pass when asked (token-priced, so open-ended). */
function searchEstimate(request: SearchRequest, ai: boolean): Estimate {
  const plan = planSearches(request);
  const formula = `${plan.serpSearches} Google searches × $${(Math.ceil((request.depth ?? 10) / 10) * 0.01).toFixed(2)}, again for any that find nothing at first${plan.apiSearches ? ` + ${plan.apiSearches} free API searches` : ""}${ai ? " + AI scoring from $0.01 per 25 results" : ""}`;
  return ai ? { min: round(plan.serpUsd + AI_MIN_USD), max: null, formula } : { min: plan.serpUsd, max: plan.serpUsdMax, formula };
}

async function communitySearch(yep: YepApi, request: SearchRequest, ai: boolean, product: string | null | undefined, maxCostUsd?: number) {
  const plan = planSearches(request);
  const outcome = await runSearches(yep, plan, request);
  let mentions = outcome.mentions;
  let costUsd = outcome.costUsd;
  const warnings = [...outcome.warnings];
  if (ai && mentions.length) {
    // Token-priced: score only as many batches as the ceiling leaves room for, best results first.
    const room = maxCostUsd == null ? Infinity : Math.floor((maxCostUsd - costUsd) / AI_MIN_USD);
    const scored = mentions.slice(0, Math.max(0, Math.min(mentions.length, room * 25)));
    if (scored.length < mentions.length) warnings.push(`AI scoring covered the first ${scored.length} results to stay under the spending limit.`);
    const scoring = await aiScore(yep, scored, { mode: request.mode, terms: request.terms, product });
    costUsd += scoring.costUsd;
    if (scoring.failed) warnings.push(`${scoring.failed} AI scoring batch${scoring.failed === 1 ? "" : "es"} failed; those results keep their keyword scores.`);
    mentions = [...applyVerdicts(scored, scoring.verdicts), ...mentions.slice(scored.length)];
    if (request.mode === "topic") mentions.sort((a, b) => b.intent - a.intent);
  }
  return { mentions, costUsd: round(costUsd), warnings, searches: plan.searches.length, partial: warnings.length > 0 };
}

export const lookups: Lookup[] = [
  // ── Influencers ───────────────────────────────────────────────────────────
  define({
    name: "find_creators",
    title: "Find creators",
    description:
      "Creators on YouTube, TikTok or Instagram for a niche keyword, ranked by how often and how widely they appear for it. Returns followers where search shows them; run analyse_creator for averages, engagement and contacts.",
    feature: "influencers",
    ttl: DAY,
    input: z.object({
      platform,
      query: z.string().trim().min(2).max(120).describe("Niche or topic, e.g. home espresso"),
      pages: z.number().int().min(1).max(3).default(1).describe("Result pages per search; more pages find more creators"),
      country,
      language,
    }),
    estimate: (i) => flat(discoveryCalls(i.platform, i.pages) * 0.01, `${discoveryCalls(i.platform, i.pages)} searches × $0.01`),
    run: async (yep, i, p) => {
      const found = await discoverCreators(yep, i.platform, i.query, { pages: i.pages, country: i.country ?? p.country, language: i.language ?? p.language });
      return { data: { platform: i.platform, query: i.query, ...found }, costUsd: found.costUsd };
    },
  }),
  define({
    name: "analyse_creator",
    title: "Analyse a creator",
    description: "One creator's profile and recent posts: followers, average views, likes and comments, engagement rate, posts per week, last post, country, emails and phones in the bio, and links.",
    feature: "influencers",
    ttl: DAY,
    input: z.object({ platform, handle }),
    estimate: () => ({ ...ANALYSE_USD, formula: "Profile and recent posts, $0.01 each (a YouTube handle is looked up first, $0.01)" }),
    run: async (yep, i) => {
      const { creator, costUsd } = await analyseCreator(yep, i.platform, i.handle);
      return { data: creator, costUsd };
    },
  }),
  define({
    name: "analyse_creators",
    title: "Analyse several creators",
    description: "analyse_creator for up to 25 creators on one platform at once. Creators that fail are listed in `failed`.",
    feature: "influencers",
    ttl: DAY,
    input: z.object({ platform, handles: z.array(handle).min(1).max(25) }),
    estimate: (i) => ({ min: round(i.handles.length * ANALYSE_USD.min), max: round(i.handles.length * ANALYSE_USD.max), formula: `${i.handles.length} creators × $0.02–0.03` }),
    run: async (yep, i) => {
      let costUsd = 0;
      const failed: { handle: string; error: string }[] = [];
      const creators = await mapLimit(i.handles, 4, async (h) => {
        try {
          const res = await analyseCreator(yep, i.platform, h);
          costUsd += res.costUsd;
          return res.creator;
        } catch (error) {
          failed.push({ handle: h, error: (error as Error).message });
          return null;
        }
      });
      return { data: { creators: creators.filter(Boolean), failed }, costUsd: round(costUsd), partial: failed.length > 0 };
    },
  }),
  define({
    name: "similar_creators",
    title: "Similar Instagram accounts",
    description: "Instagram's own suggestions of accounts like one you already know: a quick way to grow a shortlist of lookalike creators.",
    feature: "influencers",
    ttl: 7 * DAY,
    input: z.object({ handle }),
    estimate: () => flat(0.01, "$0.01 per call"),
    run: async (yep, i) => {
      const res = await similarInstagram(yep, i.handle);
      return { data: { handle: i.handle, creators: res.creators }, costUsd: res.costUsd };
    },
  }),

  // ── Leads ────────────────────────────────────────────────────────────────
  define({
    name: "find_leads",
    title: "Find leads on Google Maps",
    description:
      "Businesses on Google Maps for a search in a place (\"plumber\" in \"Austin, TX\"): name, category, address, phone, website, rating, reviews, status and hours. Up to 3 pages of 20. Filter the result with the rules in the app, or pass minRating/openNow/includedType here. For a whole city, use a project lead search with grid mode.",
    feature: "leads",
    ttl: 7 * DAY,
    input: z.object({
      query: z.string().trim().min(2).max(120).describe("What to find, e.g. plumber, vegan restaurant, dentist"),
      location: z.string().trim().max(120).optional().describe("Where: a city, region, postcode or neighbourhood"),
      pages: z.number().int().min(1).max(3).default(1).describe("Pages of 20 places, $0.07 each"),
      includedType: z.string().trim().max(60).optional().describe("A Google place type, e.g. restaurant, plumber, dentist"),
      minRating: z.number().min(0).max(5).optional(),
      openNow: z.boolean().optional(),
      priceLevels: z.array(z.enum(["free", "inexpensive", "moderate", "expensive", "very_expensive"])).optional(),
      latitude: z.number().min(-90).max(90).optional().describe("Search around this point instead of (or with) a location name"),
      longitude: z.number().min(-180).max(180).optional(),
      radiusKm: z.number().min(0.1).max(50).optional(),
      country,
      language,
    }),
    estimate: (i) => ({ min: MAPS_PAGE_USD, max: round(i.pages * MAPS_PAGE_USD), formula: `Up to ${i.pages} pages × $0.07 (fewer when Google has no more)` }),
    run: async (yep, i, p) => {
      const bias = i.latitude != null && i.longitude != null ? { latitude: i.latitude, longitude: i.longitude, radius_m: Math.round((i.radiusKm ?? 5) * 1000) } : undefined;
      const res = await searchPlaces(yep, {
        query: i.query,
        location: i.location,
        pages: i.pages,
        bias,
        params: { includedType: i.includedType, minRating: i.minRating, openNow: i.openNow, priceLevels: i.priceLevels, region: i.country ?? p.country, language: i.language ?? p.language },
      });
      return { data: { query: i.query, location: i.location ?? null, pages: res.pages, leads: dedupeLeads(res.leads) }, costUsd: res.costUsd };
    },
  }),
  define({
    name: "lead_emails",
    title: "Find emails for leads",
    description:
      "Contact emails for up to 25 businesses that have their own website. method=website reads the homepage ($0.01 each); method=directory asks a business-email directory for people at the domain ($0.03 each). Leads without a website are skipped for free.",
    feature: "leads",
    ttl: 30 * DAY,
    input: z.object({
      leads: z.array(z.object({ placeId: z.string().min(1).max(300), name: z.string().max(300).default(""), website: z.string().max(2000).nullable().optional(), domain: z.string().max(253).nullable().optional() })).min(1).max(25),
      method: z.enum(["website", "directory"]).default("website"),
    }),
    estimate: (i) => {
      const withSite = i.leads.filter((l) => l.domain || l.website).length;
      const price = EMAIL_USD[i.method];
      return { min: 0, max: round(withSite * price.max), formula: `${withSite} leads with a website × $${price.max.toFixed(2)}` };
    },
    run: async (yep, i) => {
      let costUsd = 0;
      const failed: string[] = [];
      const results = await mapLimit(i.leads, 4, async (l) => {
        const lead = { placeId: l.placeId, name: l.name, website: l.website ?? null, domain: l.domain ?? (l.website ? new URL(/^https?:/.test(l.website) ? l.website : `https://${l.website}`).hostname.replace(/^www\./, "") : null) } as Lead;
        try {
          const res = await findLeadEmails(yep, lead, i.method);
          costUsd += res.costUsd;
          return { placeId: l.placeId, emails: res.emails };
        } catch (error) {
          failed.push(`${l.name || l.placeId}: ${(error as Error).message}`);
          return { placeId: l.placeId, emails: [] as string[] };
        }
      });
      return { data: { method: i.method, results, failed }, costUsd: round(costUsd), partial: failed.length > 0 };
    },
  }),

  // ── Communities ──────────────────────────────────────────────────────────
  define({
    name: "brand_mentions",
    title: "Brand mentions",
    description:
      "Pages in communities that name your brand: Reddit, Quora, Hacker News, GitHub, Stack Overflow, X, LinkedIn, Product Hunt, review sites and more. Each source is a Google search ($0.01 per 10 results) or a free official API. Results must contain one of the terms.",
    feature: "mentions",
    ttl: 6 * HOUR,
    input: z.object({
      terms: terms(5, "Brand names and spellings, e.g. PostHog, posthog.com"),
      excludes: z.array(z.string().trim().min(2).max(60)).max(10).default([]).describe("Drop results containing these words"),
      sources: sources(DEFAULT_MENTION_SOURCES),
      depth,
      days,
      aiScoring,
    }),
    estimate: (i) => searchEstimate({ mode: "brand", terms: i.terms, excludes: i.excludes, sources: i.sources, depth: i.depth, since: since(i.days) }, i.aiScoring),
    run: async (yep, i, p, limits) => {
      const request: SearchRequest = { mode: "brand", terms: i.terms, excludes: i.excludes, sources: i.sources, depth: i.depth, since: since(i.days) };
      const res = await communitySearch(yep, request, i.aiScoring, p.description, limits.maxCostUsd);
      return { data: { terms: i.terms, mentions: res.mentions, communities: rankCommunities(res.mentions).slice(0, 20), warnings: res.warnings, searches: res.searches }, costUsd: res.costUsd, partial: res.partial };
    },
  }),
  define({
    name: "find_conversations",
    title: "Find customers in communities",
    description:
      "People asking about a problem your product solves: threads and questions phrased as requests (\"best…\", \"looking for…\", \"alternative to…\"), ranked by buying intent 0–100, with the communities they cluster in. Name competitors to catch people unhappy with them.",
    feature: "conversations",
    ttl: 12 * HOUR,
    input: z.object({
      problems: terms(3, "Problems or categories, e.g. crm for small business, track freelance invoices"),
      competitors: z.array(z.string().trim().min(2).max(60)).max(5).default([]),
      excludes: z.array(z.string().trim().min(2).max(60)).max(10).default([]),
      sources: sources(DEFAULT_CONVERSATION_SOURCES),
      phrasings: z.number().int().min(1).max(6).default(3).describe("Request phrasings per problem for Google sources"),
      depth,
      days: days.default(365),
      aiScoring,
    }),
    estimate: (i) =>
      searchEstimate({ mode: "topic", terms: i.problems, competitors: i.competitors, excludes: i.excludes, sources: i.sources, depth: i.depth, phrasings: i.phrasings, since: since(i.days) }, i.aiScoring),
    run: async (yep, i, p, limits) => {
      const request: SearchRequest = { mode: "topic", terms: i.problems, competitors: i.competitors, excludes: i.excludes, sources: i.sources, depth: i.depth, phrasings: i.phrasings, since: since(i.days) };
      const res = await communitySearch(yep, request, i.aiScoring, p.description, limits.maxCostUsd);
      return { data: { problems: i.problems, mentions: res.mentions, communities: rankCommunities(res.mentions).slice(0, 25), warnings: res.warnings, searches: res.searches }, costUsd: res.costUsd, partial: res.partial };
    },
  }),
  define({
    name: "find_subreddits",
    title: "Subreddit finder",
    description:
      "The subreddits where a topic is discussed most: ranked by matching threads, replies on them and how recent they are, with example threads. The best places to be active for an audience.",
    feature: "conversations",
    ttl: 7 * DAY,
    input: z.object({
      topics: terms(5, "Topics, problems or product categories"),
      phrasings: z.number().int().min(1).max(6).default(3),
      depth: z.union([z.literal(10), z.literal(20), z.literal(30)]).default(20).describe("Google results per search; Reddit threads cluster, so 20 finds more communities"),
      days: days.default(730),
    }),
    estimate: (i) => searchEstimate({ mode: "topic", terms: i.topics, sources: ["reddit"], phrasings: i.phrasings, depth: i.depth, since: since(i.days) }, false),
    run: async (yep, i) => {
      const request: SearchRequest = { mode: "topic", terms: i.topics, sources: ["reddit"], phrasings: i.phrasings, depth: i.depth, since: since(i.days) };
      const outcome = await runSearches(yep, planSearches(request), request);
      const subreddits = rankCommunities(outcome.mentions.filter((m) => m.community?.startsWith("r/")));
      return { data: { topics: i.topics, subreddits, threads: outcome.mentions.slice(0, 100), warnings: outcome.warnings }, costUsd: outcome.costUsd };
    },
  }),
];

export const lookupByName = new Map(lookups.map((lookup) => [lookup.name, lookup]));
