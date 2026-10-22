"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { TAGS } from "@/lib/data/tags";
import { newId, nowIso, run } from "@/lib/db";
import { testimonialSchema, type TestimonialInput } from "@/lib/schemas/admin";
import type { ActionResult } from "@/lib/types";
import { idSchema, invalid, saveError } from "./shared";

/** Creates a testimonial (id null) or updates one. Returns the id so a new record can open its edit page. */
export async function saveTestimonial(id: string | null, input: TestimonialInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = testimonialSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const t = parsed.data;
  const now = nowIso();
  const values = [t.quote, t.name, t.role, t.context, t.projectSlug, t.published, t.order];
  try {
    if (id) {
      const { changes } = await run(
        "UPDATE testimonials SET quote = ?, name = ?, role = ?, context = ?, project_slug = ?, published = ?, sort_order = ?, updated_at = ? WHERE id = ?",
        [...values, now, idSchema.parse(id)],
      );
      if (changes === 0) return { ok: false, message: "This testimonial no longer exists." };
      updateTag(TAGS.testimonials);
      return { ok: true, id };
    }
    const created = newId();
    await run(
      `INSERT INTO testimonials (quote, name, role, context, project_slug, published, sort_order, id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [...values, created, now, now],
    );
    updateTag(TAGS.testimonials);
    return { ok: true, id: created };
  } catch (error: unknown) {
    return saveError(error, "save testimonial");
  }
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await run("DELETE FROM testimonials WHERE id = ?", [idSchema.parse(id)]);
    updateTag(TAGS.testimonials);
    return { ok: true };
  } catch (error: unknown) {
    return saveError(error, "delete testimonial");
  }
}
