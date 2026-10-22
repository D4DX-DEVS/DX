"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { TAGS } from "@/lib/data/tags";
import { nowIso, run } from "@/lib/db";
import { settingsSchema, type SettingsInput } from "@/lib/schemas/admin";
import type { ActionResult } from "@/lib/types";
import { invalid, saveError } from "./shared";

/** Saves the site-wide contact details, address and social links (one JSON row, key "site"). */
export async function saveSettings(input: SettingsInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const now = nowIso();
  try {
    await run("INSERT INTO settings (key, data, updated_at) VALUES ('site', ?, ?) ON CONFLICT (key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at", [
      parsed.data,
      now,
    ]);
    updateTag(TAGS.settings);
    return { ok: true };
  } catch (error: unknown) {
    return saveError(error, "save settings");
  }
}
