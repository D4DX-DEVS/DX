export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_PDF_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
export const IMAGE_FORMATS = ["jpeg", "png", "webp", "avif", "heif", "gif", "tiff"] as const;

const MEDIA_EXT = /^[a-z0-9-]+\.(webp|avif|jpg|jpeg|png)$/;
const MEDIA_DIR_SEGMENT = /^[0-9]{4}$|^[0-9]{2}$/;

/** /media/<yyyy>/<mm>/<name>.<ext> — anything else (.., absolute paths, odd names) is rejected. */
export function isSafeMediaPath(segments: readonly string[]): boolean {
  if (segments.length !== 3) return false;
  const [year, month, file] = segments;
  return MEDIA_DIR_SEGMENT.test(year) && MEDIA_DIR_SEGMENT.test(month) && MEDIA_EXT.test(file);
}

const VIDEO_FILE = /^[a-z0-9-]+\.(mp4|webm)$/;

/** /media/videos/<yyyy>/<mm>/<name>.<mp4|webm>, the layout storeVideo writes. */
export function isSafeVideoPath(segments: readonly string[]): boolean {
  if (segments.length !== 4 || segments[0] !== "videos") return false;
  const [, year, month, file] = segments;
  return MEDIA_DIR_SEGMENT.test(year) && MEDIA_DIR_SEGMENT.test(month) && VIDEO_FILE.test(file);
}

/** The container type from the file's first bytes (the browser's MIME type is not trusted), or null. */
export function sniffVideo(bytes: Uint8Array): "mp4" | "webm" | null {
  if (bytes.length > 12 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return "mp4";
  if (bytes.length > 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "webm";
  return null;
}

export function contentTypeFor(file: string): string {
  const ext = file.slice(file.lastIndexOf(".") + 1).toLowerCase();
  switch (ext) {
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    default:
      return "application/octet-stream";
  }
}

/** A real PDF starts with "%PDF-"; the browser-supplied MIME type is not trusted. */
export function looksLikePdf(bytes: Uint8Array): boolean {
  return bytes.length > 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
}

export function safeDownloadName(name: string): string {
  const base = name.replace(/[^\w.\- ]+/g, "").trim().slice(0, 80);
  return base.toLowerCase().endsWith(".pdf") ? base : `${base || "resume"}.pdf`;
}
