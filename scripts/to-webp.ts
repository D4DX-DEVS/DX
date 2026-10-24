/**
 * Converts every raster image under the given folders to WebP with sharp, then removes the original.
 *   npm run webp                       src/assets and seed/assets
 *   npm run webp -- path/to/folder     just that folder
 * PNGs (logos, icons, anything with transparency) become lossless WebP; photos (JPEG, AVIF, TIFF, GIF)
 * become quality-90 WebP. Files already in WebP are left alone. Prints old to new names so references
 * in code can be updated.
 */
import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const FROM = new Set([".png", ".jpg", ".jpeg", ".avif", ".tif", ".tiff", ".gif"]);
const roots = process.argv.slice(2).length ? process.argv.slice(2) : ["src/assets", "seed/assets"];

function out(message: string): void {
  process.stdout.write(`${message}\n`);
}

async function walk(dir: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (FROM.has(path.extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
}

async function main(): Promise<void> {
  let count = 0;
  let before = 0;
  let after = 0;
  for (const root of roots) {
    for (const file of await walk(root)) {
      const ext = path.extname(file).toLowerCase();
      const target = file.slice(0, -ext.length) + ".webp";
      const image = sharp(file, { animated: ext === ".gif" });
      await (ext === ".png" ? image.webp({ lossless: true, effort: 6 }) : image.webp({ quality: 90, effort: 6 })).toFile(target);
      before += (await stat(file)).size;
      after += (await stat(target)).size;
      await rm(file);
      count++;
      out(`${path.relative(process.cwd(), file)} -> ${path.basename(target)}`);
    }
  }
  out(`${count} images converted, ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB`);
}

main().catch((error: unknown) => {
  process.stderr.write(`webp failed: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
