import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/dal";
import { all, first, json } from "@/lib/db";
import { listQuerySchema, parseSearchParams, type Paginated, type SearchParamsRecord } from "@/lib/listing";
import type { ServiceRow } from "@/lib/models";
import type { ServiceInput } from "@/lib/schemas/admin";
import { listPage } from "../admin-query";

export const serviceListQuery = listQuerySchema({
  sort: ["order", "title", "updated"],
  defaultSort: "order",
  defaultOrder: "asc",
  filters: { visibility: z.enum(["visible", "hidden"]).optional().catch(undefined) },
});

export interface ServiceListRow {
  id: string;
  title: string;
  slug: string;
  published: 0 | 1;
  sort_order: number;
  updated_at: string;
  proof_project: string | null;
}

export async function listServices(params: SearchParamsRecord): Promise<Paginated<ServiceListRow>> {
  await requireAdmin();
  const q = parseSearchParams(serviceListQuery, params);
  const where = q.visibility ? [{ sql: "s.published = ?", params: [q.visibility === "visible" ? 1 : 0] }] : [];
  return listPage<ServiceListRow>(
    {
      from: "services s LEFT JOIN projects p ON p.slug = s.proof_project_slug",
      select: "s.id, s.title, s.slug, s.published, s.sort_order, s.updated_at, p.title AS proof_project",
      search: ["s.title", "s.slug", "s.summary"],
      sorts: { order: "s.sort_order", title: "s.title COLLATE NOCASE", updated: "s.updated_at" },
      where,
      tiebreak: "s.id",
    },
    q,
  );
}

export interface ProjectSlugOption {
  value: string;
  label: string;
}

/** Projects a service or testimonial can point at, by slug. Drafts are left out when only live pages make sense. */
export async function getProjectSlugOptions(publishedOnly: boolean): Promise<ProjectSlugOption[]> {
  await requireAdmin();
  const rows = await all<{ slug: string; title: string; status: string }>(
    `SELECT slug, title, status FROM projects ${publishedOnly ? "WHERE status = 'published'" : ""} ORDER BY sort_order, title`,
  );
  return rows.map((r) => ({ value: r.slug, label: r.status === "draft" ? `${r.title} (draft)` : r.title }));
}

export interface ServiceEdit {
  id: string;
  values: ServiceInput;
}

export async function getServiceForEdit(id: string): Promise<ServiceEdit | null> {
  await requireAdmin();
  const r = await first<ServiceRow>("SELECT * FROM services WHERE id = ?", [id]);
  if (!r) return null;
  return {
    id: r.id,
    values: {
      title: r.title,
      slug: r.slug,
      summary: r.summary,
      proof: r.proof,
      points: json<string[]>(r.points, []),
      proofProjectSlug: r.proof_project_slug,
      published: r.published === 1,
      order: r.sort_order,
    },
  };
}
