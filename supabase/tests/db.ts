/**
 * Test helpers for running SQL as real Supabase roles against the local stack
 * (`pnpm db:start`). Each helper opens its own connection so tests can also
 * exercise concurrency.
 */
import { randomUUID } from "node:crypto";

import pg from "pg";

export const DB_URL =
  process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

export const pool = new pg.Pool({ connectionString: DB_URL, max: 8 });

/** True when the local Supabase database is reachable — DB suites skip otherwise. */
export async function dbAvailable(): Promise<boolean> {
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch {
    return false;
  }
}

/** Insert an auth user as the service role (fires the profile trigger). */
export async function createUser(): Promise<string> {
  const id = randomUUID();
  await pool.query(
    `insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
     values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, now(), '{}', '{}', now(), now())`,
    [id, `player-${id.slice(0, 8)}@example.com`],
  );
  return id;
}

export async function deleteUsers(ids: string[]): Promise<void> {
  if (ids.length) await pool.query("delete from auth.users where id = any($1::uuid[])", [ids]);
}

/**
 * Run `fn` inside a transaction as `authenticated` with the user's JWT claims — exactly
 * what PostgREST does per request. Commits on success so later assertions can see it.
 */
export async function asUser<T>(
  userId: string | null,
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`set local role ${userId ? "authenticated" : "anon"}`);
    await client.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify(userId ? { sub: userId, role: "authenticated" } : { role: "anon" }),
    ]);
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export const APPEARANCE = {
  version: 1,
  base: "adventurer",
  skinTone: "a",
  hair: { style: "short", color: "brown" },
  outfit: { style: "hoodie", color: "royal" },
  accessory: null,
};
