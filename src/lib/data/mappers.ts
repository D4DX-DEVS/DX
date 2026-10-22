import type { Media } from "@/lib/types";

interface RawMedia {
  url?: string | null;
  width?: number | null;
  height?: number | null;
  blur?: string | null;
  alt?: string | null;
}

export function toMedia(raw: RawMedia | null | undefined): Media | null {
  if (!raw?.url) return null;
  return {
    url: raw.url,
    width: raw.width ?? 1200,
    height: raw.height ?? 900,
    blur: raw.blur ?? "",
    alt: raw.alt ?? "",
  };
}

export function toMediaList(raw: RawMedia[] | null | undefined): Media[] {
  return (raw ?? []).map(toMedia).filter((m): m is Media => m !== null);
}

export function iso(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function yearOf(date: Date | string | null | undefined): number | null {
  const value = iso(date);
  return value ? new Date(value).getUTCFullYear() : null;
}
