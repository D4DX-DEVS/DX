import { z } from "zod";

export const PAGE_SIZES = [10, 20, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Builds the URL-query contract for one admin listing: page, pageSize (10/20/50/100),
 * search, a whitelisted sort field, order, plus that listing's own filters.
 * Anything malformed falls back to the defaults instead of throwing, so a hand-edited
 * URL still renders a page.
 */
export function listQuerySchema<
  const S extends readonly [string, ...string[]],
  F extends z.ZodRawShape = Record<never, never>,
>(options: { sort: S; defaultSort: S[number]; defaultOrder?: "asc" | "desc"; filters?: F }) {
  return z.object({
    page: z.coerce.number().int().min(1).max(100000).catch(1),
    pageSize: z.coerce
      .number()
      .refine((n): n is PageSize => (PAGE_SIZES as readonly number[]).includes(n))
      .catch(20),
    search: z.string().trim().max(100).catch(""),
    sort: z.enum(options.sort).catch(options.defaultSort),
    order: z.enum(["asc", "desc"]).catch(options.defaultOrder ?? "desc"),
    ...(options.filters ?? ({} as F)),
  });
}

export function parseSearchParams<T extends z.ZodType>(schema: T, params: SearchParamsRecord): z.infer<T> {
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(params)) flat[key] = first(value);
  return schema.parse(flat);
}

export function toPaginated<T>(data: T[], total: number, page: number, pageSize: number): Paginated<T> {
  return { data, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Escapes user input for use inside a RegExp (Mongo $regex). */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Public pages use fixed page sizes and a 1-based page from the URL. */
export function publicPage(value: string | string[] | undefined): number {
  const n = Number(first(value));
  return Number.isInteger(n) && n >= 1 && n <= 10000 ? n : 1;
}
