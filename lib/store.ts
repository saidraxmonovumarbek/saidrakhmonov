import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Where the site keeps what changes while it is live: your edits and the
 * visitor count.
 *
 * - In production it is a Neon Postgres database. Connect one in Vercel
 *   (Storage → Neon) and it sets DATABASE_URL for you. The tables are
 *   created on first use.
 * - Without DATABASE_URL (e.g. `npm run dev` on your laptop) it falls back to
 *   a JSON file in `.data/`, so everything works locally with no setup.
 */

const URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

export const hasDatabase = () => Boolean(URL);

/** True where the fallback file can't be written (a deployed site without a database). */
const readOnlyHost = () => !URL && Boolean(process.env.VERCEL);

// ---------------------------------------------------------------------------
// Postgres

let sql: NeonQueryFunction<false, false> | null = null;
let ready: Promise<void> | null = null;

function db() {
  sql ??= neon(URL);
  ready ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS site_content (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS site_visitors (
      id text PRIMARY KEY,
      first_seen timestamptz NOT NULL DEFAULT now(),
      last_seen timestamptz NOT NULL DEFAULT now(),
      visits integer NOT NULL DEFAULT 1
    )`;
  })().catch((error) => {
    ready = null; // try again on the next call
    throw error;
  });
  return { sql, ready };
}

// ---------------------------------------------------------------------------
// Local file

type LocalData = { content: Record<string, unknown>; visitors: Record<string, number> };
const FILE = path.join(process.cwd(), ".data", "store.json");

async function readLocal(): Promise<LocalData> {
  try {
    const data = JSON.parse(await fs.readFile(FILE, "utf8")) as Partial<LocalData>;
    return { content: data.content ?? {}, visitors: data.visitors ?? {} };
  } catch {
    return { content: {}, visitors: {} };
  }
}

async function writeLocal(data: LocalData) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------------
// Content

/** Every saved content section, by key. Sections you never edited are absent. */
export async function readContent(): Promise<Record<string, unknown>> {
  if (!URL) return (await readLocal()).content;
  const { sql, ready } = db();
  await ready;
  const rows = (await sql`SELECT key, value FROM site_content`) as { key: string; value: unknown }[];
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function writeContent(key: string, value: unknown) {
  if (readOnlyHost()) throw new Error("NO_DATABASE");
  if (!URL) {
    const data = await readLocal();
    data.content[key] = value;
    return writeLocal(data);
  }
  const { sql, ready } = db();
  await ready;
  await sql`INSERT INTO site_content (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
}

export async function deleteContent(key: string) {
  if (readOnlyHost()) throw new Error("NO_DATABASE");
  if (!URL) {
    const data = await readLocal();
    delete data.content[key];
    return writeLocal(data);
  }
  const { sql, ready } = db();
  await ready;
  await sql`DELETE FROM site_content WHERE key = ${key}`;
}

// ---------------------------------------------------------------------------
// Visitors

/** Record a visit from an anonymous browser id (when given) and return the number of unique visitors. */
export async function countVisitor(id: string | null): Promise<number> {
  if (!URL) {
    if (readOnlyHost()) return 0;
    const data = await readLocal();
    if (id) {
      data.visitors[id] = (data.visitors[id] ?? 0) + 1;
      await writeLocal(data);
    }
    return Object.keys(data.visitors).length;
  }
  const { sql, ready } = db();
  await ready;
  if (id) {
    await sql`INSERT INTO site_visitors (id) VALUES (${id})
      ON CONFLICT (id) DO UPDATE SET last_seen = now(), visits = site_visitors.visits + 1`;
  }
  const [row] = (await sql`SELECT count(*)::int AS n FROM site_visitors`) as { n: number }[];
  return row?.n ?? 0;
}

/** Numbers for the admin dashboard. */
export async function visitorStats(): Promise<{ unique: number; visits: number; today: number; week: number }> {
  if (!URL) {
    const { visitors } = await readLocal();
    const counts = Object.values(visitors);
    return { unique: counts.length, visits: counts.reduce((a, b) => a + b, 0), today: 0, week: 0 };
  }
  const { sql, ready } = db();
  await ready;
  const [row] = (await sql`SELECT
      count(*)::int AS unique,
      coalesce(sum(visits), 0)::int AS visits,
      count(*) FILTER (WHERE last_seen > now() - interval '1 day')::int AS today,
      count(*) FILTER (WHERE last_seen > now() - interval '7 days')::int AS week
    FROM site_visitors`) as { unique: number; visits: number; today: number; week: number }[];
  return row;
}
