import "server-only";
import { requireAdmin } from "@/lib/auth/dal";
import { first } from "@/lib/db";
import { listQuerySchema, parseSearchParams, type Paginated, type SearchParamsRecord } from "@/lib/listing";
import type { PageRow } from "@/lib/models";
import type { PageInput } from "@/lib/schemas/admin";
import { listPage } from "../admin-query";

export const pageListQuery = listQuerySchema({
  sort: ["title", "updated"],
  defaultSort: "title",
  defaultOrder: "asc",
});

export interface PageListRow {
  id: string;
  title: string;
  slug: string;
  section: string;
  updated_at: string;
}

export async function listPages(params: SearchParamsRecord): Promise<Paginated<PageListRow>> {
  await requireAdmin();
  const q = parseSearchParams(pageListQuery, params);
  return listPage<PageListRow>(
    {
      from: "pages",
      select: "id, title, slug, section, updated_at",
      search: ["title", "slug"],
      sorts: { title: "title COLLATE NOCASE", updated: "updated_at" },
      tiebreak: "id",
    },
    q,
  );
}

function toSection(value: string | undefined): PageInput["section"] {
  return value === "careers-top" || value === "careers-bottom" ? value : "legal";
}

export interface PageEdit {
  id: string;
  slug: string;
  values: PageInput;
}

export async function getPageForEdit(id: string): Promise<PageEdit | null> {
  await requireAdmin();
  const r = await first<PageRow>("SELECT * FROM pages WHERE id = ?", [id]);
  if (!r) return null;
  return { id: r.id, slug: r.slug, values: { title: r.title, slug: r.slug, section: toSection(r.section), content: r.content } };
}
