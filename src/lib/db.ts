import "server-only";
import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Cloudflare D1 over its HTTP API (the site runs on Node, outside a Worker binding).
 * Every call is one HTTPS request, so pages read through "use cache" functions.
 */

type SqlParam = string | number | boolean | null | undefined | Date | object;

export interface Statement {
  sql: string;
  params?: SqlParam[];
}

interface D1Result<T> {
  results: T[];
  success: boolean;
  meta?: { changes?: number; duration?: number; last_row_id?: number };
}

interface D1Response<T> {
  success: boolean;
  errors: { code: number; message: string }[];
  result: D1Result<T>[];
}

export class DatabaseError extends Error {}

/** Booleans become 0/1, dates ISO text, objects and arrays JSON; undefined is NULL. */
function toSql(value: SqlParam): string | number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

const RETRYABLE = new Set([429, 502, 503, 504]);

async function request<T>(body: object, attempt = 0): Promise<D1Result<T>[]> {
  const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, D1_DATABASE_ID } = env();
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error: unknown) {
    logger.error("D1 request failed", error);
    throw new DatabaseError("Database unavailable");
  }
  // These statuses mean the request was not run, so a retry cannot apply a write twice.
  if (RETRYABLE.has(res.status) && attempt < 2) {
    await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** attempt));
    return request<T>(body, attempt + 1);
  }
  const json = (await res.json().catch(() => null)) as D1Response<T> | null;
  if (!res.ok || !json?.success) {
    const message = json?.errors?.map((e) => e.message).join("; ") || `HTTP ${res.status}`;
    logger.error("D1 query failed", message);
    throw new DatabaseError(message);
  }
  return json.result;
}

function payload(statement: Statement): { sql: string; params: (string | number | null)[] } {
  if (env().DEBUG_DB === "1") logger.debug(`d1 ${statement.sql}`, statement.params ?? []);
  return { sql: statement.sql, params: (statement.params ?? []).map(toSql) };
}

export async function all<T>(sql: string, params: SqlParam[] = []): Promise<T[]> {
  const [result] = await request<T>(payload({ sql, params }));
  return result?.results ?? [];
}

export async function first<T>(sql: string, params: SqlParam[] = []): Promise<T | null> {
  const rows = await all<T>(sql, params);
  return rows[0] ?? null;
}

export async function run(sql: string, params: SqlParam[] = []): Promise<{ changes: number }> {
  const [result] = await request(payload({ sql, params }));
  return { changes: result?.meta?.changes ?? 0 };
}

/** Several statements in one round trip, run in order. Returns each statement's rows. */
export async function batch<T = Record<string, unknown>>(statements: Statement[]): Promise<T[][]> {
  if (statements.length === 0) return [];
  const results = await request<T>({ batch: statements.map(payload) });
  return results.map((r) => r.results ?? []);
}

/** Parses a JSON text column, falling back when it is empty or malformed. */
export function json<T>(text: string | null | undefined, fallback: T): T {
  if (!text) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
