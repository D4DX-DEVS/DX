"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { TAGS } from "@/lib/data/tags";
import { newId, nowIso, run } from "@/lib/db";
import { serviceSchema, type ServiceInput } from "@/lib/schemas/admin";
import type { ActionResult } from "@/lib/types";
import { idSchema, invalid, saveError } from "./shared";

/** Creates a service (id null) or updates one. Returns the id so a new record can open its edit page. */
export async function saveService(id: string | null, input: ServiceInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const s = parsed.data;
  const now = nowIso();
  const values = [s.title, s.slug, s.summary, s.proof, s.points, s.proofProjectSlug, s.published, s.order];
  try {
    if (id) {
      const { changes } = await run(
        `UPDATE services SET title = ?, slug = ?, summary = ?, proof = ?, points = ?, proof_project_slug = ?, published = ?, sort_order = ?, updated_at = ?
         WHERE id = ?`,
        [...values, now, idSchema.parse(id)],
      );
      if (changes === 0) return { ok: false, message: "This service no longer exists." };
      updateTag(TAGS.services);
      return { ok: true, id };
    }
    const created = newId();
    await run(
      `INSERT INTO services (title, slug, summary, proof, points, proof_project_slug, published, sort_order, id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [...values, created, now, now],
    );
    updateTag(TAGS.services);
    return { ok: true, id: created };
  } catch (error: unknown) {
    return saveError(error, "save service");
  }
}

export async function deleteService(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await run("DELETE FROM services WHERE id = ?", [idSchema.parse(id)]);
    updateTag(TAGS.services);
    return { ok: true };
  } catch (error: unknown) {
    return saveError(error, "delete service");
  }
}
