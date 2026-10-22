/**
 * Confirms SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD can sign in against the D1 database.
 *   npm run check-admin                      report only
 *   npm run check-admin -- --reset-password  set the stored hash to SEED_ADMIN_PASSWORD (signs out other sessions)
 */
import bcrypt from "bcryptjs";
import { first, nowIso, run } from "@/lib/db";
import type { AdminUserRow } from "@/lib/models";

function out(message: string): void {
  process.stdout.write(`${message}\n`);
}

async function main(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set");

  const user = await first<Pick<AdminUserRow, "id" | "role" | "password_hash">>(
    "SELECT id, role, password_hash FROM admin_users WHERE email = ?",
    [email],
  );
  if (!user) {
    out(`FAIL: no admin with email ${email} (run npm run seed to create it)`);
    process.exitCode = 1;
    return;
  }
  if (await bcrypt.compare(password, user.password_hash)) {
    out(`OK: ${email} (${user.role}) signs in with SEED_ADMIN_PASSWORD`);
    return;
  }
  if (process.argv.includes("--reset-password")) {
    await run("UPDATE admin_users SET password_hash = ?, token_version = token_version + 1, updated_at = ? WHERE id = ?", [
      await bcrypt.hash(password, 12),
      nowIso(),
      user.id,
    ]);
    out(`RESET: ${email} password now matches SEED_ADMIN_PASSWORD`);
    return;
  }
  out(`FAIL: ${email} exists but SEED_ADMIN_PASSWORD does not match (rerun with --reset-password)`);
  process.exitCode = 1;
}

main().catch((error: unknown) => {
  process.stderr.write(`check failed: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
