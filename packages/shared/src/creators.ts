import type { FieldDef } from "./rules";

export const PLATFORMS = { youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram" } as const;
export type Platform = keyof typeof PLATFORMS;
export const PLATFORM_IDS = Object.keys(PLATFORMS) as Platform[];

export type CreatorPost = {
  id: string;
  url: string;
  title: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  publishedAt: string | null;
};

/**
 * A creator on any platform, in one shape. Discovery fills the first block from search results;
 * the rest is filled when the profile is analysed (profile plus recent posts).
 */
export type Creator = {
  platform: Platform;
  /** Platform ID: a YouTube channel ID, a TikTok user ID or an Instagram user ID. */
  id: string;
  handle: string;
  name: string | null;
  url: string;
  avatar: string | null;
  bio: string | null;
  followers: number | null;
  verified: boolean;
  /** How it was found: the number of matching videos, or that it matched as an account. */
  matchedPosts?: number;
  matchedViews?: number;

  analysed?: boolean;
  posts?: number | null;
  country?: string | null;
  category?: string | null;
  emails?: string[];
  phones?: string[];
  links?: string[];
  /** YouTube says a business email exists without giving it (it sits behind a CAPTCHA). */
  hasBusinessEmail?: boolean;
  avgViews?: number | null;
  avgLikes?: number | null;
  avgComments?: number | null;
  /** (likes + comments) / followers per post, as a percentage. YouTube uses views instead of followers. */
  engagementRate?: number | null;
  postsPerWeek?: number | null;
  lastPostAt?: string | null;
  recent?: CreatorPost[];
};

/** "2.57M", "14.5K subscribers", "1,275,546 views", 845389 → a number. */
export function parseCount(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const match = value.replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*([KMB])?/i);
  if (!match?.[1]) return null;
  const base = Number(match[1]);
  const unit = match[2]?.toUpperCase();
  const factor = unit === "K" ? 1e3 : unit === "M" ? 1e6 : unit === "B" ? 1e9 : 1;
  return Math.round(base * factor);
}

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}/gi;
/** Addresses that are never a creator's contact. */
const NOT_CONTACT = /(example\.com|sentry\.io|wixpress\.com|\.png$|\.jpg$|\.webp$)/i;

/** Email addresses written in a bio, with "name [at] domain [dot] com" spellings undone. */
export function extractEmails(...texts: (string | null | undefined)[]): string[] {
  const found = new Set<string>();
  for (const text of texts) {
    if (!text) continue;
    const normalised = text
      .replace(/\s*(\[|\()\s*at\s*(\]|\))\s*/gi, "@")
      .replace(/\s*(\[|\()\s*dot\s*(\]|\))\s*/gi, ".");
    for (const email of normalised.match(EMAIL) ?? []) {
      const clean = email.toLowerCase().replace(/\.+$/, "");
      if (!NOT_CONTACT.test(clean)) found.add(clean);
    }
  }
  return [...found];
}

const URL_IN_TEXT = /\bhttps?:\/\/[^\s<>"')]+|\b(?:[a-z0-9-]+\.)+(?:com|net|org|io|co|me|ee|tv|gg|app|link|bio|page)\/[^\s<>"')]*/gi;

export function extractLinks(...texts: (string | null | undefined)[]): string[] {
  const found = new Set<string>();
  for (const text of texts) for (const link of text?.match(URL_IN_TEXT) ?? []) found.add(link.replace(/[.,;:!?]+$/, ""));
  return [...found];
}

const mean = (values: (number | null | undefined)[]) => {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
};

/**
 * Averages over recent posts. Posting frequency is posts per week across the span the posts cover,
 * and needs at least two dated posts.
 */
export function postStats(posts: CreatorPost[], followers: number | null, platform: Platform) {
  const avgViews = mean(posts.map((p) => p.views));
  const avgLikes = mean(posts.map((p) => p.likes));
  const avgComments = mean(posts.map((p) => p.comments));
  let engagementRate: number | null = null;
  if (platform === "youtube") {
    // YouTube hides likes from listings; views per subscriber is the useful ratio there.
    if (avgViews != null && followers) engagementRate = (avgViews / followers) * 100;
  } else if (followers && (avgLikes != null || avgComments != null)) {
    engagementRate = (((avgLikes ?? 0) + (avgComments ?? 0)) / followers) * 100;
  }
  const dates = posts
    .map((p) => (p.publishedAt ? Date.parse(p.publishedAt) : NaN))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => b - a);
  const newest = dates[0];
  const oldest = dates.at(-1);
  const spanWeeks = newest != null && oldest != null ? (newest - oldest) / (7 * 86_400_000) : 0;
  const postsPerWeek = dates.length >= 2 && spanWeeks > 0 ? dates.length / Math.max(spanWeeks, 1) : null;
  const round = (n: number | null, digits = 0) => (n == null ? null : Math.round(n * 10 ** digits) / 10 ** digits);
  return {
    avgViews: round(avgViews),
    avgLikes: round(avgLikes),
    avgComments: round(avgComments),
    engagementRate: round(engagementRate, 2),
    postsPerWeek: round(postsPerWeek, 1),
    lastPostAt: newest != null ? new Date(newest).toISOString() : null,
  };
}

/** "2 weeks ago", "5 months ago" → an approximate ISO date, for YouTube listings that give no date. */
export function relativeToDate(text: string | null | undefined, now = Date.now()): string | null {
  const match = text?.match(/(\d+)\s*(second|minute|hour|day|week|month|year)s?\s+ago/i);
  if (!match?.[1] || !match[2]) return null;
  const unit = match[2].toLowerCase();
  const ms = { second: 1e3, minute: 6e4, hour: 3.6e6, day: 8.64e7, week: 6.048e8, month: 2.63e9, year: 3.156e10 }[unit] ?? 0;
  return new Date(now - Number(match[1]) * ms).toISOString();
}

export const daysSince = (iso: string | null | undefined, now = Date.now()) => (iso ? Math.floor((now - Date.parse(iso)) / 86_400_000) : null);

export const CREATOR_FIELDS: FieldDef<Creator>[] = [
  { key: "followers", label: "Followers", type: "number", get: (c) => c.followers },
  { key: "avgViews", label: "Average views", type: "number", get: (c) => c.avgViews },
  { key: "engagementRate", label: "Engagement %", type: "number", get: (c) => c.engagementRate },
  { key: "postsPerWeek", label: "Posts per week", type: "number", get: (c) => c.postsPerWeek },
  { key: "daysSinceLastPost", label: "Days since last post", type: "number", get: (c) => daysSince(c.lastPostAt) },
  { key: "hasEmail", label: "Has an email", type: "boolean", get: (c) => Boolean(c.emails?.length || c.hasBusinessEmail) },
  { key: "verified", label: "Verified", type: "boolean", get: (c) => c.verified },
  { key: "country", label: "Country", type: "text", get: (c) => c.country },
  { key: "bio", label: "Bio", type: "text", get: (c) => c.bio },
  { key: "name", label: "Name", type: "text", get: (c) => c.name ?? c.handle },
  { key: "category", label: "Category", type: "text", get: (c) => c.category },
];

/** Follower tiers as the influencer-marketing trade names them. */
export function creatorTier(followers: number | null | undefined): string | null {
  if (followers == null) return null;
  if (followers < 10_000) return "Nano";
  if (followers < 100_000) return "Micro";
  if (followers < 500_000) return "Mid-tier";
  if (followers < 1_000_000) return "Macro";
  return "Mega";
}
