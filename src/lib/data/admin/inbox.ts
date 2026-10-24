import "server-only";
import { requireAdmin } from "@/lib/auth/dal";
import { batch } from "@/lib/db";

export interface StatusCounts {
  all: number;
  new: number;
  read: number;
  archived: number;
}

/** How many rows of an inbox table sit in each status, for the status tabs above its listing. */
export async function getStatusCounts(table: "inquiries" | "applications"): Promise<StatusCounts> {
  await requireAdmin();
  const [rows] = await batch([{ sql: `SELECT status, COUNT(*) AS n FROM ${table} GROUP BY status` }]);
  const counts: StatusCounts = { all: 0, new: 0, read: 0, archived: 0 };
  for (const row of rows as unknown as { status: string; n: number }[]) {
    const n = Number(row.n);
    counts.all += n;
    if (row.status === "new" || row.status === "read" || row.status === "archived") counts[row.status] = n;
  }
  return counts;
}

export interface NavBadges {
  inquiries: number;
  applications: number;
}

/** The unread counts shown beside Inquiries and Applications in the sidebar. */
export async function getNavBadges(): Promise<NavBadges> {
  await requireAdmin();
  const [rows] = await batch([
    {
      sql: `SELECT
              (SELECT COUNT(*) FROM inquiries WHERE status = 'new') AS inquiries,
              (SELECT COUNT(*) FROM applications WHERE status = 'new') AS applications`,
    },
  ]);
  const row = rows[0] as unknown as { inquiries?: number; applications?: number } | undefined;
  return { inquiries: Number(row?.inquiries ?? 0), applications: Number(row?.applications ?? 0) };
}
