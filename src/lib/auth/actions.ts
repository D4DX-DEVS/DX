"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { first, nowIso, run } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { AdminUserRow } from "@/lib/models";
import { clientIp } from "@/lib/request";
import { loginSchema, type LoginInput } from "@/lib/schemas/admin";
import type { ActionResult } from "@/lib/types";
import { clearSessionCookie, createSessionCookie } from "./session";
import { LOGIN_RULE, clearHits, hit } from "./throttle";
import { SESSION_TTL_LONG, SESSION_TTL_SHORT, safeNextPath } from "./token";

// Compared against when the email is unknown, so both paths take the same bcrypt time.
// (A hash of random bytes nobody knows.)
const DUMMY_HASH = "$2b$12$nLLnMBrP2saDDDcuoKsrPeUQsjlOs4Wn2xJcJS3TSE9h0JZCWn5RO";
const WRONG: ActionResult = { ok: false, message: "That email and password do not match an admin account." };

export async function login(input: LoginInput, next: string | null): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please check the form.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { email, password, remember } = parsed.data;

  let destination: string;
  try {
    const ip = await clientIp();
    // Per account and per connection, so one attacker cannot lock out every admin.
    const [byAccount, byIp] = await Promise.all([hit("login", [email], LOGIN_RULE), hit("login-ip", [ip], { limit: 20, windowSeconds: 15 * 60 })]);
    if (!byAccount || !byIp) return { ok: false, message: "Too many attempts. Wait 15 minutes, then try again." };

    const user = await first<Pick<AdminUserRow, "id" | "role" | "password_hash" | "token_version">>(
      "SELECT id, role, password_hash, token_version FROM admin_users WHERE email = ?",
      [email],
    );
    const matches = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !matches) return WRONG;

    await Promise.all([clearHits("login", [email]), run("UPDATE admin_users SET last_login_at = ? WHERE id = ?", [nowIso(), user.id])]);
    await createSessionCookie(
      { sub: user.id, role: user.role === "owner" ? "owner" : "editor", v: user.token_version },
      remember ? SESSION_TTL_LONG : SESSION_TTL_SHORT,
    );
    destination = safeNextPath(next);
  } catch (error: unknown) {
    logger.error("login failed", error);
    return { ok: false, message: "Something went wrong on our side. Please try again." };
  }
  redirect(destination);
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/admin/login");
}
