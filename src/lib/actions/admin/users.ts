"use server";

import bcrypt from "bcryptjs";
import { requireOwner } from "@/lib/auth/dal";
import { first, newId, nowIso, run } from "@/lib/db";
import type { AdminUserRow } from "@/lib/models";
import { adminUserSchema, type AdminUserInput } from "@/lib/schemas/admin";
import type { ActionResult } from "@/lib/types";
import { idSchema, invalid, saveError } from "./shared";

const LAST_OWNER: ActionResult = { ok: false, message: "There must always be at least one owner. Make someone else an owner first." };

async function ownerCount(): Promise<number> {
  return (await first<{ n: number }>("SELECT COUNT(*) AS n FROM admin_users WHERE role = 'owner'"))?.n ?? 0;
}

/** Creates an admin (id null) or updates one. A new password or role signs that admin out everywhere. */
export async function saveUser(id: string | null, input: AdminUserInput): Promise<ActionResult> {
  await requireOwner();
  const parsed = adminUserSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const u = parsed.data;
  try {
    const now = nowIso();
    if (!id) {
      if (!u.password) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { password: ["Set a password for the new admin."] } };
      const created = newId();
      await run(
        "INSERT INTO admin_users (id, name, email, password_hash, role, token_version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)",
        [created, u.name, u.email, await bcrypt.hash(u.password, 12), u.role, now, now],
      );
      return { ok: true, id: created };
    }

    const before = await first<Pick<AdminUserRow, "id" | "role">>("SELECT id, role FROM admin_users WHERE id = ?", [idSchema.parse(id)]);
    if (!before) return { ok: false, message: "This admin no longer exists." };
    if (before.role === "owner" && u.role !== "owner" && (await ownerCount()) <= 1) return LAST_OWNER;

    const signOut = Boolean(u.password) || before.role !== u.role;
    if (u.password) {
      await run("UPDATE admin_users SET name = ?, email = ?, role = ?, password_hash = ?, token_version = token_version + 1, updated_at = ? WHERE id = ?", [
        u.name,
        u.email,
        u.role,
        await bcrypt.hash(u.password, 12),
        now,
        id,
      ]);
    } else {
      await run(`UPDATE admin_users SET name = ?, email = ?, role = ?, token_version = token_version + ?, updated_at = ? WHERE id = ?`, [
        u.name,
        u.email,
        u.role,
        signOut ? 1 : 0,
        now,
        id,
      ]);
    }
    return { ok: true, id };
  } catch (error: unknown) {
    return saveError(error, "save admin user", "email");
  }
}

export async function deleteUser(id: string): Promise<ActionResult> {
  const me = await requireOwner();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, message: "This admin no longer exists." };
  if (parsed.data === me.id) return { ok: false, message: "You cannot delete your own account." };
  try {
    const row = await first<Pick<AdminUserRow, "role">>("SELECT role FROM admin_users WHERE id = ?", [parsed.data]);
    if (!row) return { ok: true };
    if (row.role === "owner" && (await ownerCount()) <= 1) return LAST_OWNER;
    await run("DELETE FROM admin_users WHERE id = ?", [parsed.data]);
    return { ok: true };
  } catch (error: unknown) {
    return saveError(error, "delete admin user");
  }
}
