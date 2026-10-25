import { DEFAULT_CONVERSATION_SOURCES, DEFAULT_MENTION_SOURCES, RUNS_PER_MONTH, SOURCE_IDS } from "@openreach/shared";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { dataDb, schema } from "../db";
import type { MonitorKind } from "../db/data-schema";
import { notFound, runInProgress } from "../lib/errors";
import { AI_MIN_USD, aiBatches, aiScore, applyVerdicts, planSearches, runSearches, type SearchRequest } from "../lib/mention-search";
import { firstRunAt } from "../lib/pool";
import { errorMessage, getYep, isFatalForRun } from "../lib/yep";

type Monitor = typeof schema.monitors.$inferSelect;

export const monitorInput = z.object({
  kind: z.enum(["brand", "topic"]),
  name: z.string().trim().min(1).max(120).optional(),
  terms: z.array(z.string().trim().min(2).max(120)).min(1).max(5),
  excludes: z.array(z.string().trim().min(2).max(60)).max(20).default([]),
  competitors: z.array(z.string().trim().min(2).max(60)).max(5).default([]),
  sources: z.array(z.enum(SOURCE_IDS as [string, ...string[]])).min(1).max(SOURCE_IDS.length).optional(),
  depth: z.union([z.literal(10), z.literal(20)]).default(10),
  aiScoring: z.boolean().default(false),
  schedule: z.enum(["manual", "daily", "weekly", "monthly"]).default("daily"),
  active: z.boolean().default(true),
});

export type MonitorInput = z.infer<typeof monitorInput>;

/** How far back the first run looks; later runs look from the previous run, with a few days' overlap for Google's indexing delay. */
const FIRST_LOOKBACK_DAYS: Record<MonitorKind, number> = { brand: 30, topic: 90 };
const OVERLAP_DAYS = 3;

export const defaultSources = (kind: MonitorKind) => (kind === "brand" ? DEFAULT_MENTION_SOURCES : DEFAULT_CONVERSATION_SOURCES);

export function searchRequest(monitor: Pick<Monitor, "kind" | "terms" | "excludes" | "competitors" | "sources" | "depth" | "lastRunAt">, now = new Date()): SearchRequest {
  const lookback = monitor.lastRunAt ? new Date(monitor.lastRunAt.getTime() - OVERLAP_DAYS * 86_400_000) : new Date(now.getTime() - FIRST_LOOKBACK_DAYS[monitor.kind] * 86_400_000);
  return {
    mode: monitor.kind,
    terms: monitor.terms,
    excludes: monitor.excludes,
    competitors: monitor.competitors,
    sources: monitor.sources,
    depth: monitor.depth,
    phrasings: 3,
    since: lookback,
  };
}

/** Price of one run and of a month on the schedule. AI scoring is token-priced, so it adds a minimum and no maximum. */
export function estimateMonitor(monitor: Pick<Monitor, "kind" | "terms" | "excludes" | "competitors" | "sources" | "depth" | "aiScoring" | "schedule" | "lastRunAt">) {
  const plan = planSearches(searchRequest(monitor));
  const run = { min: plan.serpUsd + (monitor.aiScoring ? AI_MIN_USD : 0), max: monitor.aiScoring ? null : plan.serpUsdMax };
  const perMonth = RUNS_PER_MONTH[monitor.schedule];
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    searches: plan.searches.length,
    googleSearches: plan.serpSearches,
    freeSearches: plan.apiSearches,
    run: { min: round(run.min), max: run.max == null ? null : round(run.max) },
    month: { min: round(run.min * perMonth), max: run.max == null ? null : round(run.max * perMonth) },
  };
}

export async function requireMonitor(userId: string, monitorId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(monitorId)) throw notFound("Monitor");
  const [row] = await dataDb
    .select({ monitor: schema.monitors, project: schema.projects })
    .from(schema.monitors)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.monitors.projectId))
    .where(and(eq(schema.monitors.id, monitorId), eq(schema.projects.userId, userId)))
    .limit(1);
  if (!row) throw notFound("Monitor");
  return row;
}

export async function createMonitor(projectId: string, input: MonitorInput) {
  const [row] = await dataDb
    .insert(schema.monitors)
    .values({
      projectId,
      kind: input.kind,
      name: input.name || input.terms.join(", "),
      terms: input.terms,
      excludes: input.excludes,
      competitors: input.competitors,
      sources: input.sources ?? defaultSources(input.kind),
      depth: input.depth,
      aiScoring: input.aiScoring,
      schedule: input.schedule,
      active: input.active,
      nextRunAt: input.active ? firstRunAt(input.schedule) : null,
    })
    .returning();
  return row!;
}

export async function startMonitorRun(monitor: Monitor, userId: string, trigger: "manual" | "schedule") {
  const active = await dataDb
    .select({ id: schema.monitorRuns.id })
    .from(schema.monitorRuns)
    .where(and(eq(schema.monitorRuns.monitorId, monitor.id), inArray(schema.monitorRuns.status, ["queued", "running"])))
    .limit(1);
  if (active.length) throw runInProgress("This monitor is already running.");
  const plan = planSearches(searchRequest(monitor));
  const [run] = await dataDb
    .insert(schema.monitorRuns)
    .values({ monitorId: monitor.id, projectId: monitor.projectId, userId, trigger, searchesTotal: plan.searches.length })
    .returning();
  return run!;
}

export async function failMonitorRun(runId: string, message: string) {
  await dataDb
    .update(schema.monitorRuns)
    .set({ status: "failed", error: message, finishedAt: new Date() })
    .where(and(eq(schema.monitorRuns.id, runId), inArray(schema.monitorRuns.status, ["queued", "running"])));
}

/**
 * One monitor run: every source search for the terms since the last run, then (optionally) the AI
 * pass on pages not seen before, then new pages added to the feed. Pages seen again keep their
 * status and get fresh reply counts.
 */
export async function processMonitorRun(runId: string) {
  const [run] = await dataDb.select().from(schema.monitorRuns).where(eq(schema.monitorRuns.id, runId)).limit(1);
  if (!run || run.status !== "queued") return;
  const [claimed] = await dataDb
    .update(schema.monitorRuns)
    .set({ status: "running", startedAt: new Date(), heartbeatAt: new Date() })
    .where(and(eq(schema.monitorRuns.id, runId), eq(schema.monitorRuns.status, "queued")))
    .returning({ id: schema.monitorRuns.id });
  if (!claimed) return;
  const [row] = await dataDb
    .select({ monitor: schema.monitors, project: schema.projects })
    .from(schema.monitors)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.monitors.projectId))
    .where(eq(schema.monitors.id, run.monitorId))
    .limit(1);
  if (!row) return failMonitorRun(runId, "The monitor no longer exists");
  const { monitor, project } = row;

  let yep: Awaited<ReturnType<typeof getYep>>;
  try {
    yep = await getYep({ userId: run.userId, projectId: project.id, feature: monitor.kind === "brand" ? "mentions" : "conversations" });
  } catch (error) {
    return failMonitorRun(runId, errorMessage(error));
  }

  const startedAt = new Date();
  const request = searchRequest(monitor, startedAt);
  let cancelled = false;
  let lastCheck = 0;
  let costUsd = 0;
  const warnings: string[] = [];
  try {
    const outcome = await runSearches(yep, planSearches(request), request, {
      isFatal: isFatalForRun,
      shouldStop: () => cancelled,
      onProgress: async (done) => {
        // Progress and the cancel check, every few searches rather than after each one.
        if (done - lastCheck < 3 && done !== run.searchesTotal) return;
        lastCheck = done;
        const [current] = await dataDb
          .update(schema.monitorRuns)
          .set({ searchesDone: done, heartbeatAt: new Date() })
          .where(eq(schema.monitorRuns.id, runId))
          .returning({ status: schema.monitorRuns.status });
        if (current?.status !== "running") cancelled = true;
      },
    });
    costUsd += outcome.costUsd;
    warnings.push(...outcome.warnings);
    let found = outcome.mentions;

    const known = found.length
      ? new Set(
          (
            await dataDb
              .select({ url: schema.mentions.url })
              .from(schema.mentions)
              .where(and(eq(schema.mentions.monitorId, monitor.id), inArray(schema.mentions.url, found.map((m) => m.url))))
          ).map((m) => m.url),
        )
      : new Set<string>();
    const fresh = found.filter((m) => !known.has(m.url));
    const notes = new Map<string, string>();
    if (monitor.aiScoring && fresh.length && !cancelled) {
      const scoring = await aiScore(yep, fresh, { mode: monitor.kind, terms: monitor.terms, product: project.description });
      costUsd += scoring.costUsd;
      if (scoring.failed) warnings.push(`${scoring.failed} of ${aiBatches(fresh.length)} AI scoring batches failed.`);
      const scored = applyVerdicts(fresh, scoring.verdicts);
      const kept = new Set(scored.map((m) => m.url));
      for (const m of scored) if (m.aiNote) notes.set(m.url, m.aiNote);
      // Results the AI judged off-topic are not stored at all.
      found = [...found.filter((m) => known.has(m.url)), ...scored.filter((m) => kept.has(m.url))];
    }

    let added = 0;
    for (let i = 0; i < found.length; i += 200) {
      const batch = found.slice(i, i + 200);
      const rows = await dataDb
        .insert(schema.mentions)
        .values(
          batch.map((m) => ({
            monitorId: monitor.id,
            projectId: project.id,
            url: m.url,
            sourceId: m.sourceId,
            title: m.title.slice(0, 500),
            snippet: m.snippet.slice(0, 2000),
            community: m.community,
            author: m.author,
            publishedAt: m.publishedAt ? new Date(m.publishedAt) : null,
            comments: m.comments,
            score: m.score,
            intent: m.intent,
            sentiment: m.sentiment,
            signals: m.signals,
            aiNote: notes.get(m.url) ?? null,
            term: m.term ?? null,
            firstRunId: runId,
          })),
        )
        .onConflictDoUpdate({
          target: [schema.mentions.monitorId, schema.mentions.url],
          set: {
            comments: sql`coalesce(excluded.comments, ${schema.mentions.comments})`,
            score: sql`coalesce(excluded.score, ${schema.mentions.score})`,
            updatedAt: new Date(),
          },
        })
        .returning({ firstRunId: schema.mentions.firstRunId });
      added += rows.filter((r) => r.firstRunId === runId).length;
    }

    await dataDb.update(schema.monitors).set({ lastRunAt: startedAt }).where(eq(schema.monitors.id, monitor.id));
    await dataDb
      .update(schema.monitorRuns)
      .set({ status: cancelled ? "cancelled" : "completed", found: found.length, added, costUsd: Math.round(costUsd * 100) / 100, warnings: warnings.slice(0, 20), finishedAt: new Date() })
      .where(and(eq(schema.monitorRuns.id, runId), inArray(schema.monitorRuns.status, ["running", "cancelled"])));
  } catch (error) {
    const partial = (error as { partialCostUsd?: number }).partialCostUsd ?? 0;
    await dataDb
      .update(schema.monitorRuns)
      .set({ status: "failed", error: errorMessage(error), costUsd: Math.round((costUsd + partial) * 100) / 100, warnings: warnings.slice(0, 20), finishedAt: new Date() })
      .where(eq(schema.monitorRuns.id, runId));
  }
}
