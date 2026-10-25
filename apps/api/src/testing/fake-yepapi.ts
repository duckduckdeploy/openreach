/**
 * Development and test stand-in for YepAPI, and for the free community APIs (Hacker News, GitHub,
 * Stack Exchange, Reddit) under /hn, /github, /stackexchange and /reddit. Returns made-up data in
 * the response shapes the real services return (the social endpoints as seen live, 2026-10-25), so
 * the app can be run and tested without keys or credits.
 *
 * Any YepAPI key starting with "yep_sk_" is accepted. Nothing here reflects real data.
 * Tests can read `requests` and queue `failures` to simulate provider errors.
 */
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { siteOf, SOURCES, wordOf } from "@openreach/shared";

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const SUBREDDITS = ["SaaS", "smallbusiness", "Entrepreneur", "startups", "marketing"];
const HANDLES = ["brewlab", "espressoemma", "coffeewithkai", "baristabob", "morningpour", "crema.club", "beanthere", "steamwand"];

/** The site a plain query points at by its last words ("crm reddit", "acme stack overflow"), as the engine writes them. */
function siteFromWords(query: string): { site: string; words: string } | null {
  const lower = query.toLowerCase();
  const source = [...SOURCES].sort((a, b) => wordOf(b).length - wordOf(a).length).find((s) => lower.endsWith(` ${wordOf(s)}`));
  return source ? { site: siteOf(source), words: query.slice(0, -wordOf(source).length - 1).trim() } : null;
}

/**
 * Google results. A query aimed at a site (`site:` or the plain "… reddit" form) answers with pages
 * on that site, plus one stray page elsewhere, as Google sometimes gives. A plain query containing
 * "plainmiss" finds nothing on the site, so the engine's site: fallback runs.
 */
function serp(body: any) {
  const raw = String(body.query ?? "").replace(/\s(after:\S+|-\S+)/g, "");
  const operator = raw.match(/site:(\S+)/)?.[1];
  const plain = operator ? null : siteFromWords(raw);
  const site = operator ?? (plain && !raw.includes("plainmiss") ? plain.site : undefined);
  const words = (plain?.words ?? raw.replace(/site:\S+/g, "")).trim();
  const query = String(body.query ?? "");
  const depth = Math.min(100, body.depth ?? 10);
  const h = hash(query);
  const results: any[] = [];
  for (let i = 1; i <= depth; i++) {
    let url: string;
    let title = `${words} — thread ${i}`;
    let description = `Someone asking about ${words}. Any recommendations?`;
    let websiteName = site ?? "Example";
    let breadcrumb = `${(h + i) % 90}+ comments · ${(i % 11) + 1} months ago`;
    if (!site) url = `https://example.com/${slug(words)}-${i}`;
    else if (site.startsWith("reddit.com")) {
      const sub = SUBREDDITS[(h + i) % SUBREDDITS.length];
      url = `https://www.reddit.com/r/${sub}/comments/${(h + i).toString(36)}/${slug(words)}_${i}/`;
      websiteName = `Reddit · r/${sub}`;
    } else if (site.startsWith("instagram.com")) {
      const handle = `${HANDLES[(h + i) % HANDLES.length]}${i > HANDLES.length ? i : ""}`;
      breadcrumb = "";
      if (i % 3 === 0) {
        // A post: the author is named in the title only.
        url = `https://www.instagram.com/p/C${i}xyz/`;
        title = `@${handle} on Instagram: "${words} at home"`;
        description = `${i * 12} likes, ${i} comments.`;
      } else {
        url = `https://www.instagram.com/${handle}/`;
        title = `${handle.replace(/\W/g, " ")} (@${handle}) • Instagram photos and videos`;
        description = `${((i * 7) % 90) + 1}K Followers, 300 Following, ${100 + i} Posts - ${words} every morning. Collabs: ${handle.replace(/\W/g, "")}@gmail.com`;
      }
    } else {
      url = `https://www.${site.replace(/\/.*$/, "")}/${site.includes("/") ? site.split("/").slice(1).join("/") + "/" : ""}${slug(words)}-${i}`;
    }
    results.push({ position: i, type: "organic", title, url, description, domain: new URL(url).hostname, data: { websiteName, breadcrumb } });
  }
  if (site) results.push({ position: depth + 1, type: "organic", title: `${words} review`, url: `https://softwarefinder.example/${slug(words)}`, description: "Not on the site asked for.", domain: "softwarefinder.example", data: { websiteName: "Software Finder" } });
  results.push({ position: depth + 2, type: "relatedSearches", title: "", url: "", description: "", domain: "", data: { items: [`${words} free`] } });
  return { query, totalResults: 123456, itemTypes: ["organic", "relatedSearches"], results };
}

const place = (i: number, lat = 30.2672, lng = -97.7431) => ({
  id: `place_${i}`,
  name: `${["Acme Plumbing", "Globex Pipes", "Initech Drains", "Hooli Rooter", "Umbrella Plumbing Co", "Stark Waterworks"][i % 6]}${i >= 6 ? " North" : ""}`,
  types: ["plumber", "point_of_interest", "establishment"],
  primaryType: "plumber",
  address: `${100 + i} Main St, Austin, TX`,
  // Every third place has no website, every fourth only a Facebook page.
  ...(i % 3 === 0 ? {} : { website: i % 4 === 0 ? `https://facebook.com/place${i}` : `https://www.place${i}.example/` }),
  ...(i % 5 === 0 ? {} : { phone: "(512) 555-0100" }),
  googleMapsUrl: `https://maps.google.com/?cid=${i}`,
  latitude: lat + i * 0.002,
  longitude: lng - i * 0.002,
  rating: 3.4 + (i % 16) / 10,
  userRatingCount: i % 4 === 1 ? 4 + i : 20 + i * 17,
  businessStatus: "OPERATIONAL",
  openNow: i % 2 === 0,
  hours: ["Monday: 8:00 AM – 5:00 PM"],
  topReview: { rating: 5, text: "Fast and friendly.", author: "A. Customer" },
  photos: [{ attribution: "Owner", reference: `places/place_${i}/photos/${"x".repeat(80)}`, width: 4000, height: 3000 }],
});

const youtubeChannel = (i: number, q: string) => ({
  type: "channel",
  channelId: `UC${String(i).padStart(2, "0")}${"a".repeat(20)}`,
  channelTitle: `${q} channel ${i}`,
  title: `${q} channel ${i}`,
  channelHandle: `@${slug(q)}${i}`,
  description: `Videos about ${q}.`,
  subscriberCount: `${(i * 37) % 900 + 10}K`,
  thumbnail: [{ url: `//yt3.ggpht.com/${i}`, width: 88, height: 88 }],
});

function youtubeSearch(body: any) {
  const q = String(body.query);
  if (body.type === "channel") {
    // Looking up a handle answers with that channel first.
    if (q.startsWith("@")) return { data: [{ ...youtubeChannel(1, q.slice(1)), channelHandle: q, channelId: `UC${slug(q).padEnd(22, "x").slice(0, 22)}` }], continuation: "" };
    return { estimatedResults: "1000", continuation: body.token ? "" : "next", data: Array.from({ length: 6 }, (_, i) => youtubeChannel(i + (body.token ? 6 : 0), q)) };
  }
  return {
    estimatedResults: "5000",
    continuation: "",
    data: Array.from({ length: 10 }, (_, i) => {
      const ch = youtubeChannel(i % 4, q);
      return { type: "video", videoId: `vid${i}`, title: `${q} review ${i}`, channelId: ch.channelId, channelTitle: ch.channelTitle, channelHandle: ch.channelHandle, isVerifiedChannel: i % 4 === 0, viewCount: String(10_000 * (10 - i)), publishDate: "2026-09-01", channelThumbnail: ch.thumbnail };
    }),
  };
}

const ttUser = (handle: string, i: number) => ({
  user: { id: `7${String(hash(handle)).padStart(17, "0")}`, uniqueId: handle, nickname: handle.replace(/\W/g, " "), signature: `Coffee tips daily ☕ business: ${handle.replace(/\W/g, "")}@mail.example`, verified: i % 3 === 0, privateAccount: i === 5, region: "US", avatarMedium: `https://p16.example/${i}.jpeg`, ins_id: i % 2 ? handle : "", youtube_channel_id: "" },
  stats: { followerCount: 1000 * (i + 1) ** 2, followingCount: 100, heartCount: 50_000 * (i + 1), videoCount: 80 + i },
});

const DAY = 86_400;
const now = () => Math.floor(Date.now() / 1000);

export function handle(path: string, body: any): unknown {
  switch (path) {
    case "/v1/serp/google":
      return serp(body);
    case "/v1/maps/search": {
      const bias = body.location_bias;
      const shift = bias ? Math.abs(Math.round((bias.latitude * 1000 + bias.longitude * 1000) % 6)) : 0;
      const page = body.page_token ? Number(body.page_token) : 0;
      const results = Array.from({ length: Math.min(body.limit ?? 10, 12) }, (_, i) => place(((i + shift) % 12) + page * 12, bias?.latitude, bias?.longitude));
      return { query: body.query, totalResults: results.length, results, ...(page < 1 ? { nextPageToken: String(page + 1) } : {}) };
    }
    case "/v1/scrape":
      return { url: body.url, statusCode: 200, title: "Home", markdown: `# Welcome\nCall us or write to [hello@${new URL(body.url).hostname.replace(/^www\./, "")}](mailto:hello@${new URL(body.url).hostname.replace(/^www\./, "")}). Owner: joe.plumber@gmail.com` };
    case "/v1/email/domain-search":
      return { company: { name: body.domain, domain: body.domain }, emails: [{ email: `jane@${body.domain}`, fullName: "Jane Doe", position: "Owner", confidenceScore: 92 }, { email: `info@${body.domain}`, confidenceScore: 30 }] };

    case "/v1/youtube/search":
      return youtubeSearch(body);
    case "/v1/youtube/channel-about":
      return { title: "Brew Lab", channelId: body.id, channelHandle: "@brewlab", description: "Coffee experiments. For business: brewlab@studio.example", country: "United Kingdom", subscriberCount: 250000, videosCount: "412", hasEmail: true, keywords: ["coffee", "espresso"], links: [{ title: "Shop", link: "brewlab.example" }] };
    case "/v1/youtube/channel-videos":
      return { meta: { channelId: body.id, title: "Brew Lab", subscriberCount: 250000 }, data: Array.from({ length: 10 }, (_, i) => ({ type: "video", videoId: `v${i}`, title: `Video ${i}`, viewCount: 50_000 - i * 1000, publishedAt: new Date((now() - i * 7 * DAY) * 1000).toISOString() })), continuation: "" };

    case "/v1/tiktok/search-user":
      return { code: 0, msg: "success", data: { cursor: 10, hasMore: false, user_list: ["brewlab", "espressoemma", "coffeewithkai", "baristabob", "morningpour", "privatebean"].map((h, i) => ttUser(h, i)) } };
    case "/v1/tiktok/search":
      return { code: 0, msg: "success", data: { cursor: 10, hasMore: false, videos: Array.from({ length: 8 }, (_, i) => ({ video_id: `73${i}`, title: `${body.keywords} #${i}`, create_time: now() - i * DAY, play_count: 100_000 - i * 9000, digg_count: 5000, comment_count: 100, share_count: 40, author: { id: `8${i}`, unique_id: i < 3 ? "brewlab" : `newcreator${i}`, nickname: `Creator ${i}` } })) } };
    case "/v1/tiktok/user":
      return { code: 0, msg: "success", data: ttUser(body.unique_id, 1) };
    case "/v1/tiktok/user-posts":
      return { code: 0, msg: "success", data: { hasMore: false, videos: Array.from({ length: 10 }, (_, i) => ({ video_id: `9${i}`, title: `Post ${i}`, create_time: now() - i * 2 * DAY, play_count: 20_000, digg_count: 900, comment_count: 100 })) } };

    case "/v1/instagram/search":
      return { users: [{ position: 0, user: { username: "brewlab", full_name: "Brew Lab", is_verified: true, is_private: false } }, { position: 1, user: { username: "hiddenbeans", is_private: true } }], hashtags: [], places: [] };
    case "/v1/instagram/user":
      return { id: "971700", username: body.username, full_name: "Brew Lab", biography: "Coffee every day. ✉️ collabs@brewlab.example", follower_count: 100_000, following_count: 300, media_count: 800, is_verified: true, is_private: false, category: "Creator", city_name: "London", external_url: "https://linktr.ee/brewlab", bio_links: [{ url: "https://linktr.ee/brewlab" }], email_from_biography: ["collabs@brewlab.example"], phone_from_biography: [] };
    case "/v1/instagram/user-posts":
      return { pagination_token: "x", posts: Array.from({ length: 12 }, (_, i) => ({ node: { code: `C${i}`, like_count: 3000, comment_count: 200, taken_at: now() - i * 3 * DAY, caption: { text: `Post ${i}` }, media_type: 1 } })) };
    case "/v1/instagram/user-similar":
      return { similar_accounts: [{ id: "1", username: "lattelove", full_name: "Latte Love", is_verified: false, is_private: false }, { id: "2", username: "closedcafe", is_private: true }] };

    case "/v1/ai/chat": {
      const prompt = String(body.messages?.at(-1)?.content ?? "");
      // Scoring requests: every item relevant except ones whose title says "unrelated".
      const list = prompt.slice(prompt.lastIndexOf("\n\n") + 2);
      let items: { i: number; title: string }[] = [];
      try {
        items = JSON.parse(list);
      } catch {
        items = [];
      }
      const verdicts = items.map((item) => ({ i: item.i, relevant: !/unrelated/i.test(item.title), intent: /\?|recommend|looking/i.test(item.title) ? 85 : 30, sentiment: "neutral", note: "Asks for a tool." }));
      return { model: body.model, message: { role: "assistant", content: JSON.stringify({ items: verdicts }) }, usage: { promptTokens: 300, completionTokens: 120, totalTokens: 420 }, costUsd: 0.01 };
    }
    default:
      return null;
  }
}

/** The community APIs, answered by path. Null for anything not faked. */
function community(path: string, params: URLSearchParams, method: string): unknown {
  const q = params.get("q") ?? params.get("query") ?? "";
  if (path === "/hn/api/v1/search_by_date") {
    return { hits: [0, 1, 2].map((i) => ({ objectID: String(4000 + i), title: i === 2 ? null : `Ask HN: ${q} recommendations?`, story_title: i === 2 ? `Show HN: ${q}` : null, comment_text: i === 2 ? `We use ${q} and love it` : null, author: `hn${i}`, created_at: new Date(Date.now() - i * 86_400_000).toISOString(), num_comments: 12, points: 30, _tags: [i === 2 ? "comment" : "story"] })) };
  }
  if (path === "/github/search/issues") {
    const words = q.replace(/in:\S+|created:\S+/g, "").trim();
    return { items: [{ html_url: `https://github.com/acme/app/issues/1`, title: `Support ${words}`, body: `Is there an alternative to ${words}?`, user: { login: "dev1" }, created_at: new Date().toISOString(), comments: 4, reactions: { total_count: 2 }, repository_url: "https://api.github.com/repos/acme/app" }] };
  }
  if (path === "/stackexchange/2.3/search/excerpts") {
    return { items: [{ question_id: 77, item_type: "question", title: `How do I use ${q} with Node?`, excerpt: `I tried <span class="highlight">${q}</span> &amp; it fails`, creation_date: now() - DAY, answer_count: 2, score: 5, tags: ["node", "api"] }] };
  }
  if (path === "/reddit/api/v1/access_token" && method === "POST") return { access_token: "fake-reddit-token", expires_in: 3600 };
  if (path === "/reddit/search") {
    return { data: { children: [0, 1, 2].map((i) => ({ data: { permalink: `/r/${SUBREDDITS[i]}/comments/abc${i}/${slug(q)}/`, title: `What ${q} do you use?`, selftext: "Looking for recommendations", author: `user${i}`, created_utc: now() - i * DAY, num_comments: 20 + i, score: 10, subreddit_name_prefixed: `r/${SUBREDDITS[i]}`, over_18: false } })) } };
  }
  return null;
}

export type FakeYepApi = {
  server: Server;
  url: string;
  /** Every request, in order (community API requests with their path and query). */
  requests: { path: string; body: any }[];
  /** Per-path queue of error replies; each entry answers one request, then is removed. */
  failures: Map<string, { status: number; code: string; message?: string }[]>;
  close(): Promise<void>;
};

export async function startFakeYepApi(port = 0): Promise<FakeYepApi> {
  const requests: FakeYepApi["requests"] = [];
  const failures: FakeYepApi["failures"] = new Map();
  const server = createServer((req, res) => {
    const send = (status: number, payload: unknown) => {
      res.writeHead(status, { "content-type": "application/json", "x-request-id": "fake" });
      res.end(JSON.stringify(payload));
    };
    const url = new URL(req.url ?? "/", "http://fake");
    const path = url.pathname;
    if (/^\/(hn|github|stackexchange|reddit)\//.test(path)) {
      requests.push({ path, body: Object.fromEntries(url.searchParams) });
      const failure = failures.get(path)?.shift();
      if (failure) return send(failure.status, { message: failure.message ?? failure.code });
      const data = community(path, url.searchParams, req.method ?? "GET");
      return data === null ? send(404, { message: "not faked" }) : send(200, data);
    }
    const key = req.headers["x-api-key"];
    if (typeof key !== "string" || !key.startsWith("yep_sk_")) return send(401, { ok: false, error: { code: "INVALID_API_KEY", message: "Invalid API key" } });
    // Free GET endpoints. Failures can be queued for them too.
    const gets: Record<string, unknown> = {
      "/v1/account/balance": { balanceCents: 500, balanceUsd: 5, autoTopup: false },
      "/v1/ai/models": { models: [{ id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "google" }] },
    };
    if (req.method === "GET" && path in gets) {
      requests.push({ path, body: null });
      const failure = failures.get(path)?.shift();
      if (failure) return send(failure.status, { ok: false, error: { code: failure.code, message: failure.message ?? failure.code } });
      return send(200, { ok: true, data: gets[path] });
    }
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      let body: any = {};
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch {
        return send(400, { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid JSON" } });
      }
      requests.push({ path, body });
      const failure = failures.get(path)?.shift();
      if (failure) return send(failure.status, { ok: false, error: { code: failure.code, message: failure.message ?? failure.code } });
      if (path === "/v1/serp/google" && !body.query) return send(400, { ok: false, error: { code: "VALIDATION_ERROR", message: "query is required" } });
      try {
        const data = handle(path, body);
        if (data === null) return send(404, { ok: false, error: { code: "NOT_FOUND", message: `No fake for ${path}` } });
        send(200, { ok: true, data });
      } catch (error) {
        send(400, { ok: false, error: { code: "VALIDATION_ERROR", message: (error as Error).message } });
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));
  const { port: bound } = server.address() as AddressInfo;
  return {
    server,
    url: `http://127.0.0.1:${bound}`,
    requests,
    failures,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}
