import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/dal";
import { first, json } from "@/lib/db";
import { listQuerySchema, parseSearchParams, type Paginated, type SearchParamsRecord } from "@/lib/listing";
import type { JobRow } from "@/lib/models";
import type { JobInput } from "@/lib/schemas/admin";
import { listPage } from "../admin-query";

export const jobListQuery = listQuerySchema({
  sort: ["order", "title", "updated"],
  defaultSort: "order",
  defaultOrder: "asc",
  filters: {
    open: z.enum(["open", "closed"]).optional().catch(undefined),
  },
});

export interface JobListRow {
  id: string;
  title: string;
  slug: string;
  level: string;
  location: string;
  open: 0 | 1;
  sort_order: number;
  updated_at: string;
}

export async function listJobs(params: SearchParamsRecord): Promise<Paginated<JobListRow>> {
  await requireAdmin();
  const q = parseSearchParams(jobListQuery, params);
  const where = [];
  if (q.open) where.push({ sql: "open = ?", params: [q.open === "open" ? 1 : 0] });
  return listPage<JobListRow>(
    {
      from: "jobs",
      select: "id, title, slug, level, location, open, sort_order, updated_at",
      search: ["title", "slug", "level", "location"],
      sorts: { order: "sort_order", title: "title COLLATE NOCASE", updated: "updated_at" },
      where,
      tiebreak: "id",
    },
    q,
  );
}

export interface JobEdit {
  id: string;
  values: JobInput;
}

export async function getJobForEdit(id: string): Promise<JobEdit | null> {
  await requireAdmin();
  const r = await first<JobRow>("SELECT * FROM jobs WHERE id = ?", [id]);
  if (!r) return null;
  return {
    id: r.id,
    values: {
      title: r.title,
      slug: r.slug,
      level: r.level,
      experience: r.experience,
      location: r.location,
      summary: r.summary,
      requirements: json<string[]>(r.requirements, []),
      open: r.open === 1,
      order: r.sort_order,
    },
  };
}
