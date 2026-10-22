"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { TAGS } from "@/lib/data/tags";
import { newId, nowIso, run } from "@/lib/db";
import { teamMemberSchema, type TeamMemberInput } from "@/lib/schemas/admin";
import type { ActionResult } from "@/lib/types";
import { idSchema, invalid, saveError } from "./shared";

/** Creates a team member (id null) or updates one. Returns the id so a new record can open its edit page. */
export async function saveTeamMember(id: string | null, input: TeamMemberInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = teamMemberSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const m = parsed.data;
  const now = nowIso();
  const values = [m.name, m.role, m.photo, m.linkedin, m.published, m.order];
  try {
    if (id) {
      const { changes } = await run(
        "UPDATE team_members SET name = ?, role = ?, photo = ?, linkedin = ?, published = ?, sort_order = ?, updated_at = ? WHERE id = ?",
        [...values, now, idSchema.parse(id)],
      );
      if (changes === 0) return { ok: false, message: "This team member no longer exists." };
      updateTag(TAGS.team);
      return { ok: true, id };
    }
    const created = newId();
    await run(
      "INSERT INTO team_members (name, role, photo, linkedin, published, sort_order, id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [...values, created, now, now],
    );
    updateTag(TAGS.team);
    return { ok: true, id: created };
  } catch (error: unknown) {
    return saveError(error, "save team member");
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
