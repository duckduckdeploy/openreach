import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  // Project data (creators, leads, monitors…) lives in its own database. Unset: the same
  // server and credentials as DATABASE_URL, database name + "_data", created if missing.
  DATA_DATABASE_URL: z.string().min(1).optional(),
  API_PORT: z.coerce.number().default(4300),
  API_URL: z.string().url().default("http://localhost:4300"),
  APP_URL: z.string().url().default("http://localhost:3300"),
  WEB_URL: z.string().url().default("http://localhost:3301"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters")
    .refine((v) => !/change-me/i.test(v), "AUTH_SECRET is still the example value. Set your own random string"),
  ENCRYPTION_KEY: z
    .string()
    .refine((v) => Buffer.from(v, "base64").length === 32, "ENCRYPTION_KEY must be 32 bytes, base64-encoded"),
  YEPAPI_BASE_URL: z.string().url().default("https://api.yepapi.com"),
  // Set to "false" to run the HTTP server without the background worker.
  RUN_WORKER: z.enum(["true", "false"]).default("true"),
  // Proxies in front of the API whose X-Forwarded-For is trusted for the client's address. 0 by
  // default: Next's /api rewrite passes on whatever X-Forwarded-For the visitor sent, so trusting
  // it would let anyone choose their own address.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  // A header your edge proxy sets to the visitor's address and visitors cannot set themselves,
  // e.g. cf-connecting-ip behind Cloudflare or x-real-ip from nginx. Sign-in rate limits use it.
  CLIENT_IP_HEADER: z.string().regex(/^[a-z0-9-]+$/i).optional(),
  // Lead searches per user: how many may run at once, and the most Maps calls one search may make.
  LEAD_SEARCH_MAX_ACTIVE_PER_USER: z.coerce.number().int().min(1).max(100).default(2),
  LEAD_SEARCH_MAX_CALLS: z.coerce.number().int().min(1).max(100_000).default(500),

  // Optional: free tools on the public website, run with the site's own YepAPI key (services/public-tools.ts).
  // Unset: off. Spending stops at the monthly budget and, each day, at the daily one; each visitor
  // gets PUBLIC_TOOLS_PER_DAY runs a day.
  PUBLIC_TOOLS_YEPAPI_KEY: z.string().min(10).optional(),
  PUBLIC_TOOLS_MONTHLY_USD: z.coerce.number().min(0).default(30),
  PUBLIC_TOOLS_DAILY_USD: z.coerce.number().min(0).default(2),
  PUBLIC_TOOLS_PER_DAY: z.coerce.number().int().min(1).max(1000).default(5),

  // Optional: community APIs searched for free from this server. Each works without a key at a
  // lower rate limit; a key raises it.
  // GitHub: a token with no scopes (fine-grained, public repositories read-only) for issue search.
  GITHUB_TOKEN: z.string().min(10).optional(),
  // Stack Exchange: an app key from stackapps.com raises the daily quota from 300 to 10,000.
  STACKEXCHANGE_KEY: z.string().min(5).optional(),
  // Reddit: a "script" or "web" app from reddit.com/prefs/apps, used with application-only OAuth.
  // Unset: Reddit is searched through Google results instead.
  REDDIT_CLIENT_ID: z.string().min(5).optional(),
  REDDIT_CLIENT_SECRET: z.string().min(5).optional(),
  // Tests and development: send every community API request to this server instead.
  COMMUNITY_API_BASE_URL: z.string().url().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`);
  console.error(`Invalid environment:\n${lines.join("\n")}\nSee .env.example.`);
  process.exit(1);
}

export const env = parsed.data;
