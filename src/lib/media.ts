import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { IMAGE_FORMATS, MAX_IMAGE_BYTES, MAX_PDF_BYTES, looksLikePdf } from "@/lib/media-utils";
import type { MediaDoc } from "@/lib/models/shared";
import { deleteObject, getObject, mediaKeyFromUrl, publicMediaUrl, putObject, type StoredObject } from "@/lib/storage";

export class MediaError extends Error {}

const MAX_WIDTH = 2000;
// Keys are random UUIDs and never rewritten, so CDN and browsers can keep them forever.
export const MEDIA_CACHE_CONTROL = "public, max-age=31536000, immutable";

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
  const key = `media/${year}/${month}/${randomUUID()}.webp`;
  await putObject("public", key, data, "image/webp", MEDIA_CACHE_CONTROL);

  return {
    url: publicMediaUrl(key),
    width: info.width,
    height: info.height,
    blur: `data:image/webp;base64,${blurBuffer.toString("base64")}`,
    alt: alt.slice(0, 200),
  };
}

/** Removes an object previously written by processImage. Unknown or foreign URLs are ignored. */
export async function deleteMedia(url: string | null | undefined): Promise<void> {
  const key = mediaKeyFromUrl(url);
  if (key) await deleteObject("public", key).catch(() => undefined);
}

export async function deleteMediaList(urls: Iterable<string | null | undefined>): Promise<void> {
  await Promise.all([...urls].map((url) => deleteMedia(url)));
}

export interface StoredFile {
  file: string;
  name: string;
  size: number;
}

/** Résumés are kept under private/ (never behind the public media URL) and only served to signed-in admins. */
export async function savePrivatePdf(input: Buffer, originalName: string): Promise<StoredFile> {
  if (input.byteLength > MAX_PDF_BYTES) throw new MediaError("The résumé must be 5 MB or smaller.");
  if (!looksLikePdf(input)) throw new MediaError("The résumé must be a PDF file.");
  const file = `resumes/${randomUUID()}.pdf`;
  await putObject("private", `private/${file}`, input, "application/pdf");
  return { file, name: originalName.slice(0, 120), size: input.byteLength };
}

function privateKey(file: string): string | null {
  return /^resumes\/[0-9a-f-]{36}\.pdf$/.test(file) ? `private/${file}` : null;
}

/** Streams a stored résumé. Callers must check the admin session first. */
export async function getPrivateFile(file: string): Promise<StoredObject | null> {
  const key = privateKey(file);
  return key ? getObject("private", key) : null;
}

export async function deletePrivateFile(file: string): Promise<void> {
  const key = privateKey(file);
  if (key) await deleteObject("private", key).catch(() => undefined);
}
