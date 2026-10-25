import { and, eq, isNotNull, lt, lte, ne, or, sql } from "drizzle-orm";
import { dataDb, schema } from "../db";
import { nextRunAfter } from "../lib/pool";
import { AppError, isRunInProgress } from "../lib/errors";
import { cleanupOAuth } from "../services/oauth";
import { failMonitorRun, startMonitorRun } from "../services/monitors";
import { dispatch } from "./dispatch";
import { defineJob } from "./queue";

// How soon a schedule is retried when its monitor already has a run going, or the queue could not take the run.
const RETRY_MS = 15 * 60_000;

const retrySoon = (error: unknown) => isRunInProgress(error) || (error instanceof AppError && error.code === "queue_unavailable");

// Runs every five minutes. Claims due monitors by moving next_run_at forward in the same
// statement that selects them, so two workers never start the same run. next_run_at advances
// from its own previous value in whole periods, so a late tick does not shift the schedule.
// Manual runs leave the schedule alone.
defineJob("scheduler.tick", 1, async (_data, log) => {
  const now = new Date();
  const due = await dataDb
    .select({ monitor: schema.monitors, project: schema.projects })
    .from(schema.monitors)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.monitors.projectId))
    .where(and(eq(schema.monitors.active, true), isNotNull(schema.monitors.nextRunAt), lte(schema.monitors.nextRunAt, now), ne(schema.monitors.schedule, "manual")))
    .limit(200);
  for (const { monitor, project } of due) {
    const claimed = await dataDb
      .update(schema.monitors)
      // A monthly schedule's day is the day it was set up.
      .set({ nextRunAt: nextRunAfter(monitor.schedule, monitor.nextRunAt ?? now, now, monitor.createdAt.getUTCDate()) })
      .where(and(eq(schema.monitors.id, monitor.id), lte(schema.monitors.nextRunAt, now)))
      .returning({ id: schema.monitors.id });
    if (!claimed.length) continue;
    try {
      const run = await startMonitorRun(monitor, project.userId, "schedule");
      await dispatch("monitor.run", { runId: run.id }, (message) => failMonitorRun(run.id, message));
    } catch (error) {
      // A run already in progress (often a manual one) or a queue outage: try again shortly
      // rather than skipping a whole period.
      if (retrySoon(error)) {
        await dataDb.update(schema.monitors).set({ nextRunAt: new Date(now.getTime() + RETRY_MS) }).where(eq(schema.monitors.id, monitor.id));
      }
      log.info({ monitorId: monitor.id, reason: (error as Error).message }, "scheduled monitor run not started");
    }
  }
});

/**
 * Every 15 minutes: drop expired cache rows and fail runs a crashed worker abandoned, so they
 * stop blocking their monitor or the user's lead-search allowance. A running run is abandoned when
 * its heartbeat (touched every few searches) has been quiet for 30 minutes; a queued one when no
 * worker has picked it up in 6 hours. Long but live runs are left alone.
 */
defineJob("maintenance.cleanup", 1, async () => {
  await dataDb.delete(schema.apiCache).where(lt(schema.apiCache.expiresAt, new Date()));
  await cleanupOAuth();
  const abandoned = { status: "failed" as const, error: "Interrupted before it finished", finishedAt: new Date() };
  for (const table of [schema.monitorRuns, schema.leadSearches] as const) {
    await dataDb
      .update(table)
      .set(abandoned)
      .where(
        or(
          and(eq(table.status, "queued"), lt(table.createdAt, sql`now() - interval '6 hours'`)),
          and(eq(table.status, "running"), lt(sql`coalesce(${table.heartbeatAt}, ${table.createdAt})`, sql`now() - interval '30 minutes'`)),
        ),
      );
  }
});
