import "server-only";
import { requireAdmin } from "@/lib/auth/dal";
import { first } from "@/lib/db";
import { listQuerySchema, parseSearchParams, type Paginated, type SearchParamsRecord } from "@/lib/listing";
import type { CategoryRow } from "@/lib/models";
import type { CategoryInput } from "@/lib/schemas/admin";
import { listPage } from "../admin-query";

export const categoryListQuery = listQuerySchema({
  sort: ["order", "name", "updated"],
  defaultSort: "order",
  defaultOrder: "asc",
});

export interface CategoryListRow {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  updated_at: string;
  projects: number;
}

export async function listCategories(params: SearchParamsRecord): Promise<Paginated<CategoryListRow>> {
  await requireAdmin();
  const q = parseSearchParams(categoryListQuery, params);
  return listPage<CategoryListRow>(
    {
      from: "categories c",
      select: "c.id, c.name, c.slug, c.sort_order, c.updated_at, (SELECT COUNT(*) FROM projects p WHERE p.category_id = c.id) AS projects",
      search: ["c.name", "c.slug"],
      sorts: { order: "c.sort_order", name: "c.name COLLATE NOCASE", updated: "c.updated_at" },
      tiebreak: "c.id",
    },
    q,
  );
}

export interface CategoryEdit {
  id: string;
  values: CategoryInput;
}

export async function getCategoryForEdit(id: string): Promise<CategoryEdit | null> {
  await requireAdmin();
  const r = await first<CategoryRow>("SELECT * FROM categories WHERE id = ?", [id]);
  if (!r) return null;
  return { id: r.id, values: { name: r.name, slug: r.slug, description: r.description, order: r.sort_order } };
}
