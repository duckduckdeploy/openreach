import { type Creator, PIPELINE, PLATFORM_IDS } from "@openreach/shared";
import { and, arrayContains, asc, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { dataDb, schema } from "../db";
import { requireProject, requireUser } from "../lib/context";
import { analyseCreator, ANALYSE_USD } from "../lib/creators";
import { notFound, parse, uuidParam } from "../lib/errors";
import { mapLimit } from "../lib/pool";
import { textArray } from "../lib/sql";
import { getYep } from "../lib/yep";
import { assertWithinCeiling } from "../services/run-lookup";

const platform = z.enum(PLATFORM_IDS as ["youtube", "tiktok", "instagram"]);
const status = z.enum(PIPELINE);
const tags = z.array(z.string().trim().min(1).max(40)).max(20);
const ids = z.array(z.string().uuid()).min(1).max(1000);

/** A Creator as the app or an agent sends it; only the identity fields are required. */
const creatorInput: z.ZodType<Creator> = z
  .object({
    platform,
    id: z.string().trim().min(1).max(200),
    handle: z.string().trim().min(1).max(200),
    name: z.string().max(300).nullable().default(null),
    url: z.string().max(2000),
    avatar: z.string().max(4000).nullable().default(null),
    bio: z.string().max(5000).nullable().default(null),
    followers: z.number().int().min(0).nullable().default(null),
    verified: z.boolean().default(false),
  })
  .passthrough() as never;

const SORTS = {
  added: schema.creators.createdAt,
  followers: schema.creators.followers,
  engagement: schema.creators.engagementRate,
  views: schema.creators.avgViews,
  name: schema.creators.handle,
} as const;

function columns(creator: Creator) {
  return {
    platform: creator.platform,
    platformId: creator.id,
    handle: creator.handle,
    name: creator.name,
    url: creator.url,
    followers: creator.followers,
    avgViews: creator.avgViews ?? null,
    engagementRate: creator.engagementRate ?? null,
    emails: creator.emails ?? [],
    country: creator.country ?? null,
    data: creator,
  };
}

export async function creatorRoutes(app: FastifyInstance) {
  app.get<{ Params: { projectId: string }; Querystring: Record<string, string | undefined> }>("/projects/:projectId/creators", async (request) => {
    const user = await requireUser(request);
    const project = await requireProject(user.id, request.params.projectId);
    const q = parse(
      z.object({
        platform: platform.optional(),
        status: status.optional(),
        tag: z.string().max(40).optional(),
        q: z.string().trim().max(120).optional(),
        sort: z.enum(Object.keys(SORTS) as [keyof typeof SORTS]).default("added"),
        order: z.enum(["asc", "desc"]).default("desc"),
        limit: z.coerce.number().int().min(1).max(1000).default(200),
        offset: z.coerce.number().int().min(0).default(0),
      }),
      request.query,
    );
    const where: SQL[] = [eq(schema.creators.projectId, project.id)];
    if (q.platform) where.push(eq(schema.creators.platform, q.platform));
    if (q.status) where.push(eq(schema.creators.status, q.status));
    if (q.tag) where.push(arrayContains(schema.creators.tags, [q.tag]));
    if (q.q) where.push(or(ilike(schema.creators.handle, `%${q.q}%`), ilike(schema.creators.name, `%${q.q}%`), ilike(schema.creators.notes, `%${q.q}%`)) as SQL);
    const column = SORTS[q.sort];
    const [rows, [count]] = await Promise.all([
      dataDb
        .select()
        .from(schema.creators)
        .where(and(...where))
        .orderBy(q.order === "asc" ? asc(column) : sql`${column} desc nulls last`, desc(schema.creators.createdAt))
        .limit(q.limit)
        .offset(q.offset),
      dataDb.select({ total: sql<number>`count(*)::int` }).from(schema.creators).where(and(...where)),
    ]);
    return { ok: true, data: { total: count?.total ?? 0, creators: rows } };
  });

  // Saving a creator already in the list updates its numbers and keeps its status, notes and tags.
  app.post<{ Params: { projectId: string } }>("/projects/:projectId/creators", async (request, reply) => {
    const user = await requireUser(request);
    const project = await requireProject(user.id, request.params.projectId);
    const input = parse(z.object({ creators: z.array(creatorInput).min(1).max(500), status: status.optional(), tags: tags.default([]) }), request.body);
    const values = input.creators.map((creator) => ({
      ...columns(creator),
      projectId: project.id,
      status: input.status ?? "new",
      tags: input.tags,
      analysedAt: creator.analysed ? new Date() : null,
    }));
    const rows = await dataDb
      .insert(schema.creators)
      .values(values)
      .onConflictDoUpdate({
        target: [schema.creators.projectId, schema.creators.platform, schema.creators.platformId],
        // An analysed copy replaces a search-result copy; a search-result copy never replaces an analysed one.
        set: {
          handle: sql`excluded.handle`,
          name: sql`coalesce(excluded.name, ${schema.creators.name})`,
          followers: sql`coalesce(excluded.followers, ${schema.creators.followers})`,
          avgViews: sql`coalesce(excluded.avg_views, ${schema.creators.avgViews})`,
          engagementRate: sql`coalesce(excluded.engagement_rate, ${schema.creators.engagementRate})`,
          emails: sql`case when cardinality(excluded.emails) > 0 then excluded.emails else ${schema.creators.emails} end`,
          country: sql`coalesce(excluded.country, ${schema.creators.country})`,
          data: sql`case when (excluded.data->>'analysed')::boolean is true or (${schema.creators.data}->>'analysed') is null then excluded.data else ${schema.creators.data} end`,
          analysedAt: sql`coalesce(excluded.analysed_at, ${schema.creators.analysedAt})`,
          tags: sql`(select array(select distinct unnest(${schema.creators.tags} || excluded.tags)))`,
          updatedAt: new Date(),
        },
      })
      .returning({ id: schema.creators.id });
    return reply.status(201).send({ ok: true, data: { saved: rows.length } });
  });

  app.patch<{ Params: { projectId: string; creatorId: string } }>("/projects/:projectId/creators/:creatorId", async (request) => {
    const user = await requireUser(request);
    const project = await requireProject(user.id, request.params.projectId);
    const id = uuidParam(request.params.creatorId, "Creator");
    const input = parse(z.object({ status: status.optional(), notes: z.string().max(5000).optional(), tags: tags.optional() }), request.body);
    const [row] = await dataDb
      .update(schema.creators)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(schema.creators.id, id), eq(schema.creators.projectId, project.id)))
      .returning();
    if (!row) throw notFound("Creator");
    return { ok: true, data: row };
  });

  app.post<{ Params: { projectId: string } }>("/projects/:projectId/creators/bulk", async (request) => {
    const user = await requireUser(request);
    const project = await requireProject(user.id, request.params.projectId);
    const input = parse(z.object({ ids, status: status.optional(), addTags: tags.default([]), removeTags: tags.default([]) }), request.body);
    const rows = await dataDb
      .update(schema.creators)
      .set({
        status: input.status,
        tags: sql`(select array(select distinct t from unnest(${schema.creators.tags} || ${textArray(input.addTags)}) t where not (t = any(${textArray(input.removeTags)}))))`,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.creators.projectId, project.id), inArray(schema.creators.id, input.ids)))
      .returning({ id: schema.creators.id });
    return { ok: true, data: { updated: rows.length } };
  });

  app.post<{ Params: { projectId: string } }>("/projects/:projectId/creators/delete", async (request) => {
    const user = await requireUser(request);
    const project = await requireProject(user.id, request.params.projectId);
    const input = parse(z.object({ ids }), request.body);
    const rows = await dataDb
      .delete(schema.creators)
      .where(and(eq(schema.creators.projectId, project.id), inArray(schema.creators.id, input.ids)))
      .returning({ id: schema.creators.id });
    return { ok: true, data: { deleted: rows.length } };
  });

  /** Re-reads saved creators' profiles and recent posts. Paid; ?dryRun=1 for the price, ?maxCostUsd= for a ceiling. */
  app.post<{ Params: { projectId: string }; Querystring: { dryRun?: string; maxCostUsd?: string } }>("/projects/:projectId/creators/analyse", async (request) => {
    const user = await requireUser(request);
    const project = await requireProject(user.id, request.params.projectId);
    const input = parse(z.object({ ids: z.array(z.string().uuid()).min(1).max(25) }), request.body);
    const { maxCostUsd } = parse(z.object({ maxCostUsd: z.coerce.number().positive().finite().optional() }), { maxCostUsd: request.query.maxCostUsd || undefined });
    const rows = await dataDb.select().from(schema.creators).where(and(eq(schema.creators.projectId, project.id), inArray(schema.creators.id, input.ids)));
    const estimate = { min: Math.round(rows.length * ANALYSE_USD.min * 100) / 100, max: Math.round(rows.length * ANALYSE_USD.max * 100) / 100 };
    if (request.query.dryRun === "1") return { ok: true, data: { estimate, creators: rows.length, dryRun: true } };
    assertWithinCeiling(estimate, maxCostUsd);
    const yep = await getYep({ userId: user.id, projectId: project.id, feature: "influencers" });
    let costUsd = 0;
    const failed: { id: string; handle: string; error: string }[] = [];
    await mapLimit(rows, 4, async (row) => {
      try {
        // A YouTube channel ID skips the handle lookup.
        const res = await analyseCreator(yep, row.platform, row.platform === "youtube" ? row.platformId : row.handle);
        costUsd += res.costUsd;
        await dataDb.update(schema.creators).set({ ...columns(res.creator), analysedAt: new Date(), updatedAt: new Date() }).where(eq(schema.creators.id, row.id));
      } catch (error) {
        failed.push({ id: row.id, handle: row.handle, error: (error as Error).message });
      }
    });
    return { ok: true, data: { analysed: rows.length - failed.length, failed, costUsd: Math.round(costUsd * 100) / 100 } };
  });
}
