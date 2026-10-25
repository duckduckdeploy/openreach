import { MENTION_STATUSES, SOURCE_IDS } from "@openreach/shared";
import { and, desc, eq, gte, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { dataDb, schema } from "../db";
import { dispatch } from "../jobs/dispatch";
import { requireProject, requireUser } from "../lib/context";
import { notFound, parse, uuidParam } from "../lib/errors";
import { rankCommunities } from "../lib/mention-search";
import { firstRunAt } from "../lib/pool";
import { getYep } from "../lib/yep";
import { createMonitor, defaultSources, estimateMonitor, failMonitorRun, monitorInput, requireMonitor, startMonitorRun } from "../services/monitors";
import { assertWithinCeiling } from "../services/run-lookup";

const mentionStatus = z.enum(MENTION_STATUSES);

async function requireRun(userId: string, runId: string) {
  const id = uuidParam(runId, "Run");
  const [row] = await dataDb
    .select({ run: schema.monitorRuns })
    .from(schema.monitorRuns)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.monitorRuns.projectId))
    .where(and(eq(schema.monitorRuns.id, id), eq(schema.projects.userId, userId)))
    .limit(1);
  if (!row) throw notFound("Run");
  return row.run;
}

export async function monitorRoutes(app: FastifyInstance) {
  app.get<{ Params: { projectId: string }; Querystring: { kind?: string } }>("/projects/:projectId/monitors", async (request) => {
    const user = await requireUser(request);
    const project = await requireProject(user.id, request.params.projectId);
    const { kind } = parse(z.object({ kind: z.enum(["brand", "topic"]).optional() }), request.query);
    const where: SQL[] = [eq(schema.monitors.projectId, project.id)];
    if (kind) where.push(eq(schema.monitors.kind, kind));
    const rows = await dataDb.select().from(schema.monitors).where(and(...where)).orderBy(desc(schema.monitors.createdAt));
    // Counts per monitor, and each one's latest run, in two queries for the whole list.
    const ids = rows.map((m) => m.id);
    const [counts, latest] = ids.length
      ? await Promise.all([
          dataDb
            .select({ monitorId: schema.mentions.monitorId, total: sql<number>`count(*)::int`, unread: sql<number>`count(*) filter (where ${schema.mentions.status} = 'new')::int` })
            .from(schema.mentions)
            .where(inArray(schema.mentions.monitorId, ids))
            .groupBy(schema.mentions.monitorId),
          dataDb
            .selectDistinctOn([schema.monitorRuns.monitorId])
            .from(schema.monitorRuns)
            .where(inArray(schema.monitorRuns.monitorId, ids))
            .orderBy(schema.monitorRuns.monitorId, desc(schema.monitorRuns.createdAt)),
        ])
      : [[], []];
    return {
      ok: true,
      data: rows.map((m) => ({
        ...m,
        estimate: estimateMonitor(m),
        mentions: counts.find((c) => c.monitorId === m.id) ?? { total: 0, unread: 0 },
        lastRun: latest.find((r) => r.monitorId === m.id) ?? null,
      })),
    };
  });

  /** Creates a monitor. ?dryRun=1 returns the price of a run and of a month without saving. ?run=1 starts the first run right away. */
  app.post<{ Params: { projectId: string }; Querystring: { dryRun?: string; run?: string } }>("/projects/:projectId/monitors", async (request, reply) => {
    const user = await requireUser(request);
    const project = await requireProject(user.id, request.params.projectId);
    const input = parse(monitorInput, request.body);
    const draft = { ...input, sources: input.sources ?? defaultSources(input.kind), lastRunAt: null };
    if (request.query.dryRun === "1") return { ok: true, data: { estimate: estimateMonitor(draft), dryRun: true } };
    const monitor = await createMonitor(project.id, input);
    let run = null;
    if (request.query.run === "1") {
      await getYep({ userId: user.id, projectId: project.id, feature: monitor.kind === "brand" ? "mentions" : "conversations" });
      run = await startMonitorRun(monitor, user.id, "manual");
      const runId = run.id;
      await dispatch("monitor.run", { runId }, (message) => failMonitorRun(runId, message));
    }
    return reply.status(201).send({ ok: true, data: { ...monitor, estimate: estimateMonitor(monitor), run } });
  });

  app.get<{ Params: { monitorId: string } }>("/monitors/:monitorId", async (request) => {
    const user = await requireUser(request);
    const { monitor } = await requireMonitor(user.id, request.params.monitorId);
    const runs = await dataDb.select().from(schema.monitorRuns).where(eq(schema.monitorRuns.monitorId, monitor.id)).orderBy(desc(schema.monitorRuns.createdAt)).limit(20);
    return { ok: true, data: { ...monitor, estimate: estimateMonitor(monitor), runs } };
  });

  app.patch<{ Params: { monitorId: string } }>("/monitors/:monitorId", async (request) => {
    const user = await requireUser(request);
    const { monitor } = await requireMonitor(user.id, request.params.monitorId);
    const input = parse(monitorInput.omit({ kind: true }).partial(), request.body);
    const schedule = input.schedule ?? monitor.schedule;
    const active = input.active ?? monitor.active;
    // A changed schedule, or switching on, starts a fresh period; switching off clears it.
    const nextRunAt = !active ? null : input.schedule !== undefined && input.schedule !== monitor.schedule ? firstRunAt(schedule) : input.active && !monitor.active ? firstRunAt(schedule) : undefined;
    const [row] = await dataDb
      .update(schema.monitors)
      .set({ ...input, nextRunAt, updatedAt: new Date() })
      .where(eq(schema.monitors.id, monitor.id))
      .returning();
    return { ok: true, data: { ...row, estimate: estimateMonitor(row!) } };
  });

  app.delete<{ Params: { monitorId: string } }>("/monitors/:monitorId", async (request) => {
    const user = await requireUser(request);
    const { monitor } = await requireMonitor(user.id, request.params.monitorId);
    await dataDb.update(schema.monitorRuns).set({ status: "cancelled", finishedAt: new Date() }).where(and(eq(schema.monitorRuns.monitorId, monitor.id), inArray(schema.monitorRuns.status, ["queued", "running"])));
    await dataDb.delete(schema.monitors).where(eq(schema.monitors.id, monitor.id));
    return { ok: true };
  });

  /** Runs a monitor now, in the background (202). Paid; ?maxCostUsd= refuses a run whose price is higher. */
  app.post<{ Params: { monitorId: string }; Querystring: { maxCostUsd?: string } }>("/monitors/:monitorId/runs", async (request, reply) => {
    const user = await requireUser(request);
    const { monitor, project } = await requireMonitor(user.id, request.params.monitorId);
    const { maxCostUsd } = parse(z.object({ maxCostUsd: z.coerce.number().positive().finite().optional() }), { maxCostUsd: request.query.maxCostUsd || undefined });
    const estimate = estimateMonitor(monitor);
    assertWithinCeiling(estimate.run, maxCostUsd);
    await getYep({ userId: user.id, projectId: project.id, feature: monitor.kind === "brand" ? "mentions" : "conversations" });
    const run = await startMonitorRun(monitor, user.id, "manual");
    await dispatch("monitor.run", { runId: run.id }, (message) => failMonitorRun(run.id, message));
    return reply.status(202).send({ ok: true, data: { ...run, estimate: estimate.run } });
  });

  app.get<{ Params: { runId: string } }>("/monitor-runs/:runId", async (request) => {
    const user = await requireUser(request);
    return { ok: true, data: await requireRun(user.id, request.params.runId) };
  });

  app.post<{ Params: { runId: string } }>("/monitor-runs/:runId/cancel", async (request) => {
    const user = await requireUser(request);
    const run = await requireRun(user.id, request.params.runId);
    const [row] = await dataDb
      .update(schema.monitorRuns)
      .set({ status: "cancelled", finishedAt: new Date() })
      .where(and(eq(schema.monitorRuns.id, run.id), inArray(schema.monitorRuns.status, ["queued", "running"])))
      .returning();
    return { ok: true, data: row ?? run };
  });

  // ── The feed ──────────────────────────────────────────────────────────────
  app.get<{ Params: { projectId: string }; Querystring: Record<string, string | undefined> }>("/projects/:projectId/mentions", async (request) => {
    const user = await requireUser(request);
    const project = await requireProject(user.id, request.params.projectId);
    const q = parse(
      z.object({
        kind: z.enum(["brand", "topic"]).optional(),
        monitorId: z.string().uuid().optional(),
        status: z.union([mentionStatus, z.literal("open")]).optional().describe("open = new or read"),
        source: z.enum(SOURCE_IDS as [string, ...string[]]).optional(),
        sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
        minIntent: z.coerce.number().int().min(0).max(100).optional(),
        q: z.string().trim().max(120).optional(),
        sort: z.enum(["newest", "intent", "published"]).default("newest"),
        limit: z.coerce.number().int().min(1).max(1000).default(100),
        offset: z.coerce.number().int().min(0).default(0),
      }),
      request.query,
    );
    const where: SQL[] = [eq(schema.mentions.projectId, project.id)];
    if (q.monitorId) where.push(eq(schema.mentions.monitorId, q.monitorId));
    if (q.kind) where.push(sql`${schema.mentions.monitorId} in (select id from monitors where kind = ${q.kind} and project_id = ${project.id})`);
    if (q.status === "open") where.push(inArray(schema.mentions.status, ["new", "read"]));
    else if (q.status) where.push(eq(schema.mentions.status, q.status));
    if (q.source) where.push(eq(schema.mentions.sourceId, q.source));
    if (q.sentiment) where.push(eq(schema.mentions.sentiment, q.sentiment));
    if (q.minIntent != null) where.push(gte(schema.mentions.intent, q.minIntent));
    if (q.q) where.push(or(ilike(schema.mentions.title, `%${q.q}%`), ilike(schema.mentions.snippet, `%${q.q}%`), ilike(schema.mentions.community, `%${q.q}%`)) as SQL);
    const order =
      q.sort === "intent"
        ? [desc(schema.mentions.intent), desc(schema.mentions.createdAt)]
        : q.sort === "published"
          ? [sql`${schema.mentions.publishedAt} desc nulls last`, desc(schema.mentions.createdAt)]
          : [desc(schema.mentions.createdAt), desc(schema.mentions.intent)];
    const [rows, [total]] = await Promise.all([
      dataDb.select().from(schema.mentions).where(and(...where)).orderBy(...order).limit(q.limit).offset(q.offset),
      dataDb.select({ n: sql<number>`count(*)::int` }).from(schema.mentions).where(and(...where)),
    ]);
    return { ok: true, data: { total: total?.n ?? 0, mentions: rows } };
  });

  app.post<{ Params: { projectId: string } }>("/projects/:projectId/mentions/status", async (request) => {
    const user = await requireUser(request);
    const project = await requireProject(user.id, request.params.projectId);
    const input = parse(z.object({ ids: z.array(z.string().uuid()).min(1).max(1000), status: mentionStatus }), request.body);
    const rows = await dataDb
      .update(schema.mentions)
      .set({ status: input.status, updatedAt: new Date() })
      .where(and(eq(schema.mentions.projectId, project.id), inArray(schema.mentions.id, input.ids)))
      .returning({ id: schema.mentions.id });
    return { ok: true, data: { updated: rows.length } };
  });

  /** Where a project's mentions or conversations come from, ranked: the communities worth being in. Free. */
  app.get<{ Params: { projectId: string }; Querystring: { kind?: string; monitorId?: string } }>("/projects/:projectId/communities", async (request) => {
    const user = await requireUser(request);
    const project = await requireProject(user.id, request.params.projectId);
    const q = parse(z.object({ kind: z.enum(["brand", "topic"]).optional(), monitorId: z.string().uuid().optional() }), request.query);
    const where: SQL[] = [eq(schema.mentions.projectId, project.id), eq(schema.mentions.relevant, true)];
    if (q.monitorId) where.push(eq(schema.mentions.monitorId, q.monitorId));
    if (q.kind) where.push(sql`${schema.mentions.monitorId} in (select id from monitors where kind = ${q.kind} and project_id = ${project.id})`);
    const rows = await dataDb.select().from(schema.mentions).where(and(...where)).orderBy(desc(schema.mentions.createdAt)).limit(5000);
    const communities = rankCommunities(
      rows.map((r) => ({
        url: r.url,
        sourceId: r.sourceId,
        title: r.title,
        snippet: r.snippet,
        community: r.community,
        author: r.author,
        publishedAt: r.publishedAt?.toISOString() ?? null,
        comments: r.comments,
        score: r.score,
        intent: r.intent,
        sentiment: r.sentiment,
        signals: r.signals,
      })),
    );
    return { ok: true, data: communities.slice(0, 50) };
  });
}
