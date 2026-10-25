import { type Lead, PIPELINE } from "@openreach/shared";
import { and, arrayContains, asc, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { dataDb, schema } from "../db";
import { dispatch } from "../jobs/dispatch";
import { requireProject, requireUser } from "../lib/context";
import { conflict, notFound, parse, uuidParam } from "../lib/errors";
import { EMAIL_USD, findLeadEmails } from "../lib/leads";
import { mapLimit } from "../lib/pool";
import { textArray } from "../lib/sql";
import { getYep } from "../lib/yep";
import { estimateLeadSearch, failLeadSearch, leadColumns, leadSearchInput, leadUpsertSet, requireLeadSearch, startLeadSearch } from "../services/lead-search";
import { assertWithinCeiling } from "../services/run-lookup";

const status = z.enum(PIPELINE);
const tags = z.array(z.string().trim().min(1).max(40)).max(20);
const ids = z.array(z.string().uuid()).min(1).max(1000);

const leadInput: z.ZodType<Lead> = z
  .object({
    placeId: z.string().trim().min(1).max(300),
    name: z.string().trim().min(1).max(300),
    category: z.string().max(200).nullable().default(null),
    types: z.array(z.string().max(100)).max(50).default([]),
    address: z.string().max(500).nullable().default(null),
    phone: z.string().max(60).nullable().default(null),
    website: z.string().max(2000).nullable().default(null),
    domain: z.string().max(253).nullable().default(null),
    rating: z.number().min(0).max(5).nullable().default(null),
    reviews: z.number().int().min(0).nullable().default(null),
  })
  .passthrough() as never;

const SORTS = {
  added: schema.leads.createdAt,
  name: schema.leads.name,
  rating: schema.leads.rating,
  reviews: schema.leads.reviews,
} as const;

const ceilingOf = (raw: string | undefined) => parse(z.object({ maxCostUsd: z.coerce.number().positive().finite().optional() }), { maxCostUsd: raw || undefined }).maxCostUsd;

export async function leadRoutes(app: FastifyInstance) {
  // ── The lead list ─────────────────────────────────────────────────────────
  app.get<{ Params: { projectId: string }; Querystring: Record<string, string | undefined> }>("/projects/:projectId/leads", async (request) => {
    const user = await requireUser(request);
    const project = await requireProject(user.id, request.params.projectId);
    const q = parse(
      z.object({
        status: status.optional(),
        tag: z.string().max(40).optional(),
        q: z.string().trim().max(120).optional(),
        website: z.enum(["yes", "no"]).optional(),
        searchId: z.string().uuid().optional(),
        sort: z.enum(Object.keys(SORTS) as [keyof typeof SORTS]).default("added"),
        order: z.enum(["asc", "desc"]).default("desc"),
        limit: z.coerce.number().int().min(1).max(5000).default(500),
        offset: z.coerce.number().int().min(0).default(0),
      }),
      request.query,
    );
    const where: SQL[] = [eq(schema.leads.projectId, project.id)];
    if (q.status) where.push(eq(schema.leads.status, q.status));
    if (q.tag) where.push(arrayContains(schema.leads.tags, [q.tag]));
    if (q.searchId) where.push(eq(schema.leads.searchId, q.searchId));
    if (q.website === "no") where.push(isNull(schema.leads.domain));
    if (q.website === "yes") where.push(sql`${schema.leads.domain} is not null`);
    if (q.q) where.push(or(ilike(schema.leads.name, `%${q.q}%`), ilike(schema.leads.category, `%${q.q}%`), ilike(schema.leads.address, `%${q.q}%`), ilike(schema.leads.notes, `%${q.q}%`)) as SQL);
    const column = SORTS[q.sort];
    const [rows, [total]] = await Promise.all([
      dataDb
        .select()
        .from(schema.leads)
        .where(and(...where))
        .orderBy(q.order === "asc" ? asc(column) : sql`${column} desc nulls last`, desc(schema.leads.createdAt))
        .limit(q.limit)
        .offset(q.offset),
      dataDb.select({ n: sql<number>`count(*)::int` }).from(schema.leads).where(and(...where)),
    ]);
    return { ok: true, data: { total: total?.n ?? 0, leads: rows } };
  });

  app.post<{ Params: { projectId: string } }>("/projects/:projectId/leads", async (request, reply) => {
    const user = await requireUser(request);
    const project = await requireProject(user.id, request.params.projectId);
    const input = parse(z.object({ leads: z.array(leadInput).min(1).max(1000), status: status.optional(), tags: tags.default([]) }), request.body);
    const rows = await dataDb
      .insert(schema.leads)
      .values(input.leads.map((lead) => ({ ...leadColumns(lead), projectId: project.id, status: input.status ?? "new", tags: input.tags, emails: lead.emails ?? [] })))
      .onConflictDoUpdate({
        target: [schema.leads.projectId, schema.leads.placeId],
        set: { ...leadUpsertSet, tags: sql`(select array(select distinct unnest(${schema.leads.tags} || excluded.tags)))` },
      })
      .returning({ id: schema.leads.id });
    return reply.status(201).send({ ok: true, data: { saved: rows.length } });
  });

  app.patch<{ Params: { projectId: string; leadId: string } }>("/projects/:projectId/leads/:leadId", async (request) => {
    const user = await requireUser(request);
    const project = await requireProject(user.id, request.params.projectId);
    const id = uuidParam(request.params.leadId, "Lead");
    const input = parse(z.object({ status: status.optional(), notes: z.string().max(5000).optional(), tags: tags.optional(), emails: z.array(z.string().email()).max(20).optional() }), request.body);
    const [row] = await dataDb
      .update(schema.leads)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(schema.leads.id, id), eq(schema.leads.projectId, project.id)))
      .returning();
    if (!row) throw notFound("Lead");
    return { ok: true, data: row };
  });

  app.post<{ Params: { projectId: string } }>("/projects/:projectId/leads/bulk", async (request) => {
    const user = await requireUser(request);
    const project = await requireProject(user.id, request.params.projectId);
    const input = parse(z.object({ ids, status: status.optional(), addTags: tags.default([]), removeTags: tags.default([]) }), request.body);
    const rows = await dataDb
      .update(schema.leads)
      .set({
        status: input.status,
        tags: sql`(select array(select distinct t from unnest(${schema.leads.tags} || ${textArray(input.addTags)}) t where not (t = any(${textArray(input.removeTags)}))))`,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.leads.projectId, project.id), inArray(schema.leads.id, input.ids)))
      .returning({ id: schema.leads.id });
    return { ok: true, data: { updated: rows.length } };
  });

  app.post<{ Params: { projectId: string } }>("/projects/:projectId/leads/delete", async (request) => {
    const user = await requireUser(request);
    const project = await requireProject(user.id, request.params.projectId);
    const input = parse(z.object({ ids }), request.body);
    const rows = await dataDb.delete(schema.leads).where(and(eq(schema.leads.projectId, project.id), inArray(schema.leads.id, input.ids))).returning({ id: schema.leads.id });
    return { ok: true, data: { deleted: rows.length } };
  });

  /** Finds emails for saved leads with a website and stores them on the lead. Paid; ?dryRun=1 for the price. */
  app.post<{ Params: { projectId: string }; Querystring: { dryRun?: string; maxCostUsd?: string } }>("/projects/:projectId/leads/emails", async (request) => {
    const user = await requireUser(request);
    const project = await requireProject(user.id, request.params.projectId);
    const input = parse(z.object({ ids: z.array(z.string().uuid()).min(1).max(100), method: z.enum(["website", "directory"]).default("website") }), request.body);
    const rows = (await dataDb.select().from(schema.leads).where(and(eq(schema.leads.projectId, project.id), inArray(schema.leads.id, input.ids)))).filter((row) => row.domain);
    const price = EMAIL_USD[input.method].max;
    const estimate = { min: 0, max: Math.round(rows.length * price * 100) / 100 };
    if (request.query.dryRun === "1") return { ok: true, data: { estimate, leads: rows.length, dryRun: true } };
    assertWithinCeiling(estimate, ceilingOf(request.query.maxCostUsd));
    const yep = await getYep({ userId: user.id, projectId: project.id, feature: "leads" });
    let costUsd = 0;
    let found = 0;
    const failed: string[] = [];
    await mapLimit(rows, 4, async (row) => {
      try {
        const res = await findLeadEmails(yep, row.data, input.method);
        costUsd += res.costUsd;
        if (!res.emails.length) return;
        found += 1;
        await dataDb
          .update(schema.leads)
          .set({ emails: sql`(select array(select distinct unnest(${schema.leads.emails} || ${textArray(res.emails)})))`, updatedAt: new Date() })
          .where(eq(schema.leads.id, row.id));
      } catch (error) {
        failed.push(`${row.name}: ${(error as Error).message}`);
      }
    });
    return { ok: true, data: { checked: rows.length, withEmails: found, failed, costUsd: Math.round(costUsd * 100) / 100 } };
  });

  // ── Lead searches ─────────────────────────────────────────────────────────
  app.get<{ Params: { projectId: string } }>("/projects/:projectId/lead-searches", async (request) => {
    const user = await requireUser(request);
    const project = await requireProject(user.id, request.params.projectId);
    const rows = await dataDb.select().from(schema.leadSearches).where(eq(schema.leadSearches.projectId, project.id)).orderBy(desc(schema.leadSearches.createdAt)).limit(100);
    return { ok: true, data: rows };
  });

  /** Starts a lead search in the background (202). ?dryRun=1 returns its price and size only. */
  app.post<{ Params: { projectId: string }; Querystring: { dryRun?: string; maxCostUsd?: string } }>("/projects/:projectId/lead-searches", async (request, reply) => {
    const user = await requireUser(request);
    const project = await requireProject(user.id, request.params.projectId);
    const input = parse(leadSearchInput, request.body);
    const estimate = estimateLeadSearch(input);
    if (request.query.dryRun === "1") return { ok: true, data: { estimate, dryRun: true } };
    assertWithinCeiling(estimate, ceilingOf(request.query.maxCostUsd));
    // Checked before queueing, so a missing key fails here and not silently in the worker.
    await getYep({ userId: user.id, projectId: project.id, feature: "leads" });
    const search = await startLeadSearch(user.id, project.id, input);
    await dispatch("leads.run", { searchId: search.id }, (message) => failLeadSearch(search.id, message));
    return reply.status(202).send({ ok: true, data: { ...search, estimate } });
  });

  app.get<{ Params: { searchId: string }; Querystring: { matched?: string; limit?: string; offset?: string } }>("/lead-searches/:searchId", async (request) => {
    const user = await requireUser(request);
    const search = await requireLeadSearch(user.id, request.params.searchId);
    const q = parse(z.object({ matched: z.enum(["all", "yes", "no"]).default("all"), limit: z.coerce.number().int().min(0).max(5000).default(1000), offset: z.coerce.number().int().min(0).default(0) }), request.query);
    const where: SQL[] = [eq(schema.leadSearchPlaces.searchId, search.id)];
    if (q.matched !== "all") where.push(eq(schema.leadSearchPlaces.matched, q.matched === "yes"));
    const places = q.limit
      ? await dataDb.select().from(schema.leadSearchPlaces).where(and(...where)).orderBy(asc(schema.leadSearchPlaces.createdAt)).limit(q.limit).offset(q.offset)
      : [];
    return { ok: true, data: { ...search, places: places.map((place) => ({ ...place.data, matched: place.matched })) } };
  });

  app.post<{ Params: { searchId: string } }>("/lead-searches/:searchId/cancel", async (request) => {
    const user = await requireUser(request);
    const search = await requireLeadSearch(user.id, request.params.searchId);
    const [row] = await dataDb
      .update(schema.leadSearches)
      .set({ status: "cancelled", finishedAt: new Date() })
      .where(and(eq(schema.leadSearches.id, search.id), inArray(schema.leadSearches.status, ["queued", "running"])))
      .returning();
    return { ok: true, data: row ?? search };
  });

  app.delete<{ Params: { searchId: string } }>("/lead-searches/:searchId", async (request) => {
    const user = await requireUser(request);
    const search = await requireLeadSearch(user.id, request.params.searchId);
    if (search.status === "queued" || search.status === "running") throw conflict("Cancel the search before deleting it.");
    // Saved leads stay in the list; only the search and its raw results go.
    await dataDb.delete(schema.leadSearches).where(eq(schema.leadSearches.id, search.id));
    return { ok: true };
  });
}
