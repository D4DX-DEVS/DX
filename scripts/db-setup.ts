/**
 * Creates the D1 tables and indexes from db/schema.sql. Safe to re-run (IF NOT EXISTS).
 *   npm run db:setup
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { all, batch } from "@/lib/db";

function out(message: string): void {
  process.stdout.write(`${message}\n`);
}

/** Splits the schema file into statements; it holds no semicolons inside strings or triggers. */
function statements(sql: string): string[] {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main(): Promise<void> {
  const sql = await readFile(path.resolve(process.cwd(), "db/schema.sql"), "utf8");
  const list = statements(sql);
  await batch(list.map((s) => ({ sql: s })));
  const tables = await all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '\\_cf\\_%' ESCAPE '\\' ORDER BY name");
  out(`schema applied (${list.length} statements). tables: ${tables.map((t) => t.name).join(", ")}`);
}

main().catch((error: unknown) => {
  process.stderr.write(`db setup failed: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
