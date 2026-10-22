import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/dal";
import { all, first, json } from "@/lib/db";
import { listQuerySchema, parseSearchParams, type Paginated, type SearchParamsRecord } from "@/lib/listing";
import type { MediaDoc, ProjectLinks, ProjectRow } from "@/lib/models";
import type { ProjectInput } from "@/lib/schemas/admin";
import { listPage } from "../admin-query";

export const projectListQuery = listQuerySchema({
  sort: ["order", "title", "date", "updated"],
  defaultSort: "order",
  defaultOrder: "asc",
  filters: {
    status: z.enum(["published", "draft"]).optional().catch(undefined),
    category: z.string().max(64).optional().catch(undefined),
  },
});

export interface ProjectListRow {
  id: string;
  title: string;
  slug: string;
  client: string;
  status: "published" | "draft";
  featured: 0 | 1;
  sort_order: number;
  date: string | null;
  updated_at: string;
  category: string | null;
  cover_url: string | null;
}

export async function listProjects(params: SearchParamsRecord): Promise<Paginated<ProjectListRow>> {
  await requireAdmin();
  const q = parseSearchParams(projectListQuery, params);
  const where = [];
  if (q.status) where.push({ sql: "p.status = ?", params: [q.status] });
  if (q.category) where.push({ sql: "p.category_id = ?", params: [q.category] });
  return listPage<ProjectListRow>(
    {
      from: "projects p LEFT JOIN categories c ON c.id = p.category_id",
      select: "p.id, p.title, p.slug, p.client, p.status, p.featured, p.sort_order, p.date, p.updated_at, c.name AS category, json_extract(p.cover, '$.url') AS cover_url",
      search: ["p.title", "p.client", "p.slug"],
      sorts: { order: "p.sort_order", title: "p.title COLLATE NOCASE", date: "p.date", updated: "p.updated_at" },
      where,
      tiebreak: "p.id",
    },
    q,
  );
}

export interface CategoryOption {
  value: string;
  label: string;
}

export async function getCategoryOptions(): Promise<CategoryOption[]> {
  await requireAdmin();
  const rows = await all<{ id: string; name: string }>("SELECT id, name FROM categories ORDER BY sort_order, name");
  return rows.map((r) => ({ value: r.id, label: r.name }));
}

export interface ProjectEdit {
  id: string;
  slug: string;
  values: ProjectInput;
}

export async function getProjectForEdit(id: string): Promise<ProjectEdit | null> {
  await requireAdmin();
  const r = await first<ProjectRow>("SELECT * FROM projects WHERE id = ?", [id]);
  if (!r) return null;
  const links = json<ProjectLinks>(r.links, {});
  return {
    id: r.id,
    slug: r.slug,
    values: {
      title: r.title,
      slug: r.slug,
      categoryId: r.category_id,
      client: r.client,
      date: r.date ? r.date.slice(0, 10) : "",
      summary: r.summary,
      body: r.body,
      features: json<string[]>(r.features, []),
      platforms: json<ProjectInput["platforms"]>(r.platforms, []),
      links: { playStore: links.playStore ?? "", appStore: links.appStore ?? "", website: links.website ?? "" },
      cover: json<MediaDoc | null>(r.cover, null),
      gallery: json<MediaDoc[]>(r.gallery, []),
      featured: r.featured === 1,
      status: r.status,
      order: r.sort_order,
    },
  };
}

/** The next free position at the end of the list, for new records. */
export async function nextOrder(table: "projects" | "services" | "team_members" | "testimonials" | "jobs" | "categories"): Promise<number> {
  await requireAdmin();
  const row = await first<{ n: number | null }>(`SELECT MAX(sort_order) AS n FROM ${table}`);
  return (row?.n ?? 0) + 1;
}
