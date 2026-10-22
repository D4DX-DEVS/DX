"use server";

import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth/dal";
import { createSessionCookie } from "@/lib/auth/session";
import { LOGIN_RULE, clearHits, hit } from "@/lib/auth/throttle";
import { SESSION_TTL_SHORT } from "@/lib/auth/token";
import { first, nowIso, run } from "@/lib/db";
import type { AdminUserRow } from "@/lib/models";
import { accountSchema, type AccountInput } from "@/lib/schemas/admin";
import type { ActionResult } from "@/lib/types";
import { invalid, saveError } from "./shared";

/**
 * Updates the signed-in admin's name and, optionally, password. A new password signs out every
 * other session (token_version bump) and re-issues this browser's cookie so it stays signed in.
 */
export async function saveAccount(input: AccountInput): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { name, currentPassword, newPassword } = parsed.data;
  try {
    const now = nowIso();
    if (!newPassword) {
      await run("UPDATE admin_users SET name = ?, updated_at = ? WHERE id = ?", [name, now, admin.id]);
      return { ok: true };
    }
    // Same limit as sign-in, so a stolen session cannot be used to guess the password.
    if (!(await hit("account-password", [admin.id], LOGIN_RULE))) return { ok: false, message: "Too many attempts. Wait 15 minutes, then try again." };
    const row = await first<Pick<AdminUserRow, "password_hash" | "token_version">>("SELECT password_hash, token_version FROM admin_users WHERE id = ?", [admin.id]);
    if (!row) return { ok: false, message: "Your account no longer exists." };
    if (!(await bcrypt.compare(currentPassword, row.password_hash))) {
      return { ok: false, message: "Your current password is not correct.", fieldErrors: { currentPassword: ["Your current password is not correct."] } };
    }
    await clearHits("account-password", [admin.id]);
    const version = row.token_version + 1;
    await run("UPDATE admin_users SET name = ?, password_hash = ?, token_version = ?, updated_at = ? WHERE id = ?", [
      name,
      await bcrypt.hash(newPassword, 12),
      version,
      now,
      admin.id,
    ]);
    await createSessionCookie({ sub: admin.id, role: admin.role, v: version }, SESSION_TTL_SHORT);
    return { ok: true, message: "Password changed. Other devices have been signed out." };
  } catch (error: unknown) {
    return saveError(error, "save account");
  }
}
