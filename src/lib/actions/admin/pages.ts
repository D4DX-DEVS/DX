"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { TAGS } from "@/lib/data/tags";
import { first, newId, nowIso, run } from "@/lib/db";
import { sanitizeRichText } from "@/lib/sanitize";
import { pageSchema, type PageInput } from "@/lib/schemas/admin";
import type { ActionResult } from "@/lib/types";
import { idSchema, invalid, saveError } from "./shared";

function expire(...slugs: string[]): void {
  updateTag(TAGS.pages);
  for (const slug of new Set(slugs)) updateTag(TAGS.page(slug));
}

/** Creates a legal page (id null) or updates one. Returns the id so a new page can open its edit page. */
export async function savePage(id: string | null, input: PageInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = pageSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const p = parsed.data;
  const now = nowIso();
  const values = [p.title, p.slug, sanitizeRichText(p.content)];
  try {
    if (id) {
      const before = await first<{ slug: string }>("SELECT slug FROM pages WHERE id = ?", [idSchema.parse(id)]);
      if (!before) return { ok: false, message: "This page no longer exists." };
      await run("UPDATE pages SET title = ?, slug = ?, content = ?, updated_at = ? WHERE id = ?", [...values, now, id]);
      expire(before.slug, p.slug);
      return { ok: true, id };
    }
    const newIdValue = newId();
    await run("INSERT INTO pages (title, slug, content, id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)", [...values, newIdValue, now, now]);
    expire(p.slug);
    return { ok: true, id: newIdValue };
  } catch (error: unknown) {
    return saveError(error, "save page");
  }
}

export async function deletePage(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const row = await first<{ slug: string }>("SELECT slug FROM pages WHERE id = ?", [idSchema.parse(id)]);
    if (!row) return { ok: true };
    await run("DELETE FROM pages WHERE id = ?", [id]);
    expire(row.slug);
    return { ok: true };
  } catch (error: unknown) {
    return saveError(error, "delete page");
  }
}
