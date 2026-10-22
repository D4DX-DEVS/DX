import "server-only";
import { requireAdmin } from "@/lib/auth/dal";
import { first } from "@/lib/db";
import type { AdminUserRow } from "@/lib/models";

export interface AccountView {
  name: string;
  email: string;
  role: "owner" | "editor";
  lastLoginAt: string | null;
}

export async function getAccount(): Promise<AccountView> {
  const admin = await requireAdmin();
  const row = await first<Pick<AdminUserRow, "last_login_at">>("SELECT last_login_at FROM admin_users WHERE id = ?", [admin.id]);
  return { name: admin.name, email: admin.email, role: admin.role, lastLoginAt: row?.last_login_at ?? null };
}
