"use server";

import { requireAdmin } from "@/lib/auth/dal";
import { first, json, nowIso, run } from "@/lib/db";
import { deletePrivateFile } from "@/lib/media";
import type { ResumeDoc } from "@/lib/models";
import { inboxStatusSchema } from "@/lib/schemas/admin";
import type { ActionResult } from "@/lib/types";
import { idSchema, saveError } from "./shared";

export async function setApplicationStatus(id: string, status: string): Promise<ActionResult> {
  await requireAdmin();
  const parsedId = idSchema.safeParse(id);
  const parsedStatus = inboxStatusSchema.safeParse(status);
  if (!parsedId.success || !parsedStatus.success) return { ok: false, message: "That status is not valid." };
  try {
    const { changes } = await run("UPDATE applications SET status = ?, updated_at = ? WHERE id = ?", [parsedStatus.data, nowIso(), parsedId.data]);
    return changes > 0 ? { ok: true } : { ok: false, message: "This application no longer exists." };
  } catch (error: unknown) {
    return saveError(error, "application status");
  }
}

/** Deletes the application and its résumé (résumés belong to one application only). */
export async function deleteApplication(id: string): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, message: "This application no longer exists." };
  try {
    const row = await first<{ resume: string }>("SELECT resume FROM applications WHERE id = ?", [parsed.data]);
    if (!row) return { ok: true };
    await run("DELETE FROM applications WHERE id = ?", [parsed.data]);
    const file = json<ResumeDoc | null>(row.resume, null)?.file;
    if (file) await deletePrivateFile(file);
    return { ok: true };
  } catch (error: unknown) {
    return saveError(error, "delete application");
  }
}
