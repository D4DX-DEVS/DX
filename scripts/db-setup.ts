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

/** Columns added after a table first shipped; keep each in step with db/schema.sql. */
const COLUMNS = [
  { table: "projects", column: "video", definition: "TEXT NOT NULL DEFAULT ''" },
  { table: "projects", column: "icon", definition: "TEXT" },
  { table: "posts", column: "website", definition: "TEXT NOT NULL DEFAULT ''" },
  { table: "posts", column: "play_store", definition: "TEXT NOT NULL DEFAULT ''" },
  { table: "posts", column: "app_store", definition: "TEXT NOT NULL DEFAULT ''" },
  { table: "applications", column: "certificates", definition: "TEXT NOT NULL DEFAULT ''" },
  { table: "applications", column: "details", definition: "TEXT NOT NULL DEFAULT '{}'" },
  { table: "team_members", column: "photo_sketch", definition: "TEXT" },
  { table: "pages", column: "section", definition: "TEXT NOT NULL DEFAULT 'legal'" },
];

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
  // CREATE TABLE IF NOT EXISTS leaves an older table as it was, so columns added since are applied here.
  for (const add of COLUMNS) {
    const have = await all<{ name: string }>(`SELECT name FROM pragma_table_info('${add.table}')`);
    if (have.some((c) => c.name === add.column)) continue;
    await batch([{ sql: `ALTER TABLE ${add.table} ADD COLUMN ${add.column} ${add.definition}` }]);
    out(`added ${add.table}.${add.column}`);
  }
  const tables = await all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '\\_cf\\_%' ESCAPE '\\' ORDER BY name");
  out(`schema applied (${list.length} statements). tables: ${tables.map((t) => t.name).join(", ")}`);
}

main().catch((error: unknown) => {
  process.stderr.write(`db setup failed: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
