"use client";

import { SortableList, type SortRow } from "@/components/admin/sortable-list";
import { reorderJobs } from "@/lib/actions/admin/jobs";

/** The positions in the order the Join Our Team page lists them. */
export function JobSorter({ rows }: { rows: SortRow[] }) {
  return <SortableList rows={rows} onSave={reorderJobs} label="Positions in site order" />;
}
