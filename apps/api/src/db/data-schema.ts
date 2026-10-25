/**
 * The project database: everything a project finds and keeps, apart from accounts and billing
 * (core-schema.ts). Users live in the core database, so the columns that point at them (userId)
 * carry no foreign key and their rows here are removed in code: anything that deletes a user must
 * delete the user's projects and cache rows here too.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { Creator, Lead, PipelineStatus, RuleGroup, Schedule, Sentiment, MentionStatus } from "@openreach/shared";

import { createdAt, updatedAt } from "./columns";

export type RunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export const apiCache = pgTable(
  "api_cache",
  {
    userId: text("user_id").notNull(),
    key: text("key").notNull(),
    payload: jsonb("payload").notNull(),
    costUsd: doublePrecision("cost_usd").notNull().default(0),
    createdAt: createdAt(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.key] }), index("api_cache_expiry_idx").on(t.expiresAt)],
);

// ── Projects ────────────────────────────────────────────────────────────────

/** A product being marketed. Its description, keywords and competitors feed the searches. */
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    domain: text("domain"),
    description: text("description"),
    // Niche and problem words: "home espresso", "crm for small business".
    keywords: text("keywords").array().notNull().default(sql`'{}'::text[]`),
    competitors: text("competitors").array().notNull().default(sql`'{}'::text[]`),
    locationCode: integer("location_code").notNull().default(2840),
    locationName: text("location_name").notNull().default("United States"),
    // ISO 3166-1 alpha-2, lowercase.
    country: text("country").notNull().default("us"),
    language: text("language").notNull().default("en"),
    // Free-form notes shared with agents over MCP (goal, audience, offer).
    context: jsonb("context").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("projects_user_idx").on(t.userId)],
);

// ── Creators ────────────────────────────────────────────────────────────────

/** A creator saved to a project, with where outreach stands. `data` is the full Creator as last analysed. */
export const creators = pgTable(
  "creators",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    platform: text("platform").$type<Creator["platform"]>().notNull(),
    platformId: text("platform_id").notNull(),
    handle: text("handle").notNull(),
    name: text("name"),
    url: text("url").notNull(),
    followers: integer("followers"),
    avgViews: doublePrecision("avg_views"),
    engagementRate: doublePrecision("engagement_rate"),
    emails: text("emails").array().notNull().default(sql`'{}'::text[]`),
    country: text("country"),
    data: jsonb("data").$type<Creator>().notNull(),
    status: text("status").$type<PipelineStatus>().notNull().default("new"),
    notes: text("notes").notNull().default(""),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    analysedAt: timestamp("analysed_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("creators_unique").on(t.projectId, t.platform, t.platformId)],
);

// ── Leads ───────────────────────────────────────────────────────────────────

/** A business saved to a project's lead list. One row per Google Place per project. */
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    placeId: text("place_id").notNull(),
    name: text("name").notNull(),
    category: text("category"),
    phone: text("phone"),
    website: text("website"),
    domain: text("domain"),
    rating: doublePrecision("rating"),
    reviews: integer("reviews"),
    address: text("address"),
    emails: text("emails").array().notNull().default(sql`'{}'::text[]`),
    data: jsonb("data").$type<Lead>().notNull(),
    status: text("status").$type<PipelineStatus>().notNull().default("new"),
    notes: text("notes").notNull().default(""),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    // The lead search that first found it, if any.
    searchId: uuid("search_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("leads_unique").on(t.projectId, t.placeId)],
);

export type LeadSearchParams = {
  /** Places "includedType", e.g. "plumber". */
  includedType?: string;
  minRating?: number;
  openNow?: boolean;
  priceLevels?: string[];
  region?: string;
  language?: string;
};

export type GridSpec = { latitude: number; longitude: number; size: number; spacingKm: number };

/**
 * A lead search: every query in every location (text mode), or every query from every point of a
 * grid (grid mode), each up to `pages` pages of 20. Runs in the background.
 */
export const leadSearches = pgTable(
  "lead_searches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    queries: text("queries").array().notNull(),
    locations: text("locations").array().notNull().default(sql`'{}'::text[]`),
    mode: text("mode").$type<"text" | "grid">().notNull().default("text"),
    grid: jsonb("grid").$type<GridSpec>(),
    pages: integer("pages").notNull().default(1),
    params: jsonb("params").$type<LeadSearchParams>().notNull().default({}),
    filters: jsonb("filters").$type<RuleGroup>(),
    // Save every place that passes the filters to the lead list as it is found.
    autoSave: boolean("auto_save").notNull().default(true),
    status: text("status").$type<RunStatus>().notNull().default("queued"),
    totalCalls: integer("total_calls").notNull().default(0),
    doneCalls: integer("done_calls").notNull().default(0),
    found: integer("found").notNull().default(0),
    matched: integer("matched").notNull().default(0),
    saved: integer("saved").notNull().default(0),
    costUsd: doublePrecision("cost_usd").notNull().default(0),
    error: text("error"),
    heartbeatAt: timestamp("heartbeat_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("lead_searches_project_idx").on(t.projectId, t.createdAt)],
);

/** Every place a lead search found, whether or not it passed the filters. */
export const leadSearchPlaces = pgTable(
  "lead_search_places",
  {
    searchId: uuid("search_id")
      .notNull()
      .references(() => leadSearches.id, { onDelete: "cascade" }),
    placeId: text("place_id").notNull(),
    data: jsonb("data").$type<Lead>().notNull(),
    matched: boolean("matched").notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.searchId, t.placeId] })],
);

// ── Monitors: brand mentions and conversations ──────────────────────────────

export type MonitorKind = "brand" | "topic";

/**
 * A saved search across communities. `brand` monitors look for the terms (a product's name);
 * `topic` monitors look for people asking about a problem, with intent phrasings around the terms.
 */
export const monitors = pgTable(
  "monitors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    kind: text("kind").$type<MonitorKind>().notNull(),
    name: text("name").notNull(),
    terms: text("terms").array().notNull(),
    excludes: text("excludes").array().notNull().default(sql`'{}'::text[]`),
    competitors: text("competitors").array().notNull().default(sql`'{}'::text[]`),
    sources: text("sources").array().notNull(),
    // Google results read per source search: 10 or 20 ($0.01 per 10).
    depth: integer("depth").notNull().default(10),
    aiScoring: boolean("ai_scoring").notNull().default(false),
    schedule: text("schedule").$type<Schedule>().notNull().default("daily"),
    active: boolean("active").notNull().default(true),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("monitors_project_idx").on(t.projectId), index("monitors_due_idx").on(t.nextRunAt)],
);

export const monitorRuns = pgTable(
  "monitor_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").notNull(),
    userId: text("user_id").notNull(),
    trigger: text("trigger").$type<"manual" | "schedule">().notNull().default("manual"),
    status: text("status").$type<RunStatus>().notNull().default("queued"),
    searchesTotal: integer("searches_total").notNull().default(0),
    searchesDone: integer("searches_done").notNull().default(0),
    found: integer("found").notNull().default(0),
    added: integer("added").notNull().default(0),
    costUsd: doublePrecision("cost_usd").notNull().default(0),
    // Searches that failed while the run went on, e.g. one source's API being down.
    warnings: text("warnings").array().notNull().default(sql`'{}'::text[]`),
    error: text("error"),
    heartbeatAt: timestamp("heartbeat_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("monitor_runs_monitor_idx").on(t.monitorId, t.createdAt)],
);

/** One page a monitor found. Seen again later, it is updated in place and keeps its status. */
export const mentions = pgTable(
  "mentions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").notNull(),
    url: text("url").notNull(),
    sourceId: text("source_id").notNull(),
    title: text("title").notNull(),
    snippet: text("snippet").notNull().default(""),
    community: text("community"),
    author: text("author"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    comments: integer("comments"),
    score: integer("score"),
    intent: integer("intent").notNull().default(0),
    sentiment: text("sentiment").$type<Sentiment>().notNull().default("neutral"),
    signals: text("signals").array().notNull().default(sql`'{}'::text[]`),
    // Set by the optional AI pass: one line on why it matters, and whether it is relevant at all.
    aiNote: text("ai_note"),
    relevant: boolean("relevant").notNull().default(true),
    term: text("term"),
    status: text("status").$type<MentionStatus>().notNull().default("new"),
    firstRunId: uuid("first_run_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("mentions_unique").on(t.monitorId, t.url),
    index("mentions_project_idx").on(t.projectId, t.createdAt),
  ],
);
