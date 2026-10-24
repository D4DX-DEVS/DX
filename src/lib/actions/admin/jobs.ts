"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { TAGS } from "@/lib/data/tags";
import { z } from "zod";
import { batch, first, newId, nowIso, run } from "@/lib/db";
import { jobSchema, type JobInput } from "@/lib/schemas/admin";
import type { ActionResult } from "@/lib/types";
import { idSchema, invalid, saveError } from "./shared";

/** Creates a job opening (id null) or updates one. Returns the id so a new job can open its edit page. */
export async function saveJob(id: string | null, input: JobInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = jobSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const j = parsed.data;
  const now = nowIso();
  const values = [j.title, j.slug, j.level, j.experience, j.location, j.summary, j.requirements, j.open, j.order];
  try {
    if (id) {
      if (!(await first("SELECT 1 AS x FROM jobs WHERE id = ?", [idSchema.parse(id)]))) return { ok: false, message: "This job no longer exists." };
      await run(
        "UPDATE jobs SET title = ?, slug = ?, level = ?, experience = ?, location = ?, summary = ?, requirements = ?, open = ?, sort_order = ?, updated_at = ? WHERE id = ?",
        [...values, now, id],
      );
      updateTag(TAGS.jobs);
      return { ok: true, id };
    }
    const newIdValue = newId();
    await run(
      `INSERT INTO jobs (title, slug, level, experience, location, summary, requirements, open, sort_order, id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [...values, newIdValue, now, now],
    );
    updateTag(TAGS.jobs);
    return { ok: true, id: newIdValue };
  } catch (error: unknown) {
    return saveError(error, "save job");
  }
}

const orderSchema = z
  .array(idSchema)
  .min(1)
  .max(500)
  .refine((ids) => new Set(ids).size === ids.length, "Each position can appear once.");

/** Saves a new order for the positions: the first id becomes position 1, and so on. Takes every position, closed ones too. */
export async function reorderJobs(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const parsed = orderSchema.safeParse(ids);
  if (!parsed.success) return { ok: false, message: "That order could not be read. Reload and try again." };
  const now = nowIso();
  try {
    await batch(parsed.data.map((id, i) => ({ sql: "UPDATE jobs SET sort_order = ?, updated_at = ? WHERE id = ?", params: [i + 1, now, id] })));
    updateTag(TAGS.jobs);
    return { ok: true };
  } catch (error: unknown) {
    return saveError(error, "reorder jobs");
  }
}

export async function deleteJob(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await run("DELETE FROM jobs WHERE id = ?", [idSchema.parse(id)]);
    updateTag(TAGS.jobs);
    return { ok: true };
  } catch (error: unknown) {
    return saveError(error, "delete job");
  }
}
