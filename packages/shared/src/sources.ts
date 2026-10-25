/**
 * Where OpenReach looks for brand mentions and for people asking about a problem.
 *
 * Every source is searched one of two ways:
 * - `api`: a free official API, called from the OpenReach server (Hacker News, GitHub, Stack Exchange,
 *   and Reddit when the operator has set up Reddit API credentials).
 * - otherwise a Google search through YepAPI at $0.01 per 10 results: the words plus the source's
 *   name ("crm for small business reddit"), falling back to `site:` when that finds nothing on the
 *   source. Results whose host is not one of `domains` are dropped. (Tested 2026-10-25: through
 *   YepAPI the `site:` operator was honoured only some of the time; the plain form every time.)
 *
 * OpenReach never scrapes a site that refuses it. Sites that block servers (Reddit, Quora, X…) are
 * reached through search results or their official API only.
 */

export const SOURCE_GROUPS = {
  reddit: "Reddit",
  qa: "Q&A",
  dev: "Developer communities",
  startup: "Startup and launch sites",
  reviews: "Review sites",
  social: "Social networks",
  video: "Video",
  blogs: "Blogs and newsletters",
  forums: "Forums",
  apps: "App stores and marketplaces",
} as const;

export type SourceGroup = keyof typeof SOURCE_GROUPS;

/** What a result from the source usually is. Threads and questions are where customers ask for help. */
export type SourceKind = "thread" | "question" | "post" | "review" | "video" | "article" | "repo" | "listing";

export type SourceApi = "hn" | "github" | "stackexchange" | "reddit";

export type Source = {
  id: string;
  name: string;
  group: SourceGroup;
  kind: SourceKind;
  /** Hosts a result must belong to (subdomains included). The first one is used for `site:`. */
  domains: string[];
  /** A narrower `site:` target than the first domain, e.g. "linkedin.com/posts". */
  site?: string;
  /** Words added to a Google search to point it at the source. Default: the name, lower case. */
  word?: string;
  /** Searched through a free API instead of Google. */
  api?: SourceApi;
  /** Checked by default in a new brand-mention monitor. */
  mentions: boolean;
  /** Checked by default when looking for people asking for help (customer finder). */
  conversations: boolean;
};

const s = (
  id: string,
  name: string,
  group: SourceGroup,
  kind: SourceKind,
  domains: string[],
  defaults: { mentions?: boolean; conversations?: boolean; site?: string; api?: SourceApi; word?: string } = {},
): Source => ({ id, name, group, kind, domains, mentions: defaults.mentions ?? false, conversations: defaults.conversations ?? false, site: defaults.site, api: defaults.api, word: defaults.word });

export const SOURCES: Source[] = [
  // Reddit
  s("reddit", "Reddit", "reddit", "thread", ["reddit.com"], { mentions: true, conversations: true, api: "reddit" }),

  // Q&A
  s("quora", "Quora", "qa", "question", ["quora.com"], { mentions: true, conversations: true }),
  s("stackoverflow", "Stack Overflow", "qa", "question", ["stackoverflow.com"], { mentions: true, conversations: true, api: "stackexchange" }),
  s("stackexchange", "Stack Exchange sites", "qa", "question", ["stackexchange.com", "superuser.com", "serverfault.com", "askubuntu.com"], { conversations: true }),
  s("microsoft-qa", "Microsoft Q&A and Community", "qa", "question", ["learn.microsoft.com", "answers.microsoft.com"], { site: "learn.microsoft.com/en-us/answers", word: "microsoft community" }),
  s("spiceworks", "Spiceworks Community", "qa", "thread", ["community.spiceworks.com"], { conversations: true }),

  // Developer communities
  s("hackernews", "Hacker News", "dev", "thread", ["news.ycombinator.com"], { mentions: true, conversations: true, api: "hn" }),
  s("github", "GitHub issues and discussions", "dev", "thread", ["github.com"], { mentions: true, conversations: true, api: "github", word: "github issue" }),
  s("devto", "DEV Community", "dev", "article", ["dev.to"], { mentions: true, conversations: true }),
  s("hashnode", "Hashnode", "dev", "article", ["hashnode.dev", "hashnode.com"], { mentions: true }),
  s("lobsters", "Lobsters", "dev", "thread", ["lobste.rs"], { mentions: true }),
  s("hackernoon", "HackerNoon", "dev", "article", ["hackernoon.com"]),
  s("gitlab", "GitLab", "dev", "repo", ["gitlab.com"]),
  s("freecodecamp", "freeCodeCamp Forum", "dev", "thread", ["forum.freecodecamp.org"]),
  s("slashdot", "Slashdot", "dev", "thread", ["slashdot.org"]),

  // Startup and launch sites
  s("producthunt", "Product Hunt", "startup", "listing", ["producthunt.com"], { mentions: true, conversations: true }),
  s("indiehackers", "Indie Hackers", "startup", "thread", ["indiehackers.com"], { mentions: true, conversations: true }),
  s("alternativeto", "AlternativeTo", "startup", "listing", ["alternativeto.net"], { mentions: true }),
  s("saashub", "SaaSHub", "startup", "listing", ["saashub.com"], { mentions: true }),
  s("betalist", "BetaList", "startup", "listing", ["betalist.com"]),
  s("peerlist", "Peerlist", "startup", "post", ["peerlist.io"]),
  s("uneed", "Uneed", "startup", "listing", ["uneed.best"]),
  s("microlaunch", "Microlaunch", "startup", "listing", ["microlaunch.net"]),
  s("starterstory", "Starter Story", "startup", "article", ["starterstory.com"]),
  s("ycombinator", "Y Combinator Launches", "startup", "listing", ["ycombinator.com"], { site: "ycombinator.com/launches", word: "y combinator launch" }),

  // Review sites
  s("g2", "G2", "reviews", "review", ["g2.com"], { mentions: true }),
  s("capterra", "Capterra", "reviews", "review", ["capterra.com"], { mentions: true }),
  s("trustpilot", "Trustpilot", "reviews", "review", ["trustpilot.com"], { mentions: true }),
  s("trustradius", "TrustRadius", "reviews", "review", ["trustradius.com"]),
  s("getapp", "GetApp", "reviews", "review", ["getapp.com"]),
  s("softwareadvice", "Software Advice", "reviews", "review", ["softwareadvice.com"]),
  s("gartner", "Gartner Peer Insights", "reviews", "review", ["gartner.com"], { site: "gartner.com/reviews" }),
  s("yelp", "Yelp", "reviews", "review", ["yelp.com"]),
  s("tripadvisor", "Tripadvisor", "reviews", "review", ["tripadvisor.com"]),
  s("sitejabber", "Sitejabber", "reviews", "review", ["sitejabber.com"]),

  // Social networks
  s("x", "X (Twitter)", "social", "post", ["x.com", "twitter.com"], { mentions: true, conversations: true, word: "twitter" }),
  s("linkedin", "LinkedIn posts", "social", "post", ["linkedin.com"], { mentions: true, conversations: true, site: "linkedin.com/posts" }),
  s("linkedin-articles", "LinkedIn articles", "social", "article", ["linkedin.com"], { site: "linkedin.com/pulse", word: "linkedin article" }),
  s("facebook", "Facebook groups and pages", "social", "post", ["facebook.com"], { conversations: true, word: "facebook group" }),
  s("threads", "Threads", "social", "post", ["threads.net", "threads.com"], { mentions: true }),
  s("bluesky", "Bluesky", "social", "post", ["bsky.app"], { mentions: true }),
  s("mastodon", "Mastodon", "social", "post", ["mastodon.social", "mastodon.online", "fosstodon.org", "hachyderm.io"]),
  s("tumblr", "Tumblr", "social", "post", ["tumblr.com"]),
  s("pinterest", "Pinterest", "social", "post", ["pinterest.com"]),
  s("instagram", "Instagram", "social", "post", ["instagram.com"]),

  // Video
  s("youtube", "YouTube", "video", "video", ["youtube.com"], { mentions: true }),
  s("tiktok", "TikTok", "video", "video", ["tiktok.com"], { mentions: true }),
  s("vimeo", "Vimeo", "video", "video", ["vimeo.com"]),

  // Blogs and newsletters
  s("medium", "Medium", "blogs", "article", ["medium.com"], { mentions: true }),
  s("substack", "Substack", "blogs", "article", ["substack.com"], { mentions: true }),
  s("beehiiv", "beehiiv", "blogs", "article", ["beehiiv.com"]),
  s("wordpress", "WordPress.com blogs", "blogs", "article", ["wordpress.com"], { word: "wordpress blog" }),
  s("blogger", "Blogger", "blogs", "article", ["blogspot.com"], { word: "blogspot" }),

  // Forums
  s("lemmy", "Lemmy", "forums", "thread", ["lemmy.world", "lemmy.ml", "programming.dev"], { conversations: true }),
  s("discourse-meta", "Discourse Meta", "forums", "thread", ["meta.discourse.org"], { word: "discourse" }),
  s("xda", "XDA Forums", "forums", "thread", ["xda-developers.com"], { site: "xdaforums.com", word: "xda forums" }),
  s("warriorforum", "Warrior Forum", "forums", "thread", ["warriorforum.com"]),
  s("tomshardware", "Tom's Hardware Forum", "forums", "thread", ["forums.tomshardware.com"]),
  s("shopify-community", "Shopify Community", "forums", "thread", ["community.shopify.com"]),
  s("wordpress-support", "WordPress.org support", "forums", "thread", ["wordpress.org"], { site: "wordpress.org/support" }),
  s("notion-community", "Notion community", "forums", "thread", ["notion.so"], { site: "notion.so/community" }),

  // App stores and marketplaces
  s("appstore", "Apple App Store", "apps", "listing", ["apps.apple.com"], { word: "app store" }),
  s("googleplay", "Google Play", "apps", "listing", ["play.google.com"], { word: "google play" }),
  s("chromewebstore", "Chrome Web Store", "apps", "listing", ["chromewebstore.google.com", "chrome.google.com"], { word: "chrome extension" }),
  s("shopify-apps", "Shopify App Store", "apps", "listing", ["apps.shopify.com"], { word: "shopify app" }),
  s("wordpress-plugins", "WordPress plugins", "apps", "listing", ["wordpress.org"], { site: "wordpress.org/plugins", word: "wordpress plugin" }),
  s("vscode-marketplace", "VS Code Marketplace", "apps", "listing", ["marketplace.visualstudio.com"], { word: "vs code extension" }),
  s("figma-community", "Figma Community", "apps", "listing", ["figma.com"], { site: "figma.com/community", word: "figma plugin" }),
  s("zapier-apps", "Zapier apps", "apps", "listing", ["zapier.com"], { site: "zapier.com/apps", word: "zapier integration" }),
];

export const SOURCE_IDS = SOURCES.map((source) => source.id);
export const sourceById = new Map(SOURCES.map((source) => [source.id, source]));

export const DEFAULT_MENTION_SOURCES = SOURCES.filter((source) => source.mentions).map((source) => source.id);
export const DEFAULT_CONVERSATION_SOURCES = SOURCES.filter((source) => source.conversations).map((source) => source.id);

/** Words that point a Google search at the source: "reddit", "stack overflow", "twitter". */
export const wordOf = (source: Source) => source.word ?? source.name.toLowerCase().replace(/\s*\(.*\)/, "");

/** The `site:` target Google is asked for. */
export const siteOf = (source: Source) => source.site ?? source.domains[0] ?? "";

/** True when the URL belongs to one of the source's hosts (subdomains included). */
export function belongsTo(source: Source, url: string): boolean {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return false;
  }
  return source.domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

/** The source a URL comes from, if any; the most specific `site` match wins (linkedin.com/pulse over linkedin.com/posts). */
export function sourceOfUrl(url: string, among: Source[] = SOURCES): Source | undefined {
  const matches = among.filter((source) => belongsTo(source, url));
  if (matches.length <= 1) return matches[0];
  const path = (() => {
    try {
      const u = new URL(url);
      return `${u.hostname.replace(/^www\./, "")}${u.pathname}`;
    } catch {
      return "";
    }
  })();
  return matches.find((source) => source.site && path.startsWith(source.site)) ?? matches.find((source) => !source.site) ?? matches[0];
}
