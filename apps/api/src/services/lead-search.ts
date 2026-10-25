import { type Lead, LEAD_FIELDS, matches, ruleGroupSchema } from "@openreach/shared";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { dataDb, schema } from "../db";
import type { LeadSearchParams } from "../db/data-schema";
import { env } from "../env";
import { AppError, notFound } from "../lib/errors";
import { buildGrid } from "../lib/geo";
import { MAPS_PAGE_USD, type PlacesQuery, searchPlaces } from "../lib/leads";
import { mapLimit } from "../lib/pool";
import { errorMessage, getYep, isFatalForRun } from "../lib/yep";

export const leadSearchInput = z
  .object({
    name: z.string().trim().max(120).optional(),
    queries: z.array(z.string().trim().min(2).max(120)).min(1).max(20).describe("What to find, e.g. plumber, emergency plumber"),
    locations: z.array(z.string().trim().min(2).max(120)).max(100).default([]).describe("Text mode: places to search in, e.g. Austin, TX"),
    mode: z.enum(["text", "grid"]).default("text"),
    grid: z
      .object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), size: z.number().int().min(2).max(15), spacingKm: z.number().min(0.2).max(20) })
      .optional()
      .describe("Grid mode: size × size points around a centre, spacingKm apart; each point searches its own neighbourhood"),
    pages: z.number().int().min(1).max(3).default(1),
    params: z
      .object({
        includedType: z.string().trim().max(60).optional(),
        minRating: z.number().min(0).max(5).optional(),
        openNow: z.boolean().optional(),
        priceLevels: z.array(z.enum(["free", "inexpensive", "moderate", "expensive", "very_expensive"])).optional(),
        region: z.string().length(2).optional(),
        language: z.string().min(2).max(10).optional(),
      })
      .default({}),
    filters: ruleGroupSchema.optional().describe("Rules a place must pass to count as a match (see the lead filter fields)"),
    autoSave: z.boolean().default(true).describe("Save every matching place to the project's lead list"),
  })
  .superRefine((i, ctx) => {
    if (i.mode === "grid" && !i.grid) ctx.addIssue({ code: "custom", path: ["grid"], message: "Grid mode needs a grid: latitude, longitude, size and spacingKm" });
  });

export type LeadSearchInput = z.infer<typeof leadSearchInput>;

/** Each search unit: one query in one place (or from one grid point), up to `pages` pages. */
function units(search: { queries: string[]; locations: string[]; mode: "text" | "grid"; grid: LeadSearchInput["grid"] | null; pages: number; params: LeadSearchParams }): PlacesQuery[] {
  if (search.mode === "grid" && search.grid) {
    const { latitude, longitude, size, spacingKm } = search.grid;
    // Each point covers its own cell: a bias a little wider than half the spacing leaves no gaps.
    const radius = Math.min(50_000, Math.max(300, Math.round(spacingKm * 1000 * 0.75)));
    return buildGrid(latitude, longitude, size, spacingKm * 1000).flatMap((point) =>
      search.queries.map((query) => ({ query, pages: search.pages, params: search.params, bias: { latitude: point.lat, longitude: point.lng, radius_m: radius } })),
    );
  }
  const places = search.locations.length ? search.locations : [null];
  return search.queries.flatMap((query) => places.map((location) => ({ query, location, pages: search.pages, params: search.params })));
}

export function estimateLeadSearch(input: LeadSearchInput) {
  const list = units({ ...input, grid: input.grid ?? null });
  const calls = list.length * input.pages;
  // Every unit pays for its first page; later pages only when Google has more.
  return { searches: list.length, maxCalls: calls, min: Math.round(list.length * MAPS_PAGE_USD * 100) / 100, max: Math.round(calls * MAPS_PAGE_USD * 100) / 100 };
}

export async function startLeadSearch(userId: string, projectId: string, input: LeadSearchInput) {
  const estimate = estimateLeadSearch(input);
  if (estimate.maxCalls > env.LEAD_SEARCH_MAX_CALLS) {
    throw new AppError(400, "too_large", `This search would make up to ${estimate.maxCalls} Maps calls; the limit is ${env.LEAD_SEARCH_MAX_CALLS}. Use fewer queries, places, grid points or pages.`);
  }
  const [active] = await dataDb
    .select({ n: count() })
    .from(schema.leadSearches)
    .where(and(eq(schema.leadSearches.userId, userId), inArray(schema.leadSearches.status, ["queued", "running"])));
  if ((active?.n ?? 0) >= env.LEAD_SEARCH_MAX_ACTIVE_PER_USER) {
    throw new AppError(409, "conflict", `${active?.n} lead searches are already running. Wait for one to finish or cancel it.`, { reason: "run_in_progress" });
  }
  const name = input.name || [input.queries.join(", "), input.mode === "grid" ? "grid" : input.locations.slice(0, 2).join(", ")].filter(Boolean).join(" · ");
  const [row] = await dataDb
    .insert(schema.leadSearches)
    .values({
      projectId,
      userId,
      name: name.slice(0, 120),
      queries: input.queries,
      locations: input.locations,
      mode: input.mode,
      grid: input.grid ?? null,
      pages: input.pages,
      params: input.params,
      filters: input.filters?.rules.length ? input.filters : null,
      autoSave: input.autoSave,
      totalCalls: estimate.searches,
    })
    .returning();
  return row!;
}

export async function requireLeadSearch(userId: string, searchId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(searchId)) throw notFound("Lead search");
  const [row] = await dataDb
    .select({ search: schema.leadSearches })
    .from(schema.leadSearches)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.leadSearches.projectId))
    .where(and(eq(schema.leadSearches.id, searchId), eq(schema.projects.userId, userId)))
    .limit(1);
  if (!row) throw notFound("Lead search");
  return row.search;
}

export async function failLeadSearch(searchId: string, message: string) {
  await dataDb
    .update(schema.leadSearches)
    .set({ status: "failed", error: message, finishedAt: new Date() })
    .where(and(eq(schema.leadSearches.id, searchId), inArray(schema.leadSearches.status, ["queued", "running"])));
}

/** The lead-list columns for a place. Saving again refreshes the place's data and keeps status, notes and tags. */
export const leadColumns = (lead: Lead) => ({
  placeId: lead.placeId,
  name: lead.name,
  category: lead.category,
  phone: lead.phone,
  website: lead.website,
  domain: lead.domain,
  rating: lead.rating,
  reviews: lead.reviews,
  address: lead.address,
  data: lead,
});

export const leadUpsertSet = {
  name: sql`excluded.name`,
  category: sql`excluded.category`,
  phone: sql`excluded.phone`,
  website: sql`excluded.website`,
  domain: sql`excluded.domain`,
  rating: sql`excluded.rating`,
  reviews: sql`excluded.reviews`,
  address: sql`excluded.address`,
  data: sql`excluded.data`,
  updatedAt: new Date(),
};

/**
 * Runs every unit of a lead search, a few at a time. Places are stored as they come in, so a
 * cancelled or failed search keeps what it found and what it spent.
 */
export async function processLeadSearch(searchId: string) {
  const [search] = await dataDb.select().from(schema.leadSearches).where(eq(schema.leadSearches.id, searchId)).limit(1);
  if (!search || search.status !== "queued") return;
  const [claimed] = await dataDb
    .update(schema.leadSearches)
    .set({ status: "running", startedAt: new Date(), heartbeatAt: new Date() })
    .where(and(eq(schema.leadSearches.id, searchId), eq(schema.leadSearches.status, "queued")))
    .returning({ id: schema.leadSearches.id });
  if (!claimed) return;

  let yep: Awaited<ReturnType<typeof getYep>>;
  try {
    yep = await getYep({ userId: search.userId, projectId: search.projectId, feature: "leads" });
  } catch (error) {
    await failLeadSearch(searchId, errorMessage(error));
    return;
  }

  const list = units(search);
  const seen = new Set<string>();
  let fatal: string | null = null;
  let stopped = false;
  const errors: string[] = [];

  await mapLimit(list, 3, async (unit) => {
    if (fatal || stopped) return;
    const [current] = await dataDb.select({ status: schema.leadSearches.status }).from(schema.leadSearches).where(eq(schema.leadSearches.id, searchId));
    if (current?.status !== "running") {
      stopped = true;
      return;
    }
    let found: Lead[] = [];
    let costUsd = 0;
    try {
      const res = await searchPlaces(yep, unit);
      found = res.leads.filter((lead) => !seen.has(lead.placeId));
      costUsd = res.costUsd;
    } catch (error) {
      if (isFatalForRun(error)) fatal = errorMessage(error);
      else if (errors.length < 5) errors.push(errorMessage(error));
    }
    for (const lead of found) seen.add(lead.placeId);
    const rows = found.map((lead) => ({ lead, matched: search.filters ? matches(search.filters, lead, LEAD_FIELDS) : true }));
    if (rows.length) {
      await dataDb
        .insert(schema.leadSearchPlaces)
        .values(rows.map(({ lead, matched }) => ({ searchId, placeId: lead.placeId, data: lead, matched })))
        .onConflictDoNothing();
    }
    const toSave = search.autoSave ? rows.filter((row) => row.matched).map((row) => row.lead) : [];
    let saved = 0;
    if (toSave.length) {
      const inserted = await dataDb
        .insert(schema.leads)
        .values(toSave.map((lead) => ({ ...leadColumns(lead), projectId: search.projectId, searchId })))
        .onConflictDoUpdate({ target: [schema.leads.projectId, schema.leads.placeId], set: leadUpsertSet })
        .returning({ id: schema.leads.id });
      saved = inserted.length;
    }
    await dataDb
      .update(schema.leadSearches)
      .set({
        doneCalls: sql`${schema.leadSearches.doneCalls} + 1`,
        found: sql`${schema.leadSearches.found} + ${found.length}`,
        matched: sql`${schema.leadSearches.matched} + ${rows.filter((row) => row.matched).length}`,
        saved: sql`${schema.leadSearches.saved} + ${saved}`,
        costUsd: sql`${schema.leadSearches.costUsd} + ${costUsd}`,
        heartbeatAt: new Date(),
      })
      .where(eq(schema.leadSearches.id, searchId));
  });

  const [after] = await dataDb.select().from(schema.leadSearches).where(eq(schema.leadSearches.id, searchId));
  if (after?.status !== "running") return;
  const failedAll = after.doneCalls > 0 && after.found === 0 && errors.length > 0;
  await dataDb
    .update(schema.leadSearches)
    .set({
      status: fatal || failedAll ? "failed" : "completed",
      error: fatal ?? (errors.length ? `Some searches failed: ${errors.join("; ")}` : null),
      finishedAt: new Date(),
    })
    .where(and(eq(schema.leadSearches.id, searchId), eq(schema.leadSearches.status, "running")));
}
