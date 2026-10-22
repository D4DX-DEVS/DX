/**
 * Removes duplicate files from R2: objects nothing in D1 links to whose bytes are identical to an
 * object that is linked. Unused files that are not copies are only listed, never deleted.
 *   npm run prune-media            report
 *   npm run prune-media -- --apply delete the duplicates
 */
import { all } from "@/lib/db";
import { deleteObject, listObjects } from "@/lib/storage";

const apply = process.argv.includes("--apply");

// Every query returns one column named v (a union takes its column name from the first select).
const MEDIA_SOURCES = [
  "SELECT cover AS v FROM projects UNION ALL SELECT gallery FROM projects UNION ALL SELECT body FROM projects",
  "SELECT photo AS v FROM team_members",
  "SELECT cover AS v FROM posts UNION ALL SELECT content FROM posts",
  "SELECT content AS v FROM pages",
];

function out(message: string): void {
  process.stdout.write(`${message}\n`);
}

async function referencedMedia(): Promise<Set<string>> {
  const refs = new Set<string>();
  for (const sql of MEDIA_SOURCES) {
    for (const row of await all<{ v: string | null }>(sql)) {
      for (const m of (row.v ?? "").matchAll(/\/media\/(\d{4}\/\d{2}\/[a-z0-9-]+\.(?:webp|avif|jpe?g|png))/g)) refs.add(`media/${m[1]}`);
    }
  }
  return refs;
}

async function main(): Promise<void> {
  const refs = await referencedMedia();
  const objects = await listObjects("public", "media/");
  const keys = new Set(objects.map((o) => o.key));
  const inUse = objects.filter((o) => refs.has(o.key));
  const inUseByHash = new Map(inUse.map((o) => [`${o.etag}:${o.size}`, o.key]));
  const unused = objects.filter((o) => !refs.has(o.key));
  const duplicates = unused.filter((o) => inUseByHash.has(`${o.etag}:${o.size}`));
  const unique = unused.filter((o) => !inUseByHash.has(`${o.etag}:${o.size}`));
  const missing = [...refs].filter((k) => !keys.has(k));

  out(`media/: ${objects.length} objects, ${inUse.length} in use, ${duplicates.length} duplicates, ${unique.length} unused but unique (kept), ${missing.length} missing`);
  for (const o of duplicates) out(`  duplicate: ${o.key} = ${inUseByHash.get(`${o.etag}:${o.size}`)}`);
  for (const o of unique) out(`  kept: ${o.key}`);
  for (const k of missing) out(`  missing: ${k}`);

  if (!apply) {
    if (duplicates.length) out("report only: rerun with --apply to delete the duplicates");
    return;
  }
  for (const o of duplicates) await deleteObject("public", o.key);
  out(`deleted ${duplicates.length} duplicates`);
}

main().catch((error: unknown) => {
  process.stderr.write(`prune failed: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
