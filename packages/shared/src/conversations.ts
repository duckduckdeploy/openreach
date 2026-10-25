/**
 * Mentions and conversations: a page in a community that names a brand, or where someone asks for
 * help with a problem. Both come from the same search engine (sources.ts) and share one shape.
 */

export type Sentiment = "positive" | "neutral" | "negative";

export type Mention = {
  url: string;
  sourceId: string;
  title: string;
  snippet: string;
  /** "r/CRMSoftware", "Stack Overflow", a GitHub repository… */
  community: string | null;
  author: string | null;
  publishedAt: string | null;
  comments: number | null;
  score: number | null;
  /** Buying or help-seeking intent, 0–100. */
  intent: number;
  sentiment: Sentiment;
  /** Why the intent score is what it is, in a few words each. */
  signals: string[];
  /** The search term or brand term that found it. */
  term?: string;
};

/** Phrasings people use when they look for a tool or ask for help. `{q}` is the problem or category. */
export const INTENT_TEMPLATES = [
  "{q}",
  "best {q}",
  "{q} recommendations",
  "looking for {q}",
  "alternative to {q}",
  "how do you {q}",
  "any tool for {q}",
] as const;

export function intentQueries(problem: string, count = 4, competitors: string[] = []): string[] {
  const q = problem.trim();
  const queries = INTENT_TEMPLATES.slice(0, Math.max(1, count)).map((template) => template.replace("{q}", q));
  for (const competitor of competitors.slice(0, 3)) queries.push(`${competitor} alternative`);
  return [...new Set(queries)];
}

const ASKING = /\b(looking for|recommend(ation)?s?|suggest(ion)?s?|any (good|tool|app|software|service)|which (tool|app|software|one)|what (tool|app|software|do you use|are you using)|alternatives? (to|for)|best \w+ for|need (a|an|help)|how (do|can|should) (i|you|we)|is there (a|an|any)|help me|advice|switch(ing)? from|replace|vs\.?|versus)\b/i;
const FRUSTRATED = /\b(frustrat\w*|annoy\w*|hate|sick of|tired of|fed up|terrible|awful|broken|doesn'?t work|too expensive|overpriced|cancel(l?ed|ling)?|churn\w*)\b/i;
const QUESTION = /\?/;
const POSITIVE = /\b(love|great|awesome|amazing|excellent|recommend|best|fantastic|helpful|game.?changer|happy with|works? (great|well))\b/i;
const NEGATIVE = /\b(hate|terrible|awful|worst|scam|broken|bug(gy)?|disappoint\w*|refund|avoid|useless|slow|expensive|overpriced|frustrat\w*|doesn'?t work|stopped working)\b/i;

export function sentimentOf(text: string): Sentiment {
  const pos = (text.match(new RegExp(POSITIVE, "gi")) ?? []).length;
  const neg = (text.match(new RegExp(NEGATIVE, "gi")) ?? []).length;
  if (neg > pos) return "negative";
  if (pos > neg) return "positive";
  return "neutral";
}

/**
 * Help-seeking intent from the words alone, before any AI pass: a question or request scores, a
 * named competitor and frustration add, and age takes away. 0–100.
 */
export function intentOf(item: { title: string; snippet: string; comments?: number | null; publishedAt?: string | null }, competitors: string[] = [], now = Date.now()) {
  const text = `${item.title} ${item.snippet}`;
  const signals: string[] = [];
  let score = 10;
  if (ASKING.test(item.title)) {
    score += 35;
    signals.push("asks for a recommendation");
  } else if (ASKING.test(item.snippet)) {
    score += 20;
    signals.push("asks for help");
  }
  if (QUESTION.test(item.title)) {
    score += 15;
    signals.push("a question");
  }
  if (FRUSTRATED.test(text)) {
    score += 15;
    signals.push("unhappy with a current tool");
  }
  const named = competitors.find((name) => name && new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text));
  if (named) {
    score += 15;
    signals.push(`names ${named}`);
  }
  if (item.comments != null && item.comments >= 10) {
    score += 5;
    signals.push(`${item.comments}+ replies`);
  }
  if (item.publishedAt) {
    const days = (now - Date.parse(item.publishedAt)) / 86_400_000;
    if (days <= 30) {
      score += 10;
      signals.push("recent");
    } else if (days > 365) {
      score -= 20;
      signals.push("over a year old");
    }
  }
  return { intent: Math.max(0, Math.min(100, Math.round(score))), signals };
}

/**
 * Google's line under a forum result, e.g. "50+ comments · 6 months ago" or "3 answers · 2 years ago":
 * the reply count and an approximate date.
 */
export function parseResultMeta(text: string | null | undefined, now = Date.now()): { comments: number | null; publishedAt: string | null } {
  if (!text) return { comments: null, publishedAt: null };
  const replies = text.match(/(\d[\d,.]*)\+?\s*(K\+?)?\s*(comments?|answers?|replies|posts?|reactions?)/i);
  let comments: number | null = null;
  if (replies?.[1]) comments = Math.round(Number(replies[1].replace(/,/g, "")) * (replies[2] ? 1000 : 1));
  const ago = text.match(/(\d+)\s*(minute|hour|day|week|month|year)s?\s+ago/i);
  let publishedAt: string | null = null;
  if (ago?.[1] && ago[2]) {
    const ms = { minute: 6e4, hour: 3.6e6, day: 8.64e7, week: 6.048e8, month: 2.63e9, year: 3.156e10 }[ago[2].toLowerCase() as "day"] ?? 0;
    publishedAt = new Date(now - Number(ago[1]) * ms).toISOString();
  } else {
    const date = text.match(/\b([A-Z][a-z]{2,8} \d{1,2}, \d{4})\b/);
    if (date?.[1] && !Number.isNaN(Date.parse(date[1]))) publishedAt = new Date(Date.parse(date[1])).toISOString();
  }
  return { comments, publishedAt };
}

/** "r/CRM" from a Reddit URL. */
export function subredditOf(url: string): string | null {
  const match = url.match(/reddit\.com\/r\/([A-Za-z0-9_]+)/i);
  return match?.[1] ? `r/${match[1]}` : null;
}

/** Google's `after:` operator for searches that should only see new pages. */
export const afterOperator = (date: Date) => `after:${date.toISOString().slice(0, 10)}`;

export const MENTION_STATUSES = ["new", "read", "replied", "ignored"] as const;
export type MentionStatus = (typeof MENTION_STATUSES)[number];
