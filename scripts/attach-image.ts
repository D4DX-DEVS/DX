/**
 * Adds an image to a project's gallery through the same pipeline as admin uploads
 * (re-encoded to WebP, capped at 2000px, blur placeholder).
 *
 *   npm run attach-image -- <project-slug> <image-file> "<alt text>"
 */
import { readFile } from "node:fs/promises";
import { first, json, nowIso, run } from "@/lib/db";
import { logger } from "@/lib/logger";
import { processImage } from "@/lib/media";
import type { MediaDoc, ProjectRow } from "@/lib/models";

async function main(): Promise<void> {
  const [slug, file, alt] = process.argv.slice(2);
  if (!slug || !file || !alt?.trim()) throw new Error('Usage: attach-image <project-slug> <image-file> "<alt text>"');

  const project = await first<Pick<ProjectRow, "id" | "title" | "gallery">>("SELECT id, title, gallery FROM projects WHERE slug = ?", [slug]);
  if (!project) throw new Error(`No project with slug "${slug}"`);

  const media = await processImage(await readFile(file), alt);
  const gallery = [...json<MediaDoc[]>(project.gallery, []), media];
  await run("UPDATE projects SET gallery = ?, updated_at = ? WHERE id = ?", [gallery, nowIso(), project.id]);
  logger.info(`Added ${media.url} (${media.width}x${media.height}) to ${project.title}`);
  // The site's pages are cached by tag; this script runs outside Next and cannot expire them.
  logger.info("Restart the dev server, or re-save the project in the admin, to see it on cached pages.");
}

main().catch((error: unknown) => {
  logger.error("attach-image failed", error);
  process.exitCode = 1;
});
