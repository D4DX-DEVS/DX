import "server-only";
import { z } from "zod";
import { requireOwner } from "@/lib/auth/dal";
import { first } from "@/lib/db";
import { listQuerySchema, parseSearchParams, type Paginated, type SearchParamsRecord } from "@/lib/listing";
import type { AdminUserRow } from "@/lib/models";
import type { AdminUserInput } from "@/lib/schemas/admin";
import { listPage } from "../admin-query";

export const userListQuery = listQuerySchema({
  sort: ["name", "email", "lastLogin"],
  defaultSort: "name",
  defaultOrder: "asc",
  filters: { role: z.enum(["owner", "editor"]).optional().catch(undefined) },
});

export type UserListRow = Pick<AdminUserRow, "id" | "name" | "email" | "role" | "last_login_at">;

export async function listUsers(params: SearchParamsRecord): Promise<Paginated<UserListRow> & { selfId: string }> {
  const me = await requireOwner();
  const q = parseSearchParams(userListQuery, params);
  const page = await listPage<UserListRow>(
    {
      from: "admin_users",
      select: "id, name, email, role, last_login_at",
      search: ["name", "email"],
      sorts: { name: "name COLLATE NOCASE", email: "email", lastLogin: "last_login_at" },
      where: q.role ? [{ sql: "role = ?", params: [q.role] }] : [],
      tiebreak: "id",
    },
    q,
  );
  return { ...page, selfId: me.id };
}

export interface UserEdit {
  id: string;
  isSelf: boolean;
  lastLoginAt: string | null;
  values: AdminUserInput;
}

export async function getUserForEdit(id: string): Promise<UserEdit | null> {
  const me = await requireOwner();
  const r = await first<Pick<AdminUserRow, "id" | "name" | "email" | "role" | "last_login_at">>(
    "SELECT id, name, email, role, last_login_at FROM admin_users WHERE id = ?",
    [id],
  );
  if (!r) return null;
  return { id: r.id, isSelf: r.id === me.id, lastLoginAt: r.last_login_at, values: { name: r.name, email: r.email, role: r.role, password: "" } };
}
