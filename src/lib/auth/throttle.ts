import "server-only";
import { createHash } from "node:crypto";
import { batch, run } from "@/lib/db";

export interface ThrottleRule {
  limit: number;
  windowSeconds: number;
}

export const LOGIN_RULE: ThrottleRule = { limit: 5, windowSeconds: 15 * 60 };
export const FORM_RULE: ThrottleRule = { limit: 5, windowSeconds: 10 * 60 };

function hashKey(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

/**
 * Counts one attempt for this key inside a fixed window; an expired window restarts at 1.
 * Returns false once the limit is exceeded. Keys are hashed so no raw email/IP is stored.
 */
export async function hit(scope: string, parts: string[], rule: ThrottleRule): Promise<boolean> {
  const key = `${scope}:${hashKey(parts)}`;
  const now = Date.now();
  const expiresAt = now + rule.windowSeconds * 1000;
  const [, rows] = await batch<{ count: number }>([
    // Reap old windows in the same round trip (SQLite has no TTL index).
    { sql: "DELETE FROM login_attempts WHERE expires_at <= ? AND key <> ?", params: [now, key] },
    {
      sql: `INSERT INTO login_attempts (key, count, expires_at) VALUES (?, 1, ?)
            ON CONFLICT (key) DO UPDATE SET
              count = CASE WHEN expires_at > ? THEN count + 1 ELSE 1 END,
              expires_at = CASE WHEN expires_at > ? THEN expires_at ELSE excluded.expires_at END
            RETURNING count`,
      params: [key, expiresAt, now, now],
    },
  ]);
  return (rows[0]?.count ?? 1) <= rule.limit;
}

export async function clearHits(scope: string, parts: string[]): Promise<void> {
  await run("DELETE FROM login_attempts WHERE key = ?", [`${scope}:${hashKey(parts)}`]);
}
