"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { TAGS } from "@/lib/data/tags";
import { first, newId, nowIso, run } from "@/lib/db";
import { categorySchema, type CategoryInput } from "@/lib/schemas/admin";
import type { ActionResult } from "@/lib/types";
import { idSchema, invalid, saveError } from "./shared";

function expire(): void {
  updateTag(TAGS.categories);
  updateTag(TAGS.projects);
}

/** Creates a category (id null) or updates one. Returns the id so a new record can open its edit page. */
export async function saveCategory(id: string | null, input: CategoryInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const c = parsed.data;
  const now = nowIso();
  try {
    if (id) {
      const { changes } = await run("UPDATE categories SET name = ?, slug = ?, description = ?, sort_order = ?, updated_at = ? WHERE id = ?", [
        c.name,
        c.slug,
        c.description,
        c.order,
        now,
        idSchema.parse(id),
      ]);
      if (changes === 0) return { ok: false, message: "This category no longer exists." };
      expire();
      return { ok: true, id };
    }
    const created = newId();
    await run("INSERT INTO categories (id, name, slug, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [
      created,
      c.name,
      c.slug,
      c.description,
      c.order,
      now,
      now,
    ]);
    expire();
    return { ok: true, id: created };
  } catch (error: unknown) {
    return saveError(error, "save category");
  }
}

/** Refused while projects still belong to the category, so no project is left without one. */
export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const used = await first<{ n: number }>("SELECT COUNT(*) AS n FROM projects WHERE category_id = ?", [idSchema.parse(id)]);
    const n = used?.n ?? 0;
    if (n > 0) {
      return { ok: false, message: `${n} ${n === 1 ? "project uses" : "projects use"} this category. Move ${n === 1 ? "it" : "them"} to another category first.` };
    }
    await run("DELETE FROM categories WHERE id = ?", [id]);
    expire();
    return { ok: true };
  } catch (error: unknown) {
    return saveError(error, "delete category");
  }
}
