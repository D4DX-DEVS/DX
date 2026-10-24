import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/dal";
import { first, nowIso, run } from "@/lib/db";
import { listQuerySchema, parseSearchParams, type Paginated, type SearchParamsRecord } from "@/lib/listing";
import type { InboxStatus, InquiryRow } from "@/lib/models";
import { INBOX_OPTIONS } from "@/lib/schemas/admin";
import { listPage } from "../admin-query";

export const inquiryListQuery = listQuerySchema({
  sort: ["received", "name"],
  defaultSort: "received",
  defaultOrder: "desc",
  filters: { status: z.enum(INBOX_OPTIONS).optional().catch(undefined) },
});

export type InquiryListRow = Pick<InquiryRow, "id" | "name" | "email" | "service" | "status" | "created_at"> & {
  /** The first part of the message, for the listing. */
  message: string;
};

export async function listInquiries(params: SearchParamsRecord): Promise<Paginated<InquiryListRow>> {
  await requireAdmin();
  const q = parseSearchParams(inquiryListQuery, params);
  return listPage<InquiryListRow>(
    {
      from: "inquiries",
      select: "id, name, email, service, status, created_at, substr(message, 1, 200) AS message",
      search: ["name", "email", "message"],
      sorts: { received: "created_at", name: "name COLLATE NOCASE" },
      where: q.status ? [{ sql: "status = ?", params: [q.status] }] : [],
      tiebreak: "id",
    },
    q,
  );
}

/** One inquiry. Opening a new one marks it read, since someone has now seen it. */
export async function getInquiry(id: string): Promise<InquiryRow | null> {
  await requireAdmin();
  const row = await first<InquiryRow>("SELECT * FROM inquiries WHERE id = ?", [id]);
  if (!row) return null;
  if (row.status === "new") {
    const now = nowIso();
    await run("UPDATE inquiries SET status = 'read', updated_at = ? WHERE id = ? AND status = 'new'", [now, id]);
    return { ...row, status: "read" as InboxStatus, updated_at: now };
  }
  return row;
}
