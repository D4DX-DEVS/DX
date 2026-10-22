import "server-only";
import { z } from "zod";
import { DatabaseError } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { ActionResult } from "@/lib/types";

export const SAVE_FAILED: ActionResult = { ok: false, message: "Could not save. Please try again." };

export function invalid(error: z.ZodError): ActionResult {
  return { ok: false, message: "Please check the highlighted fields.", fieldErrors: z.flattenError(error).fieldErrors };
}

/** Turns a UNIQUE constraint failure into a field error; anything else is logged and hidden. */
export function saveError(error: unknown, context: string, uniqueField = "slug"): ActionResult {
  if (error instanceof DatabaseError && /UNIQUE constraint failed/i.test(error.message)) {
    const message = uniqueField === "email" ? "Another account already uses this email." : "Another entry already uses this slug.";
    return { ok: false, message, fieldErrors: { [uniqueField]: [message] } };
  }
  logger.error(`${context} failed`, error);
  return SAVE_FAILED;
}

export const idSchema = z.string().min(1).max(64);
