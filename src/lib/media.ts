import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { mediaRoot, privateRoot } from "@/lib/env";
import { IMAGE_FORMATS, MAX_IMAGE_BYTES, MAX_PDF_BYTES, looksLikePdf } from "@/lib/media-utils";
import type { MediaDoc } from "@/lib/models/shared";

export class MediaError extends Error {}

const MAX_WIDTH = 2000;

/** Re-encodes any accepted upload as WebP (strips metadata), and makes a tiny blurred placeholder. */
export async function processImage(input: Buffer, alt = ""): Promise<MediaDoc> {
  if (input.byteLength > MAX_IMAGE_BYTES) throw new MediaError("Images must be 8 MB or smaller.");

  let meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    meta = await sharp(input, { limitInputPixels: 40_000_000 }).metadata();
  } catch {
    throw new MediaError("That file is not an image we can read.");
  }
  if (!meta.format || !(IMAGE_FORMATS as readonly string[]).includes(meta.format)) {
    throw new MediaError("Use a JPG, PNG, WebP or AVIF image.");
  }

  const pipeline = sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true });
  const { data, info } = await pipeline.webp({ quality: 82, effort: 4 }).toBuffer({ resolveWithObject: true });
  const blurBuffer = await sharp(data).resize(16).webp({ quality: 40 }).toBuffer();

  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const file = `${randomUUID()}.webp`;
  const dir = path.join(mediaRoot(), year, month);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, file), data);

  return {
    url: `/media/${year}/${month}/${file}`,
    width: info.width,
    height: info.height,
    blur: `data:image/webp;base64,${blurBuffer.toString("base64")}`,
    alt: alt.slice(0, 200),
  };
}

/** Removes a file previously written by processImage. Unknown or foreign URLs are ignored. */
export async function deleteMedia(url: string | null | undefined): Promise<void> {
  if (!url?.startsWith("/media/")) return;
  const target = path.resolve(mediaRoot(), url.slice("/media/".length));
  if (!target.startsWith(mediaRoot() + path.sep)) return;
  await unlink(target).catch(() => undefined);
}

export async function deleteMediaList(urls: Iterable<string | null | undefined>): Promise<void> {
  await Promise.all([...urls].map((url) => deleteMedia(url)));
}

export interface StoredFile {
  file: string;
  name: string;
  size: number;
}

/** Résumés are kept outside the public media folder and only served to signed-in admins. */
export async function savePrivatePdf(input: Buffer, originalName: string): Promise<StoredFile> {
  if (input.byteLength > MAX_PDF_BYTES) throw new MediaError("The résumé must be 5 MB or smaller.");
  if (!looksLikePdf(input)) throw new MediaError("The résumé must be a PDF file.");
  const file = `resumes/${randomUUID()}.pdf`;
  const target = path.join(privateRoot(), file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, input);
  return { file, name: originalName.slice(0, 120), size: input.byteLength };
}

export function privateFilePath(file: string): string | null {
  if (!/^resumes\/[0-9a-f-]{36}\.pdf$/.test(file)) return null;
  return path.join(privateRoot(), file);
}

export async function deletePrivateFile(file: string): Promise<void> {
  const target = privateFilePath(file);
  if (target) await unlink(target).catch(() => undefined);
}
