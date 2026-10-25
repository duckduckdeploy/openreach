import { type Creator, type CreatorPost, extractEmails, extractLinks, parseCount, type Platform, postStats, relativeToDate } from "@openreach/shared";
import type { InstagramPost, InstagramSearchUser, TiktokStats, TiktokUser, TiktokVideo, YepApi, YoutubeSearchItem, YoutubeThumbnail, YoutubeVideoItem } from "@openreach/yepapi";
import { isYepApiError } from "@openreach/yepapi";
import { AppError } from "./errors";

/**
 * Creators on YouTube, TikTok and Instagram. Discovery turns a niche keyword into a ranked list of
 * accounts from search results; analysis reads one account's profile and recent posts into a full
 * Creator with averages, engagement and contacts.
 */

const best = (thumbs: YoutubeThumbnail[] | undefined) => {
  const url = thumbs?.at(-1)?.url ?? thumbs?.[0]?.url ?? null;
  return url?.startsWith("//") ? `https:${url}` : url;
};

const num = (value: unknown) => parseCount(value);

export type DiscoverOptions = { pages: number; country?: string; language?: string };
export type Discovery = { creators: Creator[]; costUsd: number; notes: string[] };

/** Search calls a discovery makes, for its price: each is $0.01. */
export const discoveryCalls = (platform: Platform, pages: number) => (platform === "instagram" ? 1 + Math.ceil((pages * 20) / 10) : pages * 2);

// ── YouTube ────────────────────────────────────────────────────────────────

const youtubeUrl = (id: string, handle?: string | null) => (handle ? `https://www.youtube.com/${handle}` : `https://www.youtube.com/channel/${id}`);

async function discoverYoutube(yep: YepApi, query: string, options: DiscoverOptions): Promise<Discovery> {
  const byId = new Map<string, Creator>();
  let costUsd = 0;
  const geo = options.country?.toUpperCase();
  const add = (item: YoutubeSearchItem, fromVideo: boolean) => {
    const id = item.channelId;
    if (!id) return;
    const creator = byId.get(id) ?? {
      platform: "youtube" as const,
      id,
      handle: item.channelHandle ?? id,
      name: item.channelTitle ?? item.title ?? null,
      url: youtubeUrl(id, item.channelHandle),
      avatar: best(fromVideo ? item.channelThumbnail : item.thumbnail),
      bio: null,
      followers: null,
      verified: Boolean(item.isVerifiedChannel || item.channelBadges?.includes("Verified")),
      matchedPosts: 0,
      matchedViews: 0,
    };
    if (fromVideo) {
      creator.matchedPosts = (creator.matchedPosts ?? 0) + 1;
      creator.matchedViews = (creator.matchedViews ?? 0) + (num(item.viewCount) ?? 0);
    } else {
      creator.followers = num(item.subscriberCount) ?? creator.followers;
      creator.bio = item.description ?? creator.bio;
      creator.avatar = best(item.thumbnail) ?? creator.avatar;
    }
    byId.set(id, creator);
  };
  for (const type of ["channel", "video"] as const) {
    let token: string | undefined;
    for (let page = 0; page < options.pages; page++) {
      const res = await yep.youtube.search({ query, type, geo, lang: options.language, token });
      costUsd += res.costUsd;
      for (const item of res.data.data ?? []) add(item, type === "video");
      token = res.data.continuation || undefined;
      if (!token) break;
    }
  }
  return { creators: [...byId.values()], costUsd, notes: [] };
}

async function resolveYoutubeId(yep: YepApi, handleOrId: string): Promise<{ id: string; costUsd: number }> {
  const clean = handleOrId.trim().replace(/^https?:\/\/(www\.)?youtube\.com\//, "").replace(/^channel\//, "").replace(/\/.*$/, "");
  if (/^UC[\w-]{22}$/.test(clean)) return { id: clean, costUsd: 0 };
  const handle = clean.startsWith("@") ? clean : `@${clean}`;
  const res = await yep.youtube.search({ query: handle, type: "channel" });
  const match = res.data.data.find((item) => item.channelHandle?.toLowerCase() === handle.toLowerCase()) ?? res.data.data[0];
  if (!match?.channelId) throw new AppError(404, "creator_not_found", `No YouTube channel found for ${handle}.`);
  return { id: match.channelId, costUsd: res.costUsd };
}

function youtubeVideos(items: YoutubeVideoItem[] | undefined): YoutubeVideoItem[] {
  // The home tab nests videos in shelves; the videos tab lists them directly.
  return (items ?? []).flatMap((item) => (item.data ? item.data : [item])).filter((item) => item.videoId);
}

async function analyseYoutube(yep: YepApi, handleOrId: string): Promise<{ creator: Creator; costUsd: number }> {
  const { id, costUsd: resolveCost } = await resolveYoutubeId(yep, handleOrId);
  const [about, videos] = await Promise.all([yep.youtube.channelAbout({ id }), yep.youtube.channelVideos({ id, sort_by: "newest" })]);
  const a = about.data;
  const meta = videos.data.meta ?? {};
  const followers = num(a.subscriberCount) ?? num(meta.subscriberCount);
  const posts: CreatorPost[] = youtubeVideos(videos.data.data).slice(0, 30).map((v) => ({
    id: v.videoId as string,
    url: `https://www.youtube.com/watch?v=${v.videoId}`,
    title: v.title ?? null,
    views: num(v.viewCount),
    likes: null,
    comments: null,
    publishedAt: v.publishedAt ?? (v.publishDate ? `${v.publishDate}T00:00:00Z` : relativeToDate(v.publishedTimeText)),
  }));
  const links = (a.links ?? []).map((link) => link.url ?? (link.link ? `https://${link.link.replace(/^https?:\/\//, "")}` : "")).filter(Boolean);
  const bio = a.description ?? meta.description ?? null;
  const handle = a.channelHandle ?? meta.channelHandle ?? id;
  return {
    creator: {
      platform: "youtube",
      id,
      handle,
      name: a.title ?? meta.title ?? null,
      url: youtubeUrl(id, handle),
      avatar: best(a.avatar ?? meta.avatar),
      bio,
      followers,
      verified: false,
      analysed: true,
      posts: num(a.videosCount) ?? num(meta.videosCount),
      country: a.country ?? null,
      category: a.keywords?.slice(0, 3).join(", ") || null,
      emails: extractEmails(bio),
      phones: [],
      links: [...new Set([...links, ...extractLinks(bio)])],
      hasBusinessEmail: a.hasEmail === true,
      recent: posts.slice(0, 12),
      ...postStats(posts, followers, "youtube"),
    },
    costUsd: resolveCost + about.costUsd + videos.costUsd,
  };
}

// ── TikTok ─────────────────────────────────────────────────────────────────

const tiktokUrl = (handle: string) => `https://www.tiktok.com/@${handle}`;
const tiktokHandle = (user: TiktokUser | undefined) => user?.uniqueId ?? user?.unique_id ?? "";

function tiktokCreator(user: TiktokUser, stats: TiktokStats | undefined): Creator | null {
  const handle = tiktokHandle(user);
  if (!handle) return null;
  return {
    platform: "tiktok",
    id: user.id ?? handle,
    handle,
    name: user.nickname ?? null,
    url: tiktokUrl(handle),
    avatar: user.avatarMedium ?? user.avatarThumb ?? user.avatar ?? null,
    bio: user.signature || null,
    followers: stats?.followerCount ?? null,
    verified: Boolean(user.verified),
  };
}

const videoStats = (v: TiktokVideo) => ({
  views: v.play_count ?? v.statistics?.play_count ?? null,
  likes: v.digg_count ?? v.statistics?.digg_count ?? null,
  comments: v.comment_count ?? v.statistics?.comment_count ?? null,
});

async function discoverTiktok(yep: YepApi, query: string, options: DiscoverOptions): Promise<Discovery> {
  const byHandle = new Map<string, Creator>();
  let costUsd = 0;
  let cursor: string | number | undefined;
  for (let page = 0; page < options.pages; page++) {
    const res = await yep.tiktok.searchUsers({ keywords: query, cursor, count: "20" });
    costUsd += res.costUsd;
    for (const entry of res.data.data?.user_list ?? []) {
      // Private accounts can't be worked with.
      if (!entry.user || entry.user.privateAccount) continue;
      const creator = tiktokCreator(entry.user, entry.stats);
      if (creator) byHandle.set(creator.handle.toLowerCase(), creator);
    }
    cursor = res.data.data?.cursor;
    if (!res.data.data?.hasMore) break;
  }
  cursor = undefined;
  for (let page = 0; page < options.pages; page++) {
    const res = await yep.tiktok.search({ keywords: query, cursor, count: "20" });
    costUsd += res.costUsd;
    for (const video of res.data.data?.videos ?? []) {
      const handle = video.author?.unique_id;
      if (!handle) continue;
      const key = handle.toLowerCase();
      const creator = byHandle.get(key) ?? {
        platform: "tiktok" as const,
        id: video.author?.id ?? handle,
        handle,
        name: video.author?.nickname ?? null,
        url: tiktokUrl(handle),
        avatar: video.author?.avatar ?? null,
        bio: null,
        followers: null,
        verified: false,
      };
      creator.matchedPosts = (creator.matchedPosts ?? 0) + 1;
      creator.matchedViews = (creator.matchedViews ?? 0) + (videoStats(video).views ?? 0);
      byHandle.set(key, creator);
    }
    cursor = res.data.data?.cursor;
    if (!res.data.data?.hasMore) break;
  }
  return { creators: [...byHandle.values()], costUsd, notes: [] };
}

async function analyseTiktok(yep: YepApi, handle: string): Promise<{ creator: Creator; costUsd: number }> {
  const clean = handle.trim().replace(/^https?:\/\/(www\.)?tiktok\.com\//, "").replace(/^@/, "").replace(/[/?].*$/, "");
  const profile = await yep.tiktok.user({ unique_id: clean });
  const user = profile.data.data?.user;
  const base = user ? tiktokCreator(user, profile.data.data?.stats) : null;
  if (!user?.id || !base) throw new AppError(404, "creator_not_found", `No TikTok account found for @${clean}.`);
  const stats = profile.data.data?.stats;
  const postsRes = await yep.tiktok.userPosts({ user_id: user.id, count: "30" });
  const posts: CreatorPost[] = (postsRes.data.data?.videos ?? []).slice(0, 30).map((v) => ({
    id: v.video_id ?? v.aweme_id ?? "",
    url: `${tiktokUrl(clean)}/video/${v.video_id ?? v.aweme_id}`,
    title: v.title ?? v.description ?? null,
    ...videoStats(v),
    publishedAt: v.create_time ? new Date(v.create_time * 1000).toISOString() : null,
  }));
  const links = [user.bioLink?.link, user.ins_id ? `https://www.instagram.com/${user.ins_id}` : null, user.youtube_channel_id ? `https://www.youtube.com/channel/${user.youtube_channel_id}` : null, user.twitter_id ? `https://x.com/i/user/${user.twitter_id}` : null].filter(
    (link): link is string => Boolean(link),
  );
  return {
    creator: {
      ...base,
      analysed: true,
      posts: stats?.videoCount ?? null,
      country: user.region ?? null,
      category: null,
      emails: extractEmails(user.signature),
      phones: [],
      links: [...new Set([...links, ...extractLinks(user.signature)])],
      recent: posts.slice(0, 12),
      ...postStats(posts, base.followers, "tiktok"),
    },
    costUsd: profile.costUsd + postsRes.costUsd,
  };
}

// ── Instagram ──────────────────────────────────────────────────────────────

const instagramUrl = (handle: string) => `https://www.instagram.com/${handle}/`;
const NOT_PROFILES = new Set(["p", "reel", "reels", "explore", "stories", "tv", "accounts", "about", "developer", "legal", "directory", "popular"]);

/** A profile handle from an instagram.com URL, if the URL is a profile. */
export function instagramHandleOf(url: string): string | null {
  const match = url.match(/instagram\.com\/([A-Za-z0-9._]{1,30})\/?(?:$|\?|#)/);
  const handle = match?.[1];
  return handle && !NOT_PROFILES.has(handle.toLowerCase()) ? handle : null;
}

async function discoverInstagram(yep: YepApi, query: string, options: DiscoverOptions): Promise<Discovery> {
  const byHandle = new Map<string, Creator>();
  const notes: string[] = [];
  let costUsd = 0;
  try {
    const res = await yep.instagram.search({ query });
    costUsd += res.costUsd;
    for (const entry of res.data.users ?? []) {
      const user = "user" in entry ? entry.user : (entry as InstagramSearchUser);
      if (!user?.username || user.is_private) continue;
      byHandle.set(user.username.toLowerCase(), {
        platform: "instagram",
        id: user.username,
        handle: user.username,
        name: user.full_name ?? null,
        url: instagramUrl(user.username),
        avatar: user.profile_pic_url ?? null,
        bio: null,
        followers: user.follower_count ?? null,
        verified: Boolean(user.is_verified),
      });
    }
  } catch (error) {
    // Instagram's own search is often unavailable upstream; Google's index of profiles stands in.
    if (!isYepApiError(error) || error.isInvalidKey || error.isInsufficientBalance || error.isAccountFrozen) throw error;
    notes.push("Instagram search was unavailable, so profiles come from Google's index of Instagram.");
  }
  // Google finds profiles Instagram's search misses. A profile result carries followers in its
  // snippet ("12K Followers, 300 Following, 500 Posts"); a post or reel names its author in the
  // title ("Name (@handle) • Instagram photos…", "@handle on Instagram: …").
  const depth = Math.min(100, options.pages * 20);
  const serp = await yep.serp.google({ query: `${query} instagram`, depth });
  costUsd += serp.costUsd;
  for (const result of serp.data.results ?? []) {
    if (result.type !== "organic" || !/(^|\.)instagram\.com$/.test(result.domain ?? "")) continue;
    const profile = result.url ? instagramHandleOf(result.url) : null;
    const handle = profile ?? (result.title ?? "").match(/@([A-Za-z0-9._]{1,30})\b/)?.[1] ?? null;
    if (!handle || NOT_PROFILES.has(handle.toLowerCase())) continue;
    const key = handle.toLowerCase();
    const seen = byHandle.get(key);
    if (seen) {
      if (!profile) seen.matchedPosts = (seen.matchedPosts ?? 0) + 1;
      continue;
    }
    byHandle.set(key, {
      platform: "instagram",
      id: handle,
      handle,
      name: result.title?.match(/^(.*?)\s*\(@/)?.[1] ?? null,
      url: instagramUrl(handle),
      avatar: null,
      bio: profile ? result.description?.replace(/^.*?Posts\s*-\s*/i, "") || null : null,
      followers: profile ? parseCount(result.description?.match(/([\d.,]+\s*[KMB]?)\s+Followers/i)?.[1]) : null,
      verified: false,
      ...(profile ? {} : { matchedPosts: 1 }),
    });
  }
  return { creators: [...byHandle.values()], costUsd, notes };
}

const postNode = (post: InstagramPost | { node?: InstagramPost }): InstagramPost => (post as { node?: InstagramPost }).node ?? (post as InstagramPost);

async function analyseInstagram(yep: YepApi, handle: string): Promise<{ creator: Creator; costUsd: number }> {
  const clean = handle.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/^@/, "").replace(/[/?].*$/, "");
  const [profile, postsRes] = await Promise.all([yep.instagram.user({ username: clean }), yep.instagram.userPosts({ username: clean })]);
  const u = profile.data;
  if (!u.username) throw new AppError(404, "creator_not_found", `No Instagram account found for @${clean}.`);
  const followers = u.follower_count ?? null;
  const posts: CreatorPost[] = (postsRes.data.posts ?? []).map(postNode).map((p) => ({
    id: p.code ?? p.shortcode ?? p.id ?? "",
    url: `https://www.instagram.com/p/${p.code ?? p.shortcode}/`,
    title: typeof p.caption === "string" ? p.caption.slice(0, 140) : (p.caption?.text?.slice(0, 140) ?? null),
    views: p.play_count ?? p.view_count ?? p.video_view_count ?? null,
    likes: p.like_count ?? null,
    comments: p.comment_count ?? null,
    publishedAt: p.taken_at ? new Date(p.taken_at * 1000).toISOString() : null,
  }));
  const emails = [...new Set([...(u.email_from_biography ?? []), u.public_email, u.business_email, ...extractEmails(u.biography)].filter((e): e is string => Boolean(e)).map((e) => e.toLowerCase()))];
  const links = [...new Set([u.external_url, ...(u.bio_links ?? []).map((link) => link.url)].filter((l): l is string => Boolean(l)))];
  return {
    creator: {
      platform: "instagram",
      id: u.id ?? u.pk ?? clean,
      handle: u.username,
      name: u.full_name || null,
      url: instagramUrl(u.username),
      avatar: u.profile_pic_url ?? null,
      bio: u.biography || null,
      followers,
      verified: Boolean(u.is_verified),
      analysed: true,
      posts: u.media_count ?? null,
      country: u.city_name || null,
      category: u.category || null,
      emails,
      phones: [...new Set([...(u.phone_from_biography ?? []), u.public_phone_number].filter((p): p is string => Boolean(p)))],
      links,
      recent: posts.slice(0, 12),
      ...postStats(posts, followers, "instagram"),
    },
    costUsd: profile.costUsd + postsRes.costUsd,
  };
}

// ── Entry points ───────────────────────────────────────────────────────────

export async function discoverCreators(yep: YepApi, platform: Platform, query: string, options: DiscoverOptions): Promise<Discovery> {
  const found = platform === "youtube" ? await discoverYoutube(yep, query, options) : platform === "tiktok" ? await discoverTiktok(yep, query, options) : await discoverInstagram(yep, query, options);
  // Accounts that came up most (matching videos and their views) first, then by audience.
  found.creators.sort((a, b) => (b.matchedViews ?? 0) - (a.matchedViews ?? 0) || (b.matchedPosts ?? 0) - (a.matchedPosts ?? 0) || (b.followers ?? 0) - (a.followers ?? 0));
  found.costUsd = Math.round(found.costUsd * 100) / 100;
  return found;
}

/** Analysing a creator costs two calls ($0.02); a YouTube handle that has to be looked up first costs one more. */
export const ANALYSE_USD = { min: 0.02, max: 0.03 };

export function analyseCreator(yep: YepApi, platform: Platform, handle: string): Promise<{ creator: Creator; costUsd: number }> {
  if (platform === "youtube") return analyseYoutube(yep, handle);
  if (platform === "tiktok") return analyseTiktok(yep, handle);
  return analyseInstagram(yep, handle);
}

/** Instagram accounts like this one (Instagram's own suggestions). */
export async function similarInstagram(yep: YepApi, handle: string): Promise<{ creators: Creator[]; costUsd: number }> {
  const res = await yep.instagram.similar({ username: handle.replace(/^@/, "") });
  const creators: Creator[] = (res.data.similar_accounts ?? [])
    .filter((a) => !a.is_private)
    .map((a) => ({ platform: "instagram", id: a.id ?? a.username, handle: a.username, name: a.full_name ?? null, url: instagramUrl(a.username), avatar: a.profile_pic_url ?? null, bio: null, followers: null, verified: Boolean(a.is_verified) }));
  return { creators, costUsd: res.costUsd };
}
