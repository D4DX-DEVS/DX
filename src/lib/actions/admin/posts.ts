"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { TAGS } from "@/lib/data/tags";
import { first, newId, nowIso, run } from "@/lib/db";
import { excerptFrom, sanitizeRichText } from "@/lib/sanitize";
import { postSchema, type PostInput } from "@/lib/schemas/admin";
import type { ActionResult } from "@/lib/types";
import { idSchema, invalid, saveError } from "./shared";

function expire(...slugs: string[]): void {
  updateTag(TAGS.posts);
  for (const slug of new Set(slugs)) updateTag(TAGS.post(slug));
}

/** Creates a post (id null) or updates one. Returns the id so a new post can open its edit page. */
export async function savePost(id: string | null, input: PostInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const p = parsed.data;
  const now = nowIso();
  const content = sanitizeRichText(p.content);
  const excerpt = p.excerpt || excerptFrom(content, 220);
  // A published post always carries a date: today when none was chosen.
  const day = p.publishedAt || (p.status === "published" ? now.slice(0, 10) : "");
  const values = [p.title, p.slug, excerpt, content, p.cover, p.tags, p.status, day ? new Date(`${day}T00:00:00.000Z`) : null];
  try {
    if (id) {
      const before = await first<{ slug: string }>("SELECT slug FROM posts WHERE id = ?", [idSchema.parse(id)]);
      if (!before) return { ok: false, message: "This post no longer exists." };
      await run(
        "UPDATE posts SET title = ?, slug = ?, excerpt = ?, content = ?, cover = ?, tags = ?, status = ?, published_at = ?, updated_at = ? WHERE id = ?",
        [...values, now, id],
      );
      expire(before.slug, p.slug);
      return { ok: true, id };
    }
    const newIdValue = newId();
    await run(
      `INSERT INTO posts (title, slug, excerpt, content, cover, tags, status, published_at, id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [...values, newIdValue, now, now],
    );
    expire(p.slug);
    return { ok: true, id: newIdValue };
  } catch (error: unknown) {
    return saveError(error, "save post");
  }
}

export async function deletePost(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const row = await first<{ slug: string }>("SELECT slug FROM posts WHERE id = ?", [idSchema.parse(id)]);
    if (!row) return { ok: true };
    // Images stay in R2: other records may link the same file. `npm run prune-media` reports leftovers.
    await run("DELETE FROM posts WHERE id = ?", [id]);
    expire(row.slug);
    return { ok: true };
  } catch (error: unknown) {
    return saveError(error, "delete post");
  }
}
