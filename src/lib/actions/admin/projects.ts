"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { TAGS } from "@/lib/data/tags";
import { first, newId, nowIso, run } from "@/lib/db";
import { sanitizeRichText } from "@/lib/sanitize";
import { projectSchema, type ProjectInput } from "@/lib/schemas/admin";
import type { ActionResult } from "@/lib/types";
import { idSchema, invalid, saveError } from "./shared";

function expire(...slugs: string[]): void {
  updateTag(TAGS.projects);
  updateTag(TAGS.categories);
  updateTag(TAGS.services);
  for (const slug of new Set(slugs)) updateTag(TAGS.project(slug));
}

/** Creates a project (id null) or updates one. Returns the id so a new record can open its edit page. */
export async function saveProject(id: string | null, input: ProjectInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const p = parsed.data;
  const now = nowIso();
  const values = [
    p.title,
    p.slug,
    p.categoryId,
    p.client,
    p.date ? new Date(`${p.date}T00:00:00.000Z`) : null,
    p.summary,
    sanitizeRichText(p.body),
    p.features,
    p.platforms,
    p.links,
    p.cover,
    p.gallery,
    p.video,
    p.featured,
    p.status,
    p.order,
  ];
  try {
    if (!(await first("SELECT 1 AS x FROM categories WHERE id = ?", [p.categoryId]))) {
      return { ok: false, message: "That category no longer exists.", fieldErrors: { categoryId: ["Choose a category."] } };
    }
    if (id) {
      const before = await first<{ slug: string }>("SELECT slug FROM projects WHERE id = ?", [idSchema.parse(id)]);
      if (!before) return { ok: false, message: "This project no longer exists." };
      await run(
        `UPDATE projects SET title = ?, slug = ?, category_id = ?, client = ?, date = ?, summary = ?, body = ?, features = ?, platforms = ?,
                links = ?, cover = ?, gallery = ?, video = ?, featured = ?, status = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
        [...values, now, id],
      );
      expire(before.slug, p.slug);
      return { ok: true, id };
    }
    const newIdValue = newId();
    await run(
      `INSERT INTO projects (title, slug, category_id, client, date, summary, body, features, platforms, links, cover, gallery, video,
                             featured, status, sort_order, id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [...values, newIdValue, now, now],
    );
    expire(p.slug);
    return { ok: true, id: newIdValue };
  } catch (error: unknown) {
    return saveError(error, "save project");
  }
}

export async function deleteProject(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const row = await first<{ slug: string }>("SELECT slug FROM projects WHERE id = ?", [idSchema.parse(id)]);
    if (!row) return { ok: true };
    // Images stay in R2: other records or posts may link the same file. `npm run prune-media` reports leftovers.
    await run("DELETE FROM projects WHERE id = ?", [id]);
    expire(row.slug);
    return { ok: true };
  } catch (error: unknown) {
    return saveError(error, "delete project");
  }
}
