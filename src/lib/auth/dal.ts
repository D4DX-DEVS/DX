import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { first } from "@/lib/db";
import type { AdminUserRow } from "@/lib/models";
import { readSession } from "./session";

export interface AdminIdentity {
  id: string;
  name: string;
  email: string;
  role: "owner" | "editor";
}

/**
 * The data access layer's one gate. Verifies the cookie, then confirms the account still
 * exists and the token has not been revoked (password change bumps tokenVersion).
 * Deduplicated per request with React.cache, so several components can call it freely.
 */
export const getAdmin = cache(async (): Promise<AdminIdentity | null> => {
  const session = await readSession();
  if (!session) return null;
  const user = await first<Pick<AdminUserRow, "id" | "name" | "email" | "role" | "token_version">>(
    "SELECT id, name, email, role, token_version FROM admin_users WHERE id = ?",
    [session.sub],
  );
  if (!user || user.token_version !== session.v) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role === "owner" ? "owner" : "editor" };
});

export async function requireAdmin(): Promise<AdminIdentity> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function requireOwner(): Promise<AdminIdentity> {
  const admin = await requireAdmin();
  if (admin.role !== "owner") redirect("/admin");
  return admin;
}
