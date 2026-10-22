/**
 * Moves locally stored files (storage/media, storage/private) into Cloudflare R2.
 *   npm run migrate
 * With R2_PUBLIC_URL set, stored "/media/..." links in D1 are rewritten to the public R2 domain.
 * Safe to re-run: objects are overwritten with identical bytes and rewritten links no longer match.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { batch } from "@/lib/db";
import { env } from "@/lib/env";
import { MEDIA_CACHE_CONTROL } from "@/lib/media";
import { contentTypeFor } from "@/lib/media-utils";
import { putObject } from "@/lib/storage";

const STORAGE = path.resolve(process.cwd(), "storage");

// Columns holding media JSON ({"url":"/media/..."}) or HTML (src="/media/...").
const MEDIA_COLUMNS: [table: string, column: string][] = [
  ["projects", "cover"],
  ["projects", "gallery"],
  ["projects", "body"],
  ["team_members", "photo"],
  ["posts", "cover"],
  ["posts", "content"],
  ["pages", "content"],
];

function out(message: string): void {
  process.stdout.write(`${message}\n`);
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : Promise.resolve([path.join(dir, e.name)]))),
  );
  return files.flat();
}

async function uploadFolder(folder: "media" | "private"): Promise<void> {
  const root = path.join(STORAGE, folder);
  const files = await walk(root);
  for (const file of files) {
    const key = `${folder}/${path.relative(root, file).split(path.sep).join("/")}`;
    const body = await readFile(file);
    if (folder === "media") await putObject("public", key, body, contentTypeFor(file), MEDIA_CACHE_CONTROL);
    else await putObject("private", key, body, key.endsWith(".pdf") ? "application/pdf" : "application/octet-stream");
  }
  out(`${folder}: ${files.length} files uploaded to R2`);
}

async function rewriteUrls(base: string): Promise<void> {
  // The leading quote anchors the match to a value start, so already-absolute URLs are left alone.
  await batch(
    MEDIA_COLUMNS.map(([table, column]) => ({
      sql: `UPDATE ${table} SET ${column} = replace(${column}, '"/media/', ?) WHERE instr(${column}, '"/media/') > 0`,
      params: [`"${base}/media/`],
    })),
  );
  out(`media links now point to ${base}`);
}

async function main(): Promise<void> {
  await uploadFolder("media");
  await uploadFolder("private");
  const base = env().R2_PUBLIC_URL?.replace(/\/$/, "");
  if (base) await rewriteUrls(base);
  else out("R2_PUBLIC_URL not set: media stays on /media URLs, proxied from R2");
  out("migration complete");
}

main().catch((error: unknown) => {
  process.stderr.write(`migration failed: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
