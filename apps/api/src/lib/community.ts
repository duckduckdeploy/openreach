import type { SourceApi } from "@openreach/shared";
import { env } from "../env";

/**
 * Free, official community APIs, called from this server: Hacker News (Algolia), GitHub search,
 * Stack Exchange, and Reddit when the operator has registered an app. Each request says who we are
 * in its User-Agent and stays within the API's published limits; a refusal (403, 429) is reported
 * as a warning, never retried around.
 */

export type CommunityHit = {
  url: string;
  title: string;
  snippet: string;
  author: string | null;
  publishedAt: string | null;
  comments: number | null;
  score: number | null;
  community: string | null;
};

const USER_AGENT = "OpenReach/0.1 (+https://github.com/duckduckdeploy/openreach)";
const TIMEOUT_MS = 15_000;

export class CommunityApiError extends Error {
  constructor(
    readonly api: SourceApi,
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** In tests and development every API is served by one stand-in, under a path prefix per API. */
const base = (api: SourceApi, real: string) => (env.COMMUNITY_API_BASE_URL ? `${env.COMMUNITY_API_BASE_URL}/${api}` : real);

async function getJson<T>(api: SourceApi, url: string, headers: Record<string, string> = {}, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers: { "user-agent": USER_AGENT, accept: "application/json", ...headers }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    throw new CommunityApiError(api, 0, `${API_NAMES[api]} could not be reached: ${(error as Error).message}`);
  }
  if (!response.ok) {
    const why = response.status === 429 || response.status === 403 ? "is rate limiting this server" : `answered ${response.status}`;
    throw new CommunityApiError(api, response.status, `${API_NAMES[api]} ${why}`);
  }
  return (await response.json()) as T;
}

export const API_NAMES: Record<SourceApi, string> = { hn: "Hacker News", github: "GitHub", stackexchange: "Stack Exchange", reddit: "Reddit" };

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", "#x27": "'", "#x2F": "/", nbsp: " " };
/** Plain text from the small HTML fragments these APIs return. */
export function plain(html: string | null | undefined, max = 400): string {
  if (!html) return "";
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#?\w+);/g, (match, name: string) => ENTITIES[name] ?? (name.startsWith("#") ? String.fromCharCode(Number(name.slice(1))) || match : match))
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const seconds = (date: Date) => Math.floor(date.getTime() / 1000);

// ── Hacker News (Algolia) ────────────────────────────────────────────────────

type HnHit = {
  objectID: string;
  title?: string | null;
  story_title?: string | null;
  url?: string | null;
  comment_text?: string | null;
  story_text?: string | null;
  author?: string;
  created_at?: string;
  num_comments?: number | null;
  points?: number | null;
  story_id?: number | null;
  _tags?: string[];
};

export async function searchHackerNews(query: string, options: { since?: Date; limit?: number } = {}): Promise<CommunityHit[]> {
  // No typo tolerance: by default Algolia matches "posthog" to "Postgres".
  const params = new URLSearchParams({ query, tags: "(story,comment)", hitsPerPage: String(options.limit ?? 30), typoTolerance: "false" });
  if (options.since) params.set("numericFilters", `created_at_i>${seconds(options.since)}`);
  const data = await getJson<{ hits: HnHit[] }>("hn", `${base("hn", "https://hn.algolia.com")}/api/v1/search_by_date?${params}`);
  return data.hits.map((hit) => {
    const isComment = hit._tags?.includes("comment");
    return {
      url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
      title: (isComment ? `Comment on: ${hit.story_title ?? "a story"}` : hit.title) ?? "Hacker News",
      snippet: plain(hit.comment_text ?? hit.story_text ?? hit.url ?? ""),
      author: hit.author ?? null,
      publishedAt: hit.created_at ?? null,
      comments: isComment ? null : (hit.num_comments ?? null),
      score: hit.points ?? null,
      community: "Hacker News",
    };
  });
}

// ── GitHub issues and discussions ───────────────────────────────────────────

type GithubIssue = {
  html_url: string;
  title: string;
  body?: string | null;
  user?: { login?: string } | null;
  created_at?: string;
  comments?: number;
  reactions?: { total_count?: number };
  repository_url?: string;
};

export async function searchGithub(query: string, options: { since?: Date; limit?: number } = {}): Promise<CommunityHit[]> {
  const q = [query, "in:title,body"];
  if (options.since) q.push(`created:>=${options.since.toISOString().slice(0, 10)}`);
  const params = new URLSearchParams({ q: q.join(" "), sort: "created", order: "desc", per_page: String(options.limit ?? 30) });
  const headers: Record<string, string> = { accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" };
  if (env.GITHUB_TOKEN) headers.authorization = `Bearer ${env.GITHUB_TOKEN}`;
  const data = await getJson<{ items: GithubIssue[] }>("github", `${base("github", "https://api.github.com")}/search/issues?${params}`, headers);
  return data.items.map((item) => ({
    url: item.html_url,
    title: item.title,
    snippet: plain(item.body),
    author: item.user?.login ?? null,
    publishedAt: item.created_at ?? null,
    comments: item.comments ?? null,
    score: item.reactions?.total_count ?? null,
    community: item.repository_url?.replace(/^.*\/repos\//, "") ?? "GitHub",
  }));
}

// ── Stack Exchange ──────────────────────────────────────────────────────────

type StackItem = {
  question_id?: number;
  answer_id?: number;
  item_type?: "question" | "answer";
  title?: string;
  excerpt?: string;
  body?: string;
  creation_date?: number;
  answer_count?: number;
  score?: number;
  tags?: string[];
};

export async function searchStackExchange(query: string, options: { since?: Date; limit?: number; site?: string } = {}): Promise<CommunityHit[]> {
  const site = options.site ?? "stackoverflow";
  const params = new URLSearchParams({ order: "desc", sort: "creation", q: query, site, pagesize: String(options.limit ?? 30) });
  if (options.since) params.set("fromdate", String(seconds(options.since)));
  if (env.STACKEXCHANGE_KEY) params.set("key", env.STACKEXCHANGE_KEY);
  const data = await getJson<{ items: StackItem[] }>("stackexchange", `${base("stackexchange", "https://api.stackexchange.com")}/2.3/search/excerpts?${params}`);
  const host = site === "stackoverflow" ? "stackoverflow.com" : `${site}.stackexchange.com`;
  return data.items.map((item) => ({
    url: item.item_type === "answer" && item.answer_id ? `https://${host}/a/${item.answer_id}` : `https://${host}/q/${item.question_id}`,
    title: plain(item.title, 300) || "Stack Overflow question",
    snippet: plain(item.excerpt ?? item.body),
    author: null,
    publishedAt: item.creation_date ? new Date(item.creation_date * 1000).toISOString() : null,
    comments: item.answer_count ?? null,
    score: item.score ?? null,
    community: item.tags?.length ? `${site === "stackoverflow" ? "Stack Overflow" : site} · ${item.tags.slice(0, 2).join(", ")}` : "Stack Overflow",
  }));
}

// ── Reddit (official API, application-only OAuth) ───────────────────────────

export const redditConfigured = () => Boolean(env.REDDIT_CLIENT_ID && env.REDDIT_CLIENT_SECRET);

let redditToken: { value: string; expiresAt: number } | null = null;

async function redditAccessToken(): Promise<string> {
  if (redditToken && redditToken.expiresAt > Date.now() + 60_000) return redditToken.value;
  const credentials = Buffer.from(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`).toString("base64");
  const data = await getJson<{ access_token: string; expires_in: number }>(
    "reddit",
    `${base("reddit", "https://www.reddit.com")}/api/v1/access_token`,
    { authorization: `Basic ${credentials}`, "content-type": "application/x-www-form-urlencoded" },
    { method: "POST", body: "grant_type=client_credentials" },
  );
  redditToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return redditToken.value;
}

type RedditPost = {
  data: {
    permalink: string;
    title: string;
    selftext?: string;
    author?: string;
    created_utc?: number;
    num_comments?: number;
    score?: number;
    subreddit_name_prefixed?: string;
    over_18?: boolean;
  };
};

export async function searchReddit(query: string, options: { since?: Date; limit?: number; subreddit?: string } = {}): Promise<CommunityHit[]> {
  const token = await redditAccessToken();
  // Reddit's time filter is coarse; the exact cut-off is applied below.
  const days = options.since ? (Date.now() - options.since.getTime()) / 86_400_000 : Infinity;
  const t = days <= 1 ? "day" : days <= 7 ? "week" : days <= 31 ? "month" : days <= 366 ? "year" : "all";
  const params = new URLSearchParams({ q: query, sort: options.since ? "new" : "relevance", t, limit: String(options.limit ?? 50), raw_json: "1" });
  const path = options.subreddit ? `/r/${encodeURIComponent(options.subreddit)}/search?restrict_sr=1&${params}` : `/search?${params}`;
  const data = await getJson<{ data: { children: RedditPost[] } }>("reddit", `${base("reddit", "https://oauth.reddit.com")}${path}`, { authorization: `Bearer ${token}` });
  const cutoff = options.since ? seconds(options.since) : 0;
  return data.data.children
    .map((child) => child.data)
    .filter((post) => !post.over_18 && (post.created_utc ?? 0) >= cutoff)
    .map((post) => ({
      url: `https://www.reddit.com${post.permalink}`,
      title: post.title,
      snippet: plain(post.selftext),
      author: post.author ?? null,
      publishedAt: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : null,
      comments: post.num_comments ?? null,
      score: post.score ?? null,
      community: post.subreddit_name_prefixed ?? null,
    }));
}

/** The free API for a source, when this server can use it. Reddit needs the operator's app credentials. */
export function apiAvailable(api: SourceApi | undefined): api is SourceApi {
  if (!api) return false;
  return api === "reddit" ? redditConfigured() : true;
}

export function searchApi(api: SourceApi, query: string, options: { since?: Date; limit?: number }): Promise<CommunityHit[]> {
  switch (api) {
    case "hn":
      return searchHackerNews(query, options);
    case "github":
      return searchGithub(query, options);
    case "stackexchange":
      return searchStackExchange(query, options);
    case "reddit":
      return searchReddit(query, options);
  }
}
