import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { MENTION_STATUSES, PIPELINE, PLATFORM_IDS, SOURCE_IDS } from "@openreach/shared";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { resolveUser } from "../lib/context";
import { leadSearchInput } from "../services/lead-search";
import { lookups } from "../services/lookups";
import { monitorInput } from "../services/monitors";
import { issuer, SCOPE } from "../services/oauth";

type Json = Record<string, unknown>;
type Shape = Record<string, z.ZodType>;
type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

const MAX_RESULT_CHARS = 120_000;

const projectId = z.string().uuid().optional().describe("Project ID from list_projects. Optional when the account has exactly one project.");
const maxCost = z
  .number()
  .positive()
  .describe("Spending ceiling in USD for this call, agreed with the user. The call is refused if its worst-case price is higher. Spend comes from the user's own YepAPI balance.");
const dryRun = z.boolean().optional().describe("Return the price estimate only. Spends nothing.");

const COORDINATE_KEY = /^(lat|lng|latitude|longitude)$/;
/** Provider floats come with 15 digits. Coordinates keep theirs. */
const roundNumbers = (key: string, value: unknown) =>
  typeof value === "number" && !Number.isInteger(value) && !COORDINATE_KEY.test(key) ? (Math.abs(value) >= 1000 ? Math.round(value) : Math.round(value * 100) / 100) : value;

const text = (value: unknown): ToolResult => {
  let body = typeof value === "string" ? value : JSON.stringify(value, roundNumbers, 1);
  if (body.length > MAX_RESULT_CHARS) body = `${body.slice(0, MAX_RESULT_CHARS)}\n… truncated. Ask for fewer rows (lower limit) or a narrower filter.`;
  return { content: [{ type: "text", text: body }] };
};

const rows = (value: unknown) => (Array.isArray(value) ? (value as Json[]) : []);
/** Keeps the named fields that carry a value; blank strings, empty lists and nulls are noise to an agent. */
const pick = (row: Json, keys: string[]) =>
  Object.fromEntries(keys.filter((key) => row[key] != null && row[key] !== "" && !(Array.isArray(row[key]) && (row[key] as unknown[]).length === 0)).map((key) => [key, row[key]]));

const CREATOR_KEYS = ["platform", "handle", "name", "url", "followers", "verified", "bio", "matchedPosts", "matchedViews", "posts", "country", "category", "emails", "phones", "links", "hasBusinessEmail", "avgViews", "avgLikes", "avgComments", "engagementRate", "postsPerWeek", "lastPostAt", "id"];
const LEAD_KEYS = ["placeId", "name", "category", "address", "phone", "website", "rating", "reviews", "status", "openNow", "mapsUrl", "emails"];
const MENTION_KEYS = ["url", "sourceId", "community", "title", "snippet", "author", "publishedAt", "comments", "score", "intent", "sentiment", "signals", "aiNote"];

const slimCreator = (c: Json) => ({ ...pick(c, CREATOR_KEYS), ...(Array.isArray(c.recent) ? { recent: rows(c.recent).slice(0, 5).map((p) => pick(p, ["title", "url", "views", "likes", "comments", "publishedAt"])) } : {}) });

/** Smaller shapes for lookups whose raw rows carry images, layout data and fields an agent has no use for. */
const AGENT_VIEWS: Record<string, (data: Json) => unknown> = {
  find_creators: (data) => ({ ...data, creators: rows(data.creators).map((c) => pick(c, CREATOR_KEYS)) }),
  analyse_creator: (data) => slimCreator(data),
  analyse_creators: (data) => ({ ...data, creators: rows(data.creators).map(slimCreator) }),
  similar_creators: (data) => ({ ...data, creators: rows(data.creators).map((c) => pick(c, CREATOR_KEYS)) }),
  find_leads: (data) => ({ ...data, leads: rows(data.leads).map((l) => pick(l, LEAD_KEYS)) }),
  brand_mentions: (data) => ({ ...data, mentions: rows(data.mentions).map((m) => pick(m, MENTION_KEYS)) }),
  find_conversations: (data) => ({ ...data, mentions: rows(data.mentions).map((m) => pick(m, MENTION_KEYS)) }),
  find_subreddits: (data) => ({ ...data, threads: rows(data.threads).slice(0, 30).map((m) => pick(m, ["url", "community", "title", "comments", "publishedAt", "intent"])) }),
};

/** A lookup result for an agent: what it cost first, then the data. */
function forAgent(result: unknown): unknown {
  if (!result || typeof result !== "object" || (result as Json).dryRun) return result;
  const { name, estimate, data: raw, costUsd, cached, fetchedAt, ...rest } = result as Json;
  const view = AGENT_VIEWS[name as string];
  return { name, costUsd, cached, fetchedAt, estimate, ...rest, data: view && raw && typeof raw === "object" ? view(raw as Json) : raw };
}

/** Drops fields an agent has no use for (internal user ids) from every answer. */
const withoutUserIds = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(withoutUserIds)
    : value && typeof value === "object"
      ? Object.fromEntries(Object.entries(value as Json).filter(([key]) => key !== "userId").map(([key, inner]) => [key, withoutUserIds(inner)]))
      : value;
const fail = (message: string): ToolResult => ({ content: [{ type: "text", text: message }], isError: true });

const query = (params: Record<string, unknown>) => {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== "") q.set(key, String(value));
  const s = q.toString();
  return s ? `?${s}` : "";
};

/**
 * MCP tools are thin wrappers over the REST API: each one calls a route in-process with the
 * caller's own API key, so agents and the web app share validation, pricing and limits.
 */
function buildServer(app: FastifyInstance, authorization: string): McpServer {
  const server = new McpServer(
    { name: "openreach", version: "0.1.0" },
    {
      instructions:
        "OpenReach finds customers, leads and creators for the user's products: influencers on YouTube, TikTok and Instagram, businesses on Google Maps, brand mentions and people asking for help in communities. Paid tools spend the user's own YepAPI credits: state the price before you run them, pass max_cost_usd, and prefer dry_run to check a price. Results are cached, so repeating a lookup is free until the cache expires. Never contact anyone on the user's behalf: OpenReach finds and organises, the user reaches out. Start with list_projects.",
    },
  );

  async function rest(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", url: string, body?: unknown): Promise<unknown> {
    const response = await app.inject({ method, url: `/api${url}`, headers: { authorization }, payload: body === undefined ? undefined : (body as Json) });
    const json = response.json() as { ok?: boolean; data?: unknown; error?: { message?: string } };
    if (response.statusCode >= 400 || json.ok === false) throw new Error(json.error?.message ?? `Request failed (${response.statusCode})`);
    return json.data ?? json;
  }

  async function resolveProject(id: string | undefined): Promise<string> {
    if (id) return id;
    const projects = (await rest("GET", "/projects")) as { id: string }[];
    if (projects.length === 1 && projects[0]) return projects[0].id;
    throw new Error(projects.length ? "This account has several projects. Pass project_id (see list_projects)." : "No projects yet. Create one with create_project.");
  }

  function tool<S extends Shape>(name: string, description: string, shape: S, handler: (args: z.infer<z.ZodObject<S>>) => Promise<unknown>, readOnly = false) {
    server.registerTool(name, { description, inputSchema: shape, annotations: { readOnlyHint: readOnly } }, (async (args: unknown) => {
      try {
        const value = withoutUserIds(await handler(args as z.infer<z.ZodObject<S>>));
        // A dry run says outright that it spent nothing, like a paid result says what it spent.
        const isDryRun = value !== null && typeof value === "object" && (value as Json).dryRun === true;
        return text(isDryRun ? { dryRun: true, costUsd: 0, ...(value as Json) } : value);
      } catch (error) {
        return fail(error instanceof Error ? error.message : "Tool failed");
      }
    }) as never);
  }

  // ── Account and projects ────────────────────────────────────────────────
  tool("whoami", "The signed-in user and whether a YepAPI key is connected.", {}, () => rest("GET", "/me"), true);
  tool("get_balance", "Remaining YepAPI balance for the user's key, whether auto top-up is on, and this month's paid calls, spend and monthly limit. Free.", {}, () => rest("GET", "/balance"), true);
  tool(
    "get_usage",
    "What OpenReach has spent with the user's YepAPI key this month, by feature and by day, with the 10 latest calls. Free.",
    {},
    async () => {
      const usage = (await rest("GET", "/usage")) as Json;
      return { ...usage, recent: rows(usage.recent).slice(0, 10).map((call) => pick(call, ["endpoint", "feature", "ok", "status", "costUsd", "createdAt"])) };
    },
    true,
  );
  tool("list_projects", "The user's projects: each product with its website, description, niche keywords, competitors and market.", {}, () => rest("GET", "/projects"), true);
  tool(
    "create_project",
    "Create a project for a product. Its description, keywords and competitors seed the searches. Free.",
    {
      name: z.string().min(1).max(120),
      domain: z.string().max(253).optional(),
      description: z.string().max(2000).optional().describe("What the product does and for whom, in a sentence or two"),
      keywords: z.array(z.string()).max(20).optional().describe("Niche and problem words, e.g. home espresso, crm for small business"),
      competitors: z.array(z.string()).max(20).optional(),
      country: z.string().length(2).optional().describe("ISO country code, e.g. us"),
      language: z.string().optional(),
    },
    (a) => rest("POST", "/projects", a),
  );
  tool("get_project", "A project's settings and shared context notes.", { project_id: projectId }, async (a) => rest("GET", `/projects/${await resolveProject(a.project_id)}`), true);
  tool(
    "update_project",
    "Change a project's description, keywords, competitors or context notes. For context, read it first with get_project and send back the full object with your changes. Free.",
    {
      project_id: projectId,
      description: z.string().max(2000).optional(),
      keywords: z.array(z.string()).max(20).optional(),
      competitors: z.array(z.string()).max(20).optional(),
      context: z.record(z.string(), z.unknown()).optional(),
    },
    async ({ project_id, ...body }) => rest("PATCH", `/projects/${await resolveProject(project_id)}`, body),
  );
  tool(
    "list_sources",
    "Every community OpenReach searches (Reddit, Quora, Hacker News, GitHub, Stack Overflow, X, LinkedIn, Product Hunt, review sites, app stores…) with its ID, group and whether it is searched through a free API or Google. Free.",
    {},
    async () => {
      const data = (await rest("GET", "/sources")) as Json;
      return { groups: data.groups, sources: rows(data.sources).map((s) => pick(s, ["id", "name", "group", "kind", "via", "mentions", "conversations"])) };
    },
    true,
  );
  tool("get_filter_fields", "Fields and ready-made presets for lead filter rules (filters on lead searches) and creator filters. Free.", {}, () => rest("GET", "/filter-fields"), true);

  // ── Paid lookups: creators, leads, mentions, conversations ───────────────
  for (const lookup of lookups) {
    const cache = lookup.ttl ? ` Cached ${lookup.ttl >= 86400 ? `${Math.round(lookup.ttl / 86400)} day(s)` : `${Math.round(lookup.ttl / 3600)} hour(s)`}; a cached result is free.` : "";
    tool(
      lookup.name,
      `${lookup.description}${cache} The result starts with costUsd, what this call actually spent (0 when cached).`.replace(/\s+/g, " ").trim(),
      {
        ...(lookup.input.shape as Shape),
        project_id: projectId,
        max_cost_usd: maxCost.optional(),
        dry_run: dryRun,
        refresh: z.boolean().optional().describe("Ignore the cache and pay for fresh data."),
      },
      async (a) => {
        const { project_id, max_cost_usd, dry_run, refresh, ...input } = a as Json;
        const q = query({ dryRun: dry_run ? 1 : undefined, refresh: refresh ? 1 : undefined, maxCostUsd: max_cost_usd });
        // Without any project, run it standalone in the market the input names (default: US, English).
        if (!project_id && ((await rest("GET", "/projects")) as unknown[]).length === 0) return forAgent(await rest("POST", `/lookups/${lookup.name}${q}`, input));
        const id = await resolveProject(project_id as string | undefined);
        return forAgent(await rest("POST", `/projects/${id}/lookups/${lookup.name}${q}`, input));
      },
    );
  }

  // ── Saved creators ──────────────────────────────────────────────────────
  tool(
    "list_creators",
    "Creators saved in the project, with their outreach status, notes, tags and last analysed numbers. Free.",
    {
      project_id: projectId,
      platform: z.enum(PLATFORM_IDS as ["youtube", "tiktok", "instagram"]).optional(),
      status: z.enum(PIPELINE).optional(),
      tag: z.string().optional(),
      search: z.string().optional(),
      sort: z.enum(["added", "followers", "engagement", "views", "name"]).optional(),
      limit: z.number().int().min(1).max(500).optional(),
    },
    async ({ project_id, search, limit, ...rest_ }) => {
      const data = (await rest("GET", `/projects/${await resolveProject(project_id)}/creators${query({ ...rest_, q: search, limit: limit ?? 100 })}`)) as Json;
      return {
        total: data.total,
        creators: rows(data.creators).map((c) => ({ id: c.id, status: c.status, notes: c.notes || undefined, tags: c.tags, ...pick((c.data ?? {}) as Json, CREATOR_KEYS.filter((k) => k !== "id")) })),
      };
    },
    true,
  );
  tool(
    "save_creators",
    "Save creators (as returned by find_creators or analyse_creator) to the project, optionally with a status and tags. Saving one already there updates its numbers and keeps its status and notes. Free.",
    { project_id: projectId, creators: z.array(z.record(z.string(), z.unknown())).min(1).max(500), status: z.enum(PIPELINE).optional(), tags: z.array(z.string()).max(20).optional() },
    async ({ project_id, ...body }) => rest("POST", `/projects/${await resolveProject(project_id)}/creators`, body),
  );
  tool(
    "update_creators",
    "Set the outreach status of saved creators and add or remove tags (ids from list_creators). Free.",
    { project_id: projectId, ids: z.array(z.string().uuid()).min(1), status: z.enum(PIPELINE).optional(), add_tags: z.array(z.string()).optional(), remove_tags: z.array(z.string()).optional() },
    async (a) => rest("POST", `/projects/${await resolveProject(a.project_id)}/creators/bulk`, { ids: a.ids, status: a.status, addTags: a.add_tags, removeTags: a.remove_tags }),
  );
  tool(
    "reanalyse_creators",
    "Re-read up to 25 saved creators' profiles and recent posts for fresh numbers ($0.02–0.03 each). Use dry_run for the price.",
    { project_id: projectId, ids: z.array(z.string().uuid()).min(1).max(25), dry_run: dryRun, max_cost_usd: maxCost.optional() },
    async (a) => rest("POST", `/projects/${await resolveProject(a.project_id)}/creators/analyse${query({ dryRun: a.dry_run ? 1 : undefined, maxCostUsd: a.max_cost_usd })}`, { ids: a.ids }),
  );

  // ── Leads ───────────────────────────────────────────────────────────────
  tool(
    "list_leads",
    "Businesses saved in the project's lead list, with status, notes, tags and any emails found. Free.",
    {
      project_id: projectId,
      status: z.enum(PIPELINE).optional(),
      tag: z.string().optional(),
      search: z.string().optional(),
      website: z.enum(["yes", "no"]).optional().describe("Only leads with (yes) or without (no) a website"),
      search_id: z.string().uuid().optional().describe("Only leads a given lead search found"),
      limit: z.number().int().min(1).max(1000).optional(),
    },
    async ({ project_id, search, search_id, limit, ...rest_ }) => {
      const data = (await rest("GET", `/projects/${await resolveProject(project_id)}/leads${query({ ...rest_, q: search, searchId: search_id, limit: limit ?? 200 })}`)) as Json;
      return { total: data.total, leads: rows(data.leads).map((l) => ({ id: l.id, status: l.status, notes: l.notes || undefined, tags: l.tags, emails: l.emails, ...pick((l.data ?? {}) as Json, LEAD_KEYS.filter((k) => k !== "emails")) })) };
    },
    true,
  );
  tool(
    "save_leads",
    "Save businesses (as returned by find_leads) to the project's lead list, optionally with a status and tags. Free.",
    { project_id: projectId, leads: z.array(z.record(z.string(), z.unknown())).min(1).max(1000), status: z.enum(PIPELINE).optional(), tags: z.array(z.string()).max(20).optional() },
    async ({ project_id, ...body }) => rest("POST", `/projects/${await resolveProject(project_id)}/leads`, body),
  );
  tool(
    "update_leads",
    "Set the outreach status of saved leads and add or remove tags (ids from list_leads). Free.",
    { project_id: projectId, ids: z.array(z.string().uuid()).min(1), status: z.enum(PIPELINE).optional(), add_tags: z.array(z.string()).optional(), remove_tags: z.array(z.string()).optional() },
    async (a) => rest("POST", `/projects/${await resolveProject(a.project_id)}/leads/bulk`, { ids: a.ids, status: a.status, addTags: a.add_tags, removeTags: a.remove_tags }),
  );
  tool(
    "find_saved_lead_emails",
    "Find contact emails for up to 100 saved leads that have a website and store them on the leads. method=website reads the homepage ($0.01 each); method=directory asks a business-email directory ($0.03 each). Use dry_run for the price.",
    { project_id: projectId, ids: z.array(z.string().uuid()).min(1).max(100), method: z.enum(["website", "directory"]).optional(), dry_run: dryRun, max_cost_usd: maxCost.optional() },
    async (a) => rest("POST", `/projects/${await resolveProject(a.project_id)}/leads/emails${query({ dryRun: a.dry_run ? 1 : undefined, maxCostUsd: a.max_cost_usd })}`, { ids: a.ids, method: a.method }),
  );
  tool(
    "start_lead_search",
    "Search Google Maps at scale in the background: every query in every location (text mode), or every query from every point of a grid over a city (grid mode, for more than the 60 places one search returns). Places that pass `filters` are saved to the lead list. $0.07 per page searched; use dry_run for the price and size first.",
    { project_id: projectId, ...leadSearchInput.shape, dry_run: dryRun, max_cost_usd: maxCost.optional() },
    async (a) => {
      const { project_id, dry_run, max_cost_usd, ...body } = a as Json;
      return rest("POST", `/projects/${await resolveProject(project_id as string | undefined)}/lead-searches${query({ dryRun: dry_run ? 1 : undefined, maxCostUsd: max_cost_usd })}`, body);
    },
  );
  tool(
    "get_lead_search",
    "A lead search's progress and spend, with the places it found (matched=yes for those that passed the filters). Free.",
    { search_id: z.string().uuid(), matched: z.enum(["all", "yes", "no"]).optional(), limit: z.number().int().min(0).max(1000).optional() },
    async (a) => {
      const data = (await rest("GET", `/lead-searches/${a.search_id}${query({ matched: a.matched, limit: a.limit ?? 100 })}`)) as Json;
      return { ...data, places: rows(data.places).map((p) => ({ ...pick(p, LEAD_KEYS), matched: p.matched })) };
    },
    true,
  );
  tool("list_lead_searches", "The project's lead searches, newest first, with status, counts and spend. Free.", { project_id: projectId }, async (a) => rest("GET", `/projects/${await resolveProject(a.project_id)}/lead-searches`), true);
  tool("cancel_lead_search", "Stop a running lead search. What it found and spent so far is kept.", { search_id: z.string().uuid() }, async (a) => rest("POST", `/lead-searches/${a.search_id}/cancel`));

  // ── Monitors: brand mentions and conversations ──────────────────────────
  tool(
    "list_monitors",
    "The project's monitors: brand monitors (mentions of the product) and topic monitors (people asking about a problem), with schedule, price per run and per month, mention counts and the last run. Free.",
    { project_id: projectId, kind: z.enum(["brand", "topic"]).optional() },
    async (a) => rest("GET", `/projects/${await resolveProject(a.project_id)}/monitors${query({ kind: a.kind })}`),
    true,
  );
  tool(
    "create_monitor",
    "Create a monitor that searches communities on a schedule. kind=brand finds pages naming the terms; kind=topic finds people asking about the terms (problems or categories), ranked by intent. Each run reads only pages newer than the last run. Use dry_run for the price of a run and of a month; run_now starts the first run.",
    { project_id: projectId, ...monitorInput.shape, dry_run: dryRun, run_now: z.boolean().optional() },
    async (a) => {
      const { project_id, dry_run, run_now, ...body } = a;
      return rest("POST", `/projects/${await resolveProject(project_id)}/monitors${query({ dryRun: dry_run ? 1 : undefined, run: run_now ? 1 : undefined })}`, body);
    },
  );
  tool(
    "update_monitor",
    "Change a monitor's terms, sources, schedule or AI scoring, or pause it (active: false). Free.",
    { monitor_id: z.string().uuid(), ...monitorInput.omit({ kind: true }).partial().shape },
    async ({ monitor_id, ...body }) => rest("PATCH", `/monitors/${monitor_id}`, body),
  );
  tool(
    "run_monitor",
    "Run a monitor now, in the background. Paid at the price list_monitors shows per run; pass max_cost_usd. Check progress with get_monitor_run.",
    { monitor_id: z.string().uuid(), max_cost_usd: maxCost.optional() },
    async (a) => rest("POST", `/monitors/${a.monitor_id}/runs${query({ maxCostUsd: a.max_cost_usd })}`),
  );
  tool("get_monitor_run", "A monitor run's status, searches done, pages found and added, spend and warnings. Free.", { run_id: z.string().uuid() }, async (a) => rest("GET", `/monitor-runs/${a.run_id}`), true);
  tool(
    "list_mentions",
    "The project's feed of mentions and conversations, newest first or by intent, filtered by monitor, kind, status, source, sentiment or minimum intent. Free.",
    {
      project_id: projectId,
      monitor_id: z.string().uuid().optional(),
      kind: z.enum(["brand", "topic"]).optional(),
      status: z.enum([...MENTION_STATUSES, "open"] as [string, ...string[]]).optional().describe("open = new or read"),
      source: z.enum(SOURCE_IDS as [string, ...string[]]).optional(),
      sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
      min_intent: z.number().int().min(0).max(100).optional(),
      search: z.string().optional(),
      sort: z.enum(["newest", "intent", "published"]).optional(),
      limit: z.number().int().min(1).max(500).optional(),
    },
    async (a) => {
      const data = (await rest(
        "GET",
        `/projects/${await resolveProject(a.project_id)}/mentions${query({ monitorId: a.monitor_id, kind: a.kind, status: a.status, source: a.source, sentiment: a.sentiment, minIntent: a.min_intent, q: a.search, sort: a.sort, limit: a.limit ?? 50 })}`,
      )) as Json;
      return { total: data.total, mentions: rows(data.mentions).map((m) => ({ id: m.id, status: m.status, ...pick(m, MENTION_KEYS) })) };
    },
    true,
  );
  tool(
    "set_mention_status",
    "Mark mentions as read, replied or ignored (ids from list_mentions). Free.",
    { project_id: projectId, ids: z.array(z.string().uuid()).min(1), status: z.enum(MENTION_STATUSES) },
    async (a) => rest("POST", `/projects/${await resolveProject(a.project_id)}/mentions/status`, { ids: a.ids, status: a.status }),
  );
  tool(
    "get_communities",
    "Where the project's mentions or conversations come from, ranked by threads, replies and recency: the subreddits, forums and sites worth being active in. Free.",
    { project_id: projectId, kind: z.enum(["brand", "topic"]).optional(), monitor_id: z.string().uuid().optional() },
    async (a) => rest("GET", `/projects/${await resolveProject(a.project_id)}/communities${query({ kind: a.kind, monitorId: a.monitor_id })}`),
    true,
  );

  return server;
}

/**
 * Stateless streamable HTTP: one server and transport per request. Authenticated by an oreach_ API
 * key or, for clients like ChatGPT, an OAuth access token. A 401 points clients at the OAuth
 * metadata (RFC 9728), which is how they discover where to sign in.
 */
export async function registerMcp(app: FastifyInstance) {
  app.route({
    method: ["POST", "GET", "DELETE"],
    url: "/mcp",
    async handler(request, reply) {
      if (request.method !== "POST") {
        return reply.status(405).header("allow", "POST").send({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed. This server is stateless; use POST." }, id: null });
      }
      const user = await resolveUser(request);
      if (!user || user.via === "session") {
        const metadata = `${issuer()}/.well-known/oauth-protected-resource`;
        return reply
          .status(401)
          .header("www-authenticate", `Bearer realm="OpenReach", resource_metadata="${metadata}", scope="${SCOPE}"`)
          .send({ jsonrpc: "2.0", error: { code: -32001, message: "Sign in with OAuth, or send an OpenReach API key: Authorization: Bearer oreach_… (create one in Settings)." }, id: null });
      }
      const server = buildServer(app, request.headers.authorization as string);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      reply.hijack();
      reply.raw.on("close", () => {
        void transport.close();
        void server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(request.raw, reply.raw, request.body);
    },
  });
}
