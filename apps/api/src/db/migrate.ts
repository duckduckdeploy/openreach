import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { env } from "../env";
import { dataDatabaseUrl, dataDb, dataPool, db, pool } from "./index";

/**
 * Brings both databases up to date:
 *  1. creates the project database when it does not exist yet (the role needs CREATEDB; otherwise
 *     create it yourself and set DATA_DATABASE_URL),
 *  2. migrates it, then the core database.
 */

// fileURLToPath, not URL.pathname: on Windows the pathname is "/C:/..." and does not resolve.
const folder = (name: string) => fileURLToPath(new URL(`../../${name}`, import.meta.url));

async function ensureDataDatabase() {
  // A database named in DATA_DATABASE_URL may be on another server: it is expected to exist.
  if (env.DATA_DATABASE_URL) return;
  const target = new URL(dataDatabaseUrl());
  const name = decodeURIComponent(target.pathname.replace(/^\//, ""));
  const client = new pg.Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  try {
    const { rowCount } = await client.query("select 1 from pg_database where datname = $1", [name]);
    if (!rowCount) {
      await client.query(`create database ${pg.escapeIdentifier(name)}`);
      console.log(`Created the project database "${name}".`);
    }
  } catch (error) {
    throw new Error(`Could not create the project database "${name}": ${(error as Error).message}. Create it, or set DATA_DATABASE_URL to one that exists.`);
  } finally {
    await client.end();
  }
}

await ensureDataDatabase();
await migrate(dataDb, { migrationsFolder: folder("drizzle-data") });
await migrate(db, { migrationsFolder: folder("drizzle") });
console.log("Migrations applied.");
await Promise.all([pool.end(), dataPool.end()]);
