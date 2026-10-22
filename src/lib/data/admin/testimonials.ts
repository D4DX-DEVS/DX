import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/dal";
import { first } from "@/lib/db";
import { listQuerySchema, parseSearchParams, type Paginated, type SearchParamsRecord } from "@/lib/listing";
import type { TestimonialRow } from "@/lib/models";
import type { TestimonialInput } from "@/lib/schemas/admin";
import { listPage } from "../admin-query";

export const testimonialListQuery = listQuerySchema({
  sort: ["order", "name", "updated"],
  defaultSort: "order",
  defaultOrder: "asc",
  filters: { visibility: z.enum(["visible", "hidden"]).optional().catch(undefined) },
});

export interface TestimonialListRow {
  id: string;
  quote: string;
  name: string;
  role: string;
  published: 0 | 1;
  sort_order: number;
  updated_at: string;
  project: string | null;
}

export async function listTestimonials(params: SearchParamsRecord): Promise<Paginated<TestimonialListRow>> {
  await requireAdmin();
  const q = parseSearchParams(testimonialListQuery, params);
  const where = q.visibility ? [{ sql: "t.published = ?", params: [q.visibility === "visible" ? 1 : 0] }] : [];
  return listPage<TestimonialListRow>(
    {
      from: "testimonials t LEFT JOIN projects p ON p.slug = t.project_slug",
      select: "t.id, t.quote, t.name, t.role, t.published, t.sort_order, t.updated_at, p.title AS project",
      search: ["t.quote", "t.name", "t.role"],
      sorts: { order: "t.sort_order", name: "t.name COLLATE NOCASE", updated: "t.updated_at" },
      where,
      tiebreak: "t.id",
    },
    q,
  );
}

export interface TestimonialEdit {
  id: string;
  values: TestimonialInput;
}

export async function getTestimonialForEdit(id: string): Promise<TestimonialEdit | null> {
  await requireAdmin();
  const r = await first<TestimonialRow>("SELECT * FROM testimonials WHERE id = ?", [id]);
  if (!r) return null;
  return {
    id: r.id,
    values: {
      quote: r.quote,
      name: r.name,
      role: r.role,
      context: r.context,
      projectSlug: r.project_slug,
      published: r.published === 1,
      order: r.sort_order,
    },
  };
}
