export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_PDF_BYTES = 5 * 1024 * 1024;
export const IMAGE_FORMATS = ["jpeg", "png", "webp", "avif", "heif", "gif", "tiff"] as const;

const MEDIA_EXT = /^[a-z0-9-]+\.(webp|avif|jpg|jpeg|png)$/;
const MEDIA_DIR_SEGMENT = /^[0-9]{4}$|^[0-9]{2}$/;

/** /media/<yyyy>/<mm>/<name>.<ext> — anything else (.., absolute paths, odd names) is rejected. */
export function isSafeMediaPath(segments: readonly string[]): boolean {
  if (segments.length !== 3) return false;
  const [year, month, file] = segments;
  return MEDIA_DIR_SEGMENT.test(year) && MEDIA_DIR_SEGMENT.test(month) && MEDIA_EXT.test(file);
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
