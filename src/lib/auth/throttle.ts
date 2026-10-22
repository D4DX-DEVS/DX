import "server-only";
import { createHash } from "node:crypto";
import { connectDB } from "@/lib/db";
import { LoginAttempt } from "@/lib/models";

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
 * Counts one attempt for this key inside a fixed window (TTL index cleans up).
 * Returns false once the limit is exceeded. Keys are hashed so no raw email/IP is stored.
 */
export async function hit(scope: string, parts: string[], rule: ThrottleRule): Promise<boolean> {
  await connectDB();
  const key = `${scope}:${hashKey(parts)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + rule.windowSeconds * 1000);
  const doc = await LoginAttempt.findOneAndUpdate(
    { key, expiresAt: { $gt: now } },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
    { upsert: true, new: true, projection: { count: 1 } },
  ).catch(async (error: unknown) => {
    // A stale (expired, not yet reaped) doc with the same key makes the upsert collide: reset it.
    if (error instanceof Error && "code" in error && (error as { code?: number }).code === 11000) {
      return LoginAttempt.findOneAndUpdate({ key }, { $set: { count: 1, expiresAt } }, { new: true, projection: { count: 1 } });
    }
    throw error;
  });
  return (doc?.count ?? 1) <= rule.limit;
}

export async function clearHits(scope: string, parts: string[]): Promise<void> {
  await connectDB();
  await LoginAttempt.deleteOne({ key: `${scope}:${hashKey(parts)}` });
}
