"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/dal";
import { TAGS } from "@/lib/data/tags";
import { batch, first, json, newId, nowIso, run } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sketchFromUrl } from "@/lib/media";
import type { MediaDoc, TeamMemberRow } from "@/lib/models";
import { teamMemberSchema, type TeamMemberInput } from "@/lib/schemas/admin";
import type { ActionResult } from "@/lib/types";
import { idSchema, invalid, saveError } from "./shared";

/**
 * The pencil-sketch version of a portrait. Kept as it is while the photo is unchanged; drawn afresh when the photo is
 * new or replaced; null when there is no photo. A drawing that fails never blocks saving the person.
 */
async function sketchFor(photo: MediaDoc | null, current: Pick<TeamMemberRow, "photo" | "photo_sketch"> | null, name: string): Promise<MediaDoc | null> {
  if (!photo) return null;
  const before = json<MediaDoc | null>(current?.photo ?? null, null);
  const kept = json<MediaDoc | null>(current?.photo_sketch ?? null, null);
  if (kept && before?.url === photo.url) return kept;
  try {
    return await sketchFromUrl(photo.url, `Pencil sketch of ${name}`);
  } catch (error: unknown) {
    logger.error("team sketch failed", error);
    return kept && before?.url === photo.url ? kept : null;
  }
}

/** Creates a team member (id null) or updates one. Returns the id so a new record can open its edit page. */
export async function saveTeamMember(id: string | null, input: TeamMemberInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = teamMemberSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const m = parsed.data;
  const now = nowIso();
  try {
    const current = id ? await first<Pick<TeamMemberRow, "photo" | "photo_sketch">>("SELECT photo, photo_sketch FROM team_members WHERE id = ?", [idSchema.parse(id)]) : null;
    const sketch = await sketchFor(m.photo, current, m.name);
    const values = [m.name, m.role, m.photo, sketch, m.linkedin, m.published, m.order];
    if (id) {
      const { changes } = await run(
        "UPDATE team_members SET name = ?, role = ?, photo = ?, photo_sketch = ?, linkedin = ?, published = ?, sort_order = ?, updated_at = ? WHERE id = ?",
        [...values, now, idSchema.parse(id)],
      );
      if (changes === 0) return { ok: false, message: "This team member no longer exists." };
      updateTag(TAGS.team);
      return { ok: true, id };
    }
    const created = newId();
    await run(
      "INSERT INTO team_members (name, role, photo, photo_sketch, linkedin, published, sort_order, id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [...values, created, now, now],
    );
    updateTag(TAGS.team);
    return { ok: true, id: created };
  } catch (error: unknown) {
    return saveError(error, "save team member");
  }
}

const orderSchema = z
  .array(idSchema)
  .min(1)
  .max(500)
  .refine((ids) => new Set(ids).size === ids.length, "Each person can appear once.");

/** Saves a new order: the first id becomes position 1, and so on. Takes every member, hidden ones too. */
export async function reorderTeam(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const parsed = orderSchema.safeParse(ids);
  if (!parsed.success) return { ok: false, message: "That order could not be read. Reload and try again." };
  const now = nowIso();
  try {
    await batch(
      parsed.data.map((id, i) => ({
        sql: "UPDATE team_members SET sort_order = ?, updated_at = ? WHERE id = ?",
        params: [i + 1, now, id],
      })),
    );
    updateTag(TAGS.team);
    return { ok: true };
  } catch (error: unknown) {
    return saveError(error, "reorder team");
  }
}

export async function deleteTeamMember(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    // The photo stays in R2; `npm run prune-media` reports files nothing links to.
    await run("DELETE FROM team_members WHERE id = ?", [idSchema.parse(id)]);
    updateTag(TAGS.team);
    return { ok: true };
  } catch (error: unknown) {
    return saveError(error, "delete team member");
  }
}
