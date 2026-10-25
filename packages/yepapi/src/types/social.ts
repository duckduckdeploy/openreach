/**
 * YouTube, TikTok and Instagram. These endpoints pass the upstream platform's own shape through,
 * which often differs from the docs (checked live 2026-10-25): TikTok wraps everything in
 * `data.data` with camelCase stats; Instagram returns the full web profile. Only the fields
 * OpenReach reads are typed, and all of them are optional.
 */

export interface YoutubeThumbnail {
  url: string;
  width?: number;
  height?: number;
}

// ── YouTube ────────────────────────────────────────────────────────────────

export interface YoutubeSearchParams {
  query: string;
  /** `video`, `channel` or `playlist`. Default: all. */
  type?: 'video' | 'channel' | 'playlist';
  /** Default: relevance. */
  sort?: 'upload_date' | 'view_count' | 'rating';
  duration?: string;
  upload_date?: string;
  features?: string;
  /** Country, e.g. `US`. */
  geo?: string;
  lang?: string;
  /** `continuation` from the previous page. */
  token?: string;
}

export interface YoutubeSearchItem {
  type: 'video' | 'channel' | 'playlist' | string;
  videoId?: string;
  title?: string;
  channelId?: string;
  channelTitle?: string;
  channelHandle?: string;
  channelBadges?: string[];
  isVerifiedChannel?: boolean;
  description?: string;
  /** Video results: a numeric string. */
  viewCount?: string | number;
  publishDate?: string;
  publishedAt?: string;
  publishedTimeText?: string;
  lengthText?: string;
  /** Channel results: formatted, e.g. `2.57M`. */
  subscriberCount?: string | number;
  videoCount?: string | number | null;
  thumbnail?: YoutubeThumbnail[];
  channelThumbnail?: YoutubeThumbnail[];
  [key: string]: unknown;
}

export interface YoutubeSearchData {
  estimatedResults?: string;
  continuation?: string;
  data: YoutubeSearchItem[];
}

export interface YoutubeChannelParams {
  /** Channel ID, `UC…`. */
  id: string;
  geo?: string;
  lang?: string;
}

export interface YoutubeChannelMeta {
  title?: string;
  channelId?: string;
  channelHandle?: string;
  description?: string;
  subscriberCount?: number;
  subscriberCountText?: string;
  videosCount?: number | string;
  isFamilySafe?: boolean;
  keywords?: string[];
  avatar?: YoutubeThumbnail[];
  [key: string]: unknown;
}

export interface YoutubeVideoItem {
  type?: string;
  videoId?: string;
  title?: string;
  description?: string;
  viewCount?: number | string;
  viewCountText?: string;
  publishDate?: string;
  publishedAt?: string;
  publishedTimeText?: string;
  lengthText?: string;
  thumbnail?: YoutubeThumbnail[];
  /** Shelves on the channel home tab hold their own list. */
  data?: YoutubeVideoItem[];
  [key: string]: unknown;
}

export interface YoutubeChannelData {
  meta?: YoutubeChannelMeta;
  data?: YoutubeVideoItem[];
  continuation?: string;
}

export interface YoutubeChannelAboutData {
  title?: string;
  channelId?: string;
  channelHandle?: string;
  description?: string;
  country?: string;
  /** Live: a number; the docs show `"24.5M"`. */
  subscriberCount?: number | string;
  subscriberCountText?: string;
  viewCount?: number | string;
  videosCount?: number | string;
  joinedDate?: string;
  /** The channel lists a business email (YouTube shows it only after a CAPTCHA, so the address itself is never returned). */
  hasEmail?: boolean;
  keywords?: string[];
  /** Live: `{ title, link }` with the URL in `link`, no scheme; the docs show `url`. */
  links?: { title?: string; link?: string; url?: string }[];
  avatar?: YoutubeThumbnail[];
  [key: string]: unknown;
}

export interface YoutubeChannelVideosParams extends YoutubeChannelParams {
  /** Default `newest`. */
  sort_by?: 'newest' | 'popular' | 'oldest';
  token?: string;
}

// ── TikTok ─────────────────────────────────────────────────────────────────

export interface TiktokUser {
  id?: string;
  uniqueId?: string;
  unique_id?: string;
  nickname?: string;
  signature?: string;
  verified?: boolean;
  privateAccount?: boolean;
  region?: string;
  language?: string;
  avatarThumb?: string;
  avatarMedium?: string;
  avatar?: string;
  secUid?: string;
  ins_id?: string;
  twitter_id?: string;
  youtube_channel_id?: string | null;
  youtube_channel_title?: string | null;
  bioLink?: { link?: string };
  createTime?: number;
  [key: string]: unknown;
}

export interface TiktokStats {
  followerCount?: number;
  followingCount?: number;
  heartCount?: number;
  heart?: number;
  videoCount?: number;
  diggCount?: number;
}

/** Live shape: the upstream response wrapped once more, `{ code, msg, data }`. */
export interface TiktokEnvelope<T> {
  code?: number;
  msg?: string;
  data?: T;
}

export interface TiktokSearchParams {
  keywords: string;
  cursor?: string | number;
  /** Passed as a string, e.g. `"20"`. */
  count?: string;
}

export interface TiktokVideo {
  video_id?: string;
  aweme_id?: string;
  title?: string;
  description?: string;
  create_time?: number;
  region?: string;
  duration?: number;
  play_count?: number;
  digg_count?: number;
  comment_count?: number;
  share_count?: number;
  collect_count?: number;
  cover?: string;
  author?: { id?: string; unique_id?: string; nickname?: string; avatar?: string };
  /** The documented shape nests the counts. */
  statistics?: { play_count?: number; digg_count?: number; comment_count?: number; share_count?: number };
  [key: string]: unknown;
}

export type TiktokSearchData = TiktokEnvelope<{ videos?: TiktokVideo[]; cursor?: number | string; hasMore?: boolean }>;

export type TiktokSearchUsersData = TiktokEnvelope<{
  user_list?: { user?: TiktokUser; stats?: TiktokStats }[];
  cursor?: number | string;
  hasMore?: boolean;
}>;

export interface TiktokUserParams {
  /** Handle without @. */
  unique_id: string;
}

export type TiktokUserData = TiktokEnvelope<{ user?: TiktokUser; stats?: TiktokStats }>;

export interface TiktokUserPostsParams {
  /** Numeric user ID from `/v1/tiktok/user`. */
  user_id: string;
  cursor?: string | number;
  count?: string;
}

export type TiktokUserPostsData = TiktokEnvelope<{ videos?: TiktokVideo[]; cursor?: number | string; hasMore?: boolean }>;

// ── Instagram ──────────────────────────────────────────────────────────────

export interface InstagramSearchParams {
  query: string;
}

export interface InstagramSearchUser {
  username: string;
  full_name?: string;
  profile_pic_url?: string;
  is_verified?: boolean;
  is_private?: boolean;
  follower_count?: number;
}

export interface InstagramSearchData {
  /** Live (2026-10-25): `{ position, user }` entries, without follower counts; the docs show flat users. */
  users?: (InstagramSearchUser | { position?: number; user?: InstagramSearchUser })[];
  hashtags?: { name: string; media_count?: number }[];
  places?: { title?: string; location?: { lat?: number; lng?: number } }[];
}

export interface InstagramUserParams {
  username: string;
}

export interface InstagramUserData {
  id?: string;
  pk?: string;
  username?: string;
  full_name?: string;
  biography?: string;
  profile_pic_url?: string;
  follower_count?: number;
  following_count?: number;
  media_count?: number;
  is_verified?: boolean;
  is_private?: boolean;
  is_business?: boolean;
  is_business_account?: boolean;
  category?: string;
  city_name?: string;
  external_url?: string;
  bio_links?: { url?: string; title?: string }[];
  email_from_biography?: string[];
  phone_from_biography?: string[];
  public_email?: string;
  business_email?: string;
  public_phone_number?: string;
  [key: string]: unknown;
}

export interface InstagramUserPostsParams {
  username: string;
  end_cursor?: string;
}

export interface InstagramPost {
  id?: string;
  code?: string;
  shortcode?: string;
  like_count?: number;
  comment_count?: number;
  play_count?: number | null;
  view_count?: number | null;
  video_view_count?: number | null;
  taken_at?: number;
  media_type?: number;
  product_type?: string;
  is_video?: boolean;
  caption?: { text?: string } | string | null;
  [key: string]: unknown;
}

/** Live: `{ posts: [{ node }], pagination_token }`; the docs show flat posts and `end_cursor`. */
export interface InstagramUserPostsData {
  posts?: (InstagramPost | { node?: InstagramPost })[];
  pagination_token?: string;
  end_cursor?: string;
  has_next_page?: boolean;
}

export interface InstagramSimilarData {
  similar_accounts?: { id?: string; username: string; full_name?: string; is_verified?: boolean; is_private?: boolean; profile_pic_url?: string }[];
}

export interface InstagramHashtagParams {
  hashtag: string;
}

export interface InstagramHashtagData {
  name?: string;
  media_count?: number;
  top_posts?: InstagramPost[];
  recent_posts?: InstagramPost[];
}

// ── Email ──────────────────────────────────────────────────────────────────

export interface EmailDomainSearchParams {
  /** Required unless `company` is given. */
  domain?: string;
  company?: string;
  /** Max 50. Default 10. */
  limit?: number;
  page?: number;
  department?: string;
  country?: string;
}

export interface EmailContact {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  position?: string | null;
  department?: string | null;
  seniority?: string | null;
  confidenceScore?: number;
  linkedin?: string | null;
  twitter?: string | null;
  phone?: string | null;
  [key: string]: unknown;
}

export interface EmailDomainSearchData {
  company?: {
    name?: string;
    domain?: string;
    description?: string;
    industry?: string;
    size?: string;
    emailPattern?: string;
    social?: Record<string, string | null>;
    [key: string]: unknown;
  };
  emails?: EmailContact[];
  [key: string]: unknown;
}
