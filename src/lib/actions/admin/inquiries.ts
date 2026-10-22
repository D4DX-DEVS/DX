"use server";

import { requireAdmin } from "@/lib/auth/dal";
import { nowIso, run } from "@/lib/db";
import { inboxStatusSchema } from "@/lib/schemas/admin";
import type { ActionResult } from "@/lib/types";
import { idSchema, saveError } from "./shared";

export async function setInquiryStatus(id: string, status: string): Promise<ActionResult> {
  await requireAdmin();
  const parsedId = idSchema.safeParse(id);
  const parsedStatus = inboxStatusSchema.safeParse(status);
  if (!parsedId.success || !parsedStatus.success) return { ok: false, message: "That status is not valid." };
  try {
    const { changes } = await run("UPDATE inquiries SET status = ?, updated_at = ? WHERE id = ?", [parsedStatus.data, nowIso(), parsedId.data]);
    return changes > 0 ? { ok: true } : { ok: false, message: "This inquiry no longer exists." };
  } catch (error: unknown) {
    return saveError(error, "inquiry status");
  }
}

export async function deleteInquiry(id: string): Promise<ActionResult> {
  await requireAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, message: "This inquiry no longer exists." };
  try {
    await run("DELETE FROM inquiries WHERE id = ?", [parsed.data]);
    return { ok: true };
  } catch (error: unknown) {
    return saveError(error, "delete inquiry");
  }
}
