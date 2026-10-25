import type { FastifyBaseLogger } from "fastify";
import { PgBoss } from "pg-boss";
import { env } from "../env";

export type JobMap = {
  "leads.run": { searchId: string };
  "monitor.run": { runId: string };
  "scheduler.tick": Record<string, never>;
  "maintenance.cleanup": Record<string, never>;
};

type Handler<K extends keyof JobMap> = (data: JobMap[K], log: FastifyBaseLogger) => Promise<void>;

const handlers: { [K in keyof JobMap]?: { handler: Handler<K>; concurrency: number } } = {};

export function defineJob<K extends keyof JobMap>(name: K, concurrency: number, handler: Handler<K>) {
  handlers[name] = { handler, concurrency } as never;
}

let boss: PgBoss | null = null;

function getBoss(): PgBoss {
  boss ??= new PgBoss({ connectionString: env.DATABASE_URL, schema: "pgboss" });
  return boss;
}

let started: Promise<void> | null = null;

async function ensureStarted() {
  started ??= (async () => {
    const b = getBoss();
    b.on("error", (error) => console.error("pg-boss error", error));
    await b.start();
    for (const name of Object.keys(QUEUES)) await b.createQueue(name);
  })();
  await started;
}

const QUEUES: Record<keyof JobMap, true> = {
  "leads.run": true,
  "monitor.run": true,
  "scheduler.tick": true,
  "maintenance.cleanup": true,
};

// Jobs can be enqueued by the HTTP server even when the worker runs elsewhere.
export async function enqueue<K extends keyof JobMap>(name: K, data: JobMap[K]): Promise<void> {
  await ensureStarted();
  // Long runs manage their own state rows; a crashed job is not blindly re-run.
  await getBoss().send(name, data, { retryLimit: 0, expireInSeconds: 60 * 60 * 6 });
}

export async function startWorker(log: FastifyBaseLogger) {
  // Importing the job modules registers their handlers.
  await import("./leads");
  await import("./monitors");
  await import("./scheduler");

  await ensureStarted();
  const b = getBoss();
  for (const [name, entry] of Object.entries(handlers)) {
    if (!entry) continue;
    await b.work(name, { localConcurrency: entry.concurrency }, async (jobs) => {
      for (const job of jobs) {
        try {
          await (entry.handler as Handler<never>)(job.data as never, log);
        } catch (error) {
          log.error({ err: error, job: name }, "job failed");
          throw error;
        }
      }
    });
  }
  await b.schedule("scheduler.tick", "*/5 * * * *");
  await b.schedule("maintenance.cleanup", "*/15 * * * *");
  log.info("worker started");
}

export async function stopWorker() {
  if (boss) await boss.stop({ graceful: true, timeout: 20_000 }).catch(() => {});
}
