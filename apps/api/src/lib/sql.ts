import { sql, type SQL } from "drizzle-orm";

/**
 * A text[] value for raw SQL. Interpolating a JS array into drizzle's sql template expands it
 * into a parameter list ("($1, $2)"), which Postgres cannot cast to an array.
 */
export function textArray(values: string[]): SQL {
  return values.length ? sql`ARRAY[${sql.join(values.map((value) => sql`${value}`), sql`, `)}]::text[]` : sql`'{}'::text[]`;
}
