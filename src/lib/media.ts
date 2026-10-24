import "server-only";
import { randomUUID } from "node:crypto";
import sharp, { type Sharp } from "sharp";
import { IMAGE_FORMATS, MAX_IMAGE_BYTES, MAX_PDF_BYTES, MAX_VIDEO_BYTES, looksLikePdf, sniffVideo } from "@/lib/media-utils";
import type { MediaDoc } from "@/lib/models/shared";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { deleteObject, getObject, mediaKeyFromUrl, publicMediaUrl, putObject, type StoredObject } from "@/lib/storage";

export class MediaError extends Error {}

const MAX_WIDTH = 2000;
// Keys are random UUIDs and never rewritten, so CDN and browsers can keep them forever.
export const MEDIA_CACHE_CONTROL = "public, max-age=31536000, immutable";

/** Throws a MediaError unless the bytes are a JPG, PNG, WebP or AVIF image of a sensible size. */
async function checkImage(input: Buffer): Promise<void> {
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
}

/** Stores encoded WebP bytes under a fresh random key and describes them (with a tiny blurred placeholder). */
async function storeWebp(data: Buffer, info: { width: number; height: number }, alt: string): Promise<MediaDoc> {
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

/** Re-encodes any accepted upload as WebP (strips metadata), and makes a tiny blurred placeholder. */
export async function processImage(input: Buffer, alt = ""): Promise<MediaDoc> {
  await checkImage(input);
  const pipeline = sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true });
  const { data, info } = await pipeline.webp({ quality: 82, effort: 4 }).toBuffer({ resolveWithObject: true });
  return storeWebp(data, info, alt);
}

const SKETCH_WIDTH = 900;
/**
 * Pencil-sketch look: how crisp the lines are, how much shading stays, how far flat areas go to white paper, and
 * how strong and close together the crosshatch strokes are (a fraction of the picture's width).
 */
const SKETCH = { pre: 1, line: 0.006, tone: 0.45, shade: 0.5, gamma: 1.5, soft: 0.4, grain: 0.05, edge: 5, area: 0.01, lift: 4, floor: 0.1, hatch: 0.012, across: 0.5, cross: 0.4 };

/**
 * Turns a photo into a graphite pencil drawing on white paper. A colour dodge of the grey photo against its own
 * blurred negative draws the outlines; a soft tone keeps the shading of hair and shadow; flat areas (walls, sky)
 * are lifted to paper white while textured areas keep their strokes; diagonal crosshatching deepens the shadows;
 * a little grain and sharpening finish it.
 */
async function sketchOf(input: Buffer): Promise<{ data: Buffer; info: { width: number; height: number } }> {
  const o = SKETCH;
  const first = await sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: SKETCH_WIDTH })
    .greyscale()
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = first.info;
  const raw = { raw: { width, height, channels: 1 as const } };
  // Sharp may hand back several identical channels after an operation; keep one.
  const channel = (pipeline: Sharp) => pipeline.extractChannel(0).raw().toBuffer();

  const grey = await channel(sharp(first.data, raw).blur(o.pre));
  const lines = await channel(sharp(grey, raw).negate().blur(width * o.line));
  const tones = await channel(sharp(grey, raw).blur(width * 0.02));
  const diff = Buffer.alloc(grey.length);
  for (let i = 0; i < diff.length; i++) diff[i] = Math.min(255, Math.abs(grey[i]! - tones[i]!) * o.edge);
  const activity = await channel(sharp(diff, raw).blur(width * o.area));

  const drawing = Buffer.alloc(grey.length);
  const period = width * o.hatch;
  for (let i = 0; i < drawing.length; i++) {
    const x = i % width;
    const y = Math.floor(i / width);
    const dodge = Math.min(255, (grey[i]! * 255) / Math.max(1, 255 - lines[i]!)) / 255;
    const tone = o.tone + (1 - o.tone) * (tones[i]! / 255);
    const dark = Math.pow(dodge * (1 - o.shade + o.shade * tone), o.gamma);
    const busy = Math.min(1, (activity[i]! / 255) * o.lift);
    let v = 1 - (1 - dark) * (o.floor + (1 - o.floor) * busy);
    // Crosshatching: one diagonal set of strokes in mid shadow, a second set across it in deep shadow.
    const need = Math.max(0, 0.8 - v);
    const along = Math.sin(((x + y) / period) * Math.PI * 2) > 0.2 ? 1 : 0;
    const across = need > 0.3 && Math.sin(((x - y) / period) * Math.PI * 2) > 0.2 ? 1 : 0;
    v = Math.max(0, v - need * (along * o.across + across * o.cross) * busy);
    drawing[i] = Math.max(0, Math.min(255, v * 255));
  }
  const soft = await channel(sharp(drawing, raw).blur(o.soft));
  for (let i = 0; i < soft.length; i++) soft[i] = soft[i]! * (1 - Math.random() * o.grain);

  const out = await sharp(soft, raw).sharpen({ sigma: 0.8 }).webp({ quality: 88, effort: 4 }).toBuffer();
  return { data: out, info: { width, height } };
}

const SKETCH_PROMPT =
  "Redraw this exact photo as a realistic black-and-white graphite pencil and charcoal portrait drawing on plain white paper. " +
  "Keep the person's identity, face shape, proportions, expression, hairstyle, glasses, clothing and hijab exactly as in the photo; " +
  "do not change or beautify the face and do not invent anything. Grayscale only, with detailed pencil strokes, subtle crosshatching, " +
  "natural soft shadows and a refined hand-drawn texture. Plain light paper background, no colour, no text, no frame. " +
  "Same head-and-shoulders framing and crop as the photo.";

/** Redraws a photo with OpenAI's image-edit model; throws when the call fails. Returns grayscale WebP bytes. */
async function aiSketchOf(input: Buffer, apiKey: string, model: string): Promise<{ data: Buffer; info: { width: number; height: number } }> {
  const png = await sharp(input, { limitInputPixels: 40_000_000 }).rotate().resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true }).png().toBuffer();
  const form = new FormData();
  form.append("model", model);
  form.append("image", new Blob([new Uint8Array(png)], { type: "image/png" }), "portrait.png");
  form.append("prompt", SKETCH_PROMPT);
  form.append("size", "1024x1536");
  form.append("quality", "medium");
  form.append("input_fidelity", "high");
  form.append("n", "1");
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(120_000),
  });
  const body = (await res.json().catch(() => null)) as { data?: { b64_json?: string }[]; error?: { message?: string } } | null;
  const b64 = body?.data?.[0]?.b64_json;
  if (!res.ok || !b64) throw new Error(`image edit failed (${res.status}): ${body?.error?.message ?? "no image returned"}`);
  // Whatever the model returns, keep it strictly grayscale and a card-friendly 4:5 crop, at a sensible size.
  const { data, info } = await sharp(Buffer.from(b64, "base64"))
    .resize({ width: SKETCH_WIDTH, height: Math.round(SKETCH_WIDTH * 1.25), fit: "cover", position: "top" })
    .greyscale()
    .webp({ quality: 88, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  return { data, info };
}

/**
 * Draws a photo (the bytes of an uploaded image) as a pencil sketch and stores it as WebP: by OpenAI's image model
 * when OPENAI_API_KEY is set, otherwise (or if that call fails) by the built-in pencil filter.
 */
export async function processSketch(input: Buffer, alt = ""): Promise<MediaDoc> {
  await checkImage(input);
  const { OPENAI_API_KEY, OPENAI_IMAGE_MODEL } = env();
  if (OPENAI_API_KEY) {
    try {
      const { data, info } = await aiSketchOf(input, OPENAI_API_KEY, OPENAI_IMAGE_MODEL);
      return await storeWebp(data, info, alt);
    } catch (error: unknown) {
      logger.error("AI sketch failed, using the pencil filter", error);
    }
  }
  const { data, info } = await sketchOf(input);
  return storeWebp(data, info, alt);
}

/** Draws the pencil sketch of an image already in the media store, given its URL. Null when the URL is not ours or is gone. */
export async function sketchFromUrl(url: string, alt = ""): Promise<MediaDoc | null> {
  const key = mediaKeyFromUrl(url);
  if (!key) return null;
  const stored = await getObject("public", key);
  if (!stored) return null;
  return processSketch(Buffer.from(await new Response(stored.body).arrayBuffer()), alt);
}

/** Stores an mp4 or webm as it is (no re-encode) under media/videos and returns its URL. */
export async function storeVideo(input: Buffer): Promise<string> {
  if (input.byteLength > MAX_VIDEO_BYTES) throw new MediaError("Videos must be 25 MB or smaller.");
  const type = sniffVideo(input);
  if (!type) throw new MediaError("Use an MP4 or WebM video.");
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const key = `media/videos/${year}/${month}/${randomUUID()}.${type}`;
  await putObject("public", key, input, type === "mp4" ? "video/mp4" : "video/webm", MEDIA_CACHE_CONTROL);
  return publicMediaUrl(key);
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
