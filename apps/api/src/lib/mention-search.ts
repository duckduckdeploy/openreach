import {
  afterOperator,
  belongsTo,
  intentOf,
  intentQueries,
  type Mention,
  parseResultMeta,
  SCORING_MODEL,
  sentimentOf,
  type Source,
  sourceById,
  siteOf,
  subredditOf,
  wordOf,
} from "@openreach/shared";
import type { GoogleSerpResult, YepApi } from "@openreach/yepapi";
import { API_NAMES, apiAvailable, CommunityApiError, type CommunityHit, searchApi } from "./community";
import { mapLimit } from "./pool";

/**
 * The search behind brand mentions, the customer finder, the subreddit finder and monitors.
 * A plan lists every search (source × query) and what it costs before anything runs; running it
 * fetches, keeps only results that belong to their source, drops duplicates and scores the rest.
 */

export type SearchMode = "brand" | "topic";

export type SearchRequest = {
  mode: SearchMode;
  /** Brand names (brand mode), or problems and categories (topic mode). */
  terms: string[];
  excludes?: string[];
  competitors?: string[];
  sources: string[];
  /** Google results per search: 10 or 20. */
  depth?: number;
  /** Topic mode: phrasings per term ("best …", "looking for …"). */
  phrasings?: number;
  /** Only pages newer than this (scheduled runs). */
  since?: Date;
};

/**
 * `retries`: other forms of the same Google search, run in order only while YepAPI's Google has
 * dropped the operator (results are not on the source); see `honoured`.
 */
export type PlannedSearch = { source: Source; query: string; retries?: string[]; via: "api" | "serp"; term: string };

/** Google searches per source at most: `site:`, `site:` again in another order, then the plain form. */
export const SERP_ATTEMPTS = 3;

/** `serpUsd` is the price when the first try of every search works; retries can add up to `serpUsdMax`. */
export type SearchPlan = { searches: PlannedSearch[]; serpSearches: number; apiSearches: number; serpUsd: number; serpUsdMax: number };

const SERP_USD_PER_PAGE = 0.01;
/** Results scored per AI request. YepAPI bills at least $0.01 a request. */
export const AI_BATCH = 25;
export const AI_MIN_USD = 0.01;

const negate = (word: string) => (/\s/.test(word) ? null : `-${word}`);

export function planSearches(request: SearchRequest): SearchPlan {
  const depth = request.depth ?? 10;
  const excludes = (request.excludes ?? []).map((word) => negate(word.trim())).filter(Boolean).join(" ");
  const searches: PlannedSearch[] = [];
  for (const id of request.sources) {
    const source = sourceById.get(id);
    if (!source) continue;
    const viaApi = apiAvailable(source.api);
    for (const term of request.terms) {
      const queries = request.mode === "topic" ? intentQueries(term, viaApi ? 2 : (request.phrasings ?? 3), request.competitors ?? []) : [term];
      for (const query of queries) {
        if (viaApi) {
          searches.push({ source, query, via: "api", term });
        } else {
          // site: first, for results from the source only. YepAPI's Google drops operators on some
          // calls (whole page on the source, or none of it), so a dropped one is tried once more in
          // another order and then as the words plus the source's name. Words unquoted: with
          // quotes Google drops site:. after: holds on every form.
          const after = request.since ? afterOperator(request.since) : "";
          const site = `site:${siteOf(source)}`;
          const join = (...parts: string[]) => parts.filter(Boolean).join(" ");
          searches.push({ source, query: join(site, query, excludes, after), retries: [join(query, excludes, after, site), join(query, wordOf(source), excludes, after)], via: "serp", term });
        }
      }
    }
  }
  const serpSearches = searches.filter((s) => s.via === "serp").length;
  const serpUsd = Math.round(serpSearches * Math.ceil(depth / 10) * SERP_USD_PER_PAGE * 100) / 100;
  return { searches, serpSearches, apiSearches: searches.length - serpSearches, serpUsd, serpUsdMax: Math.round(serpUsd * SERP_ATTEMPTS * 100) / 100 };
}

export const aiBatches = (results: number) => Math.ceil(results / AI_BATCH);

/** Same page, however it was linked: no tracking parameters, fragment, trailing slash or Reddit subdomain. */
export function canonicalUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    for (const key of [...u.searchParams.keys()]) if (/^(utm_|ref$|share|si$|context$|sort$)/i.test(key)) u.searchParams.delete(key);
    u.hostname = u.hostname.toLowerCase().replace(/^(www|old|new|m|np)\.reddit\.com$/, "reddit.com").replace(/^www\./, "");
    if (u.hostname === "twitter.com") u.hostname = "x.com";
    return u.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

/** "Reddit · r/CRMSoftware" → "r/CRMSoftware"; other sites keep Google's site name. */
function communityOf(source: Source, result: GoogleSerpResult): string | null {
  const reddit = subredditOf(result.url);
  if (reddit) return reddit;
  const name = typeof result.data?.websiteName === "string" ? result.data.websiteName : null;
  if (!name) return source.name;
  const after = name.split(" · ")[1];
  return after?.trim() || name;
}

const contains = (haystack: string, needle: string) => haystack.toLowerCase().includes(needle.toLowerCase());

type Raw = Omit<Mention, "intent" | "sentiment" | "signals">;

function fromSerp(search: PlannedSearch, result: GoogleSerpResult): Raw | null {
  if (result.type !== "organic" || !result.url || !belongsTo(search.source, result.url)) return null;
  const meta = parseResultMeta(typeof result.data?.breadcrumb === "string" ? result.data.breadcrumb : null);
  return {
    url: result.url,
    sourceId: search.source.id,
    title: result.title || search.source.name,
    snippet: result.description ?? "",
    community: communityOf(search.source, result),
    author: null,
    publishedAt: meta.publishedAt ?? (typeof result.data?.timestamp === "string" ? result.data.timestamp : null),
    comments: meta.comments,
    score: null,
    term: search.term,
  };
}

/**
 * True when Google kept the operator: no results at all (nothing on the source), or at least half
 * of them on the source. A dropped `site:` returns the open web, with the source rarely in it.
 */
export function honoured(source: Source, results: GoogleSerpResult[]): boolean {
  const organic = results.filter((result) => result.type === "organic" && result.url);
  return organic.length === 0 || organic.filter((result) => belongsTo(source, result.url)).length * 2 >= organic.length;
}

const fromApi = (search: PlannedSearch, hit: CommunityHit): Raw => ({ ...hit, sourceId: search.source.id, term: search.term });

export type SearchOutcome = { mentions: Mention[]; costUsd: number; warnings: string[]; searchesDone: number };

/**
 * Runs a plan. Each search that fails is reported in `warnings` and the rest go on, except errors
 * that would fail every paid call the same way (bad key, no credits, budget), which `isFatal` names.
 */
export async function runSearches(
  yep: YepApi,
  plan: SearchPlan,
  request: SearchRequest,
  hooks: { isFatal?: (error: unknown) => boolean; onProgress?: (done: number) => Promise<void> | void; shouldStop?: () => boolean } = {},
): Promise<SearchOutcome> {
  const depth = request.depth ?? 10;
  const raw: Raw[] = [];
  const warnings = new Set<string>();
  let costUsd = 0;
  let done = 0;
  let fatal: unknown = null;

  await mapLimit(plan.searches, 4, async (search) => {
    if (fatal || hooks.shouldStop?.()) return;
    try {
      if (search.via === "api" && search.source.api) {
        const hits = await searchApi(search.source.api, search.query, { since: request.since, limit: 30 });
        raw.push(...hits.map((hit) => fromApi(search, hit)));
      } else {
        // Results on the source are kept from every try; the next form runs after a dropped operator
        // or an upstream failure. The search fails only when every form failed.
        let failure: unknown = null;
        let answered = false;
        for (const query of [search.query, ...(search.retries ?? [])]) {
          try {
            const res = await yep.serp.google({ query, depth });
            costUsd += res.costUsd;
            answered = true;
            const results = res.data.results ?? [];
            raw.push(...results.map((result) => fromSerp(search, result)).filter((item): item is Raw => item !== null));
            if (honoured(search.source, results)) break;
          } catch (error) {
            if (hooks.isFatal?.(error)) throw error;
            failure = error;
          }
        }
        if (!answered) throw failure;
      }
    } catch (error) {
      if (hooks.isFatal?.(error)) {
        fatal = error;
        return;
      }
      warnings.add(error instanceof CommunityApiError ? `${API_NAMES[error.api]}: ${error.message}` : `${search.source.name}: ${(error as Error).message}`);
    } finally {
      done += 1;
      await hooks.onProgress?.(done);
    }
  });
  if (fatal) throw Object.assign(fatal as object, { partialCostUsd: costUsd });

  return { mentions: scoreMentions(raw, request), costUsd: Math.round(costUsd * 100) / 100, warnings: [...warnings], searchesDone: done };
}

/** Accounts that post automatically: dependency bots on GitHub, moderators' bots on Reddit. */
const BOTS = /(\[bot\]$|^dependabot|^renovate|^github-actions|^automoderator$)/i;

const STOPWORDS = new Set(["the", "and", "for", "with", "you", "your", "how", "what", "best", "any", "tool", "tools", "app", "apps", "software", "looking", "need", "help", "from", "that", "this", "are", "can", "use"]);

/** True when the text carries at least half the meaningful words of the term (at least one), or names a competitor. */
export function onTopic(text: string, term: string, competitors: string[]): boolean {
  const words = term
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
  if (competitors.some((name) => contains(text, name))) return true;
  if (!words.length) return true;
  const lower = text.toLowerCase();
  const hits = words.filter((word) => lower.includes(word.replace(/s$/, ""))).length;
  return hits >= Math.max(1, Math.ceil(words.length / 2));
}

/** Drops off-topic and excluded results and duplicates, then scores intent and sentiment. */
export function scoreMentions(raw: Raw[], request: Pick<SearchRequest, "mode" | "terms" | "excludes" | "competitors">): Mention[] {
  const excludes = (request.excludes ?? []).map((word) => word.trim()).filter(Boolean);
  const byUrl = new Map<string, Mention>();
  for (const item of raw) {
    const text = `${item.title} ${item.snippet} ${item.url}`;
    // A brand mention must actually name the brand: Google matches loosely, and the free APIs search whole threads.
    if (request.mode === "brand" && !request.terms.some((term) => contains(text, term))) continue;
    // A conversation must be about the problem: at least half its words, or a named competitor.
    if (request.mode === "topic" && !onTopic(text, item.term ?? request.terms[0] ?? "", request.competitors ?? [])) continue;
    if (excludes.some((word) => contains(text, word))) continue;
    if (item.author && BOTS.test(item.author)) continue;
    const key = canonicalUrl(item.url);
    const { intent, signals } = intentOf(item, request.competitors);
    const mention: Mention = { ...item, url: key, intent, signals, sentiment: sentimentOf(`${item.title} ${item.snippet}`) };
    const seen = byUrl.get(key);
    // Keep the richer copy: the free APIs know authors and scores that search results do not.
    if (!seen || (mention.author && !seen.author) || mention.intent > seen.intent) byUrl.set(key, seen ? { ...seen, ...mention, intent: Math.max(seen.intent, mention.intent) } : mention);
  }
  return [...byUrl.values()].sort((a, b) => (request.mode === "topic" ? b.intent - a.intent : 0) || (Date.parse(b.publishedAt ?? "") || 0) - (Date.parse(a.publishedAt ?? "") || 0));
}

export type AiVerdict = { relevant: boolean; intent?: number; sentiment?: Mention["sentiment"]; note?: string };

/**
 * Optional AI pass: whether each result is really about the brand or a real request for help,
 * its intent and sentiment, and one line on why. In batches of AI_BATCH; a batch that fails or
 * answers badly leaves its results as the heuristics scored them.
 */
export async function aiScore(
  yep: YepApi,
  mentions: Mention[],
  context: { mode: SearchMode; terms: string[]; product?: string | null },
): Promise<{ verdicts: Map<string, AiVerdict>; costUsd: number; failed: number }> {
  const verdicts = new Map<string, AiVerdict>();
  let costUsd = 0;
  let failed = 0;
  const batches: Mention[][] = [];
  for (let i = 0; i < mentions.length; i += AI_BATCH) batches.push(mentions.slice(i, i + AI_BATCH));
  const task =
    context.mode === "brand"
      ? `Each item is a page that may mention the brand "${context.terms.join('", "')}". Decide whether it is really about this brand (not a namesake or unrelated word), its sentiment toward the brand, and how much it invites a reply from the brand (0-100: a question, complaint or comparison scores high).`
      : `Each item is a community post. The product: ${context.product || context.terms.join(", ")}. Decide whether the author is a potential customer asking for help, recommendations or alternatives related to "${context.terms.join('", "')}", and score that buying intent 0-100.`;
  await mapLimit(batches, 3, async (batch) => {
    const items = batch.map((m, i) => ({ i, title: m.title.slice(0, 200), text: m.snippet.slice(0, 400), where: m.community ?? m.sourceId }));
    try {
      const res = await yep.ai.chat({
        model: SCORING_MODEL,
        temperature: 0,
        maxTokens: 120 * batch.length + 200,
        messages: [
          { role: "system", content: "You classify community posts for a marketing tool. Answer with JSON only." },
          {
            role: "user",
            content: `${task}\nReturn {"items":[{"i":number,"relevant":boolean,"intent":number,"sentiment":"positive"|"neutral"|"negative","note":"under 15 words"}]} with one entry per item.\n\n${JSON.stringify(items)}`,
          },
        ],
      });
      costUsd += res.costUsd;
      const content = res.data.message.content ?? "";
      const json = JSON.parse(content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1)) as { items?: { i: number; relevant?: boolean; intent?: number; sentiment?: string; note?: string }[] };
      for (const entry of json.items ?? []) {
        const mention = batch[entry.i];
        if (!mention) continue;
        verdicts.set(mention.url, {
          relevant: entry.relevant !== false,
          intent: typeof entry.intent === "number" ? Math.max(0, Math.min(100, Math.round(entry.intent))) : undefined,
          sentiment: entry.sentiment === "positive" || entry.sentiment === "negative" || entry.sentiment === "neutral" ? entry.sentiment : undefined,
          note: typeof entry.note === "string" ? entry.note.slice(0, 160) : undefined,
        });
      }
    } catch {
      failed += 1;
    }
  });
  return { verdicts, costUsd: Math.round(costUsd * 100) / 100, failed };
}

/** Applies AI verdicts: irrelevant results go, intent and sentiment are replaced. */
export function applyVerdicts(mentions: Mention[], verdicts: Map<string, AiVerdict>): (Mention & { aiNote?: string })[] {
  return mentions
    .filter((m) => verdicts.get(m.url)?.relevant !== false)
    .map((m) => {
      const v = verdicts.get(m.url);
      return v ? { ...m, intent: v.intent ?? m.intent, sentiment: v.sentiment ?? m.sentiment, aiNote: v.note } : m;
    });
}

/** Communities ranked by how often they come up: threads found, replies on them, how recent. */
export function rankCommunities(mentions: Mention[]) {
  const groups = new Map<string, { community: string; sourceId: string; threads: number; comments: number; newest: string | null; avgIntent: number; examples: { title: string; url: string }[] }>();
  for (const m of mentions) {
    const name = m.community ?? m.sourceId;
    const group = groups.get(name) ?? { community: name, sourceId: m.sourceId, threads: 0, comments: 0, newest: null, avgIntent: 0, examples: [] };
    group.avgIntent = (group.avgIntent * group.threads + m.intent) / (group.threads + 1);
    group.threads += 1;
    group.comments += m.comments ?? 0;
    if (m.publishedAt && (!group.newest || m.publishedAt > group.newest)) group.newest = m.publishedAt;
    if (group.examples.length < 3) group.examples.push({ title: m.title, url: m.url });
    groups.set(name, group);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, avgIntent: Math.round(g.avgIntent) }))
    .sort((a, b) => b.threads - a.threads || b.comments - a.comments);
}
