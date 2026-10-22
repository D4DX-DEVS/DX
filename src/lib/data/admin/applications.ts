import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/dal";
import { all, first, json, nowIso, run } from "@/lib/db";
import { listQuerySchema, parseSearchParams, type Paginated, type SearchParamsRecord } from "@/lib/listing";
import type { ApplicationRow, InboxStatus, ResumeDoc } from "@/lib/models";
import { INBOX_OPTIONS } from "@/lib/schemas/admin";
import { listPage } from "../admin-query";

export const applicationListQuery = listQuerySchema({
  sort: ["received", "name", "position"],
  defaultSort: "received",
  defaultOrder: "desc",
  filters: {
    status: z.enum(INBOX_OPTIONS).optional().catch(undefined),
    position: z.string().trim().max(100).optional().catch(undefined),
  },
});

export type ApplicationListRow = Pick<ApplicationRow, "id" | "name" | "email" | "position" | "experience" | "status" | "created_at">;

export async function listApplications(params: SearchParamsRecord): Promise<Paginated<ApplicationListRow>> {
  await requireAdmin();
  const q = parseSearchParams(applicationListQuery, params);
  const where = [];
  if (q.status) where.push({ sql: "status = ?", params: [q.status] });
  if (q.position) where.push({ sql: "position = ?", params: [q.position] });
  return listPage<ApplicationListRow>(
    {
      from: "applications",
      select: "id, name, email, position, experience, status, created_at",
      search: ["name", "email", "position", "message"],
      sorts: { received: "created_at", name: "name COLLATE NOCASE", position: "position COLLATE NOCASE" },
      where,
      tiebreak: "id",
    },
    q,
  );
}

/** Positions people have applied for, for the filter. */
export async function getApplicationPositions(): Promise<{ value: string; label: string }[]> {
  await requireAdmin();
  const rows = await all<{ position: string }>("SELECT DISTINCT position FROM applications ORDER BY position COLLATE NOCASE");
  return rows.map((r) => ({ value: r.position, label: r.position }));
}

export interface ApplicationDetail extends Omit<ApplicationRow, "resume"> {
  resume: ResumeDoc;
}

/** One application. Opening a new one marks it read, since someone has now seen it. */
export async function getApplication(id: string): Promise<ApplicationDetail | null> {
  await requireAdmin();
  const row = await first<ApplicationRow>("SELECT * FROM applications WHERE id = ?", [id]);
  if (!row) return null;
  const detail: ApplicationDetail = { ...row, resume: json<ResumeDoc>(row.resume, { file: "", name: "", size: 0 }) };
  if (row.status === "new") {
    const now = nowIso();
    await run("UPDATE applications SET status = 'read', updated_at = ? WHERE id = ? AND status = 'new'", [now, id]);
    return { ...detail, status: "read" as InboxStatus, updated_at: now };
  }
  return detail;
}
