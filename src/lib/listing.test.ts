import { describe, expect, it } from "vitest";
import { z } from "zod";
import { escapeRegex, listQuerySchema, parseSearchParams, publicPage, slugify, toPaginated } from "./listing";

const schema = listQuerySchema({
  sort: ["updatedAt", "title"] as const,
  defaultSort: "updatedAt",
  filters: { status: z.enum(["all", "published", "draft"]).catch("all") },
});

describe("listQuerySchema", () => {
  it("applies defaults for an empty query", () => {
    expect(parseSearchParams(schema, {})).toEqual({
      page: 1,
      pageSize: 20,
      search: "",
      sort: "updatedAt",
      order: "desc",
      status: "all",
    });
  });

  it("accepts valid values", () => {
    const q = parseSearchParams(schema, { page: "3", pageSize: "50", search: " thaf ", sort: "title", order: "asc", status: "draft" });
    expect(q).toMatchObject({ page: 3, pageSize: 50, search: "thaf", sort: "title", order: "asc", status: "draft" });
  });

  it("falls back instead of trusting malformed input", () => {
    const q = parseSearchParams(schema, { page: "-4", pageSize: "1000", sort: "passwordHash", order: "sideways", status: "x" });
    expect(q).toMatchObject({ page: 1, pageSize: 20, sort: "updatedAt", order: "desc", status: "all" });
  });

  it("takes the first value of a repeated param", () => {
    expect(parseSearchParams(schema, { page: ["2", "9"] }).page).toBe(2);
  });
});

describe("toPaginated", () => {
  it("computes total pages and never returns zero pages", () => {
    expect(toPaginated([1, 2], 41, 1, 20).totalPages).toBe(3);
    expect(toPaginated([], 0, 1, 20).totalPages).toBe(1);
  });
});

describe("escapeRegex", () => {
  it("neutralises regex metacharacters", () => {
    const escaped = escapeRegex("a.b*(c)?");
    expect(new RegExp(escaped).test("a.b*(c)?")).toBe(true);
    expect(new RegExp(`^${escaped}$`).test("axb")).toBe(false);
  });
});

describe("slugify", () => {
  it("makes url-safe slugs", () => {
    expect(slugify("Thanima Hajj & Umra")).toBe("thanima-hajj-and-umra");
    expect(slugify("  Zai Toon Kids!! ")).toBe("zai-toon-kids");
    expect(slugify("Café Déjà")).toBe("cafe-deja");
  });
});

describe("publicPage", () => {
  it("parses a positive integer page or falls back to 1", () => {
    expect(publicPage("2")).toBe(2);
    expect(publicPage("0")).toBe(1);
    expect(publicPage("abc")).toBe(1);
    expect(publicPage(undefined)).toBe(1);
    expect(publicPage(["4"])).toBe(4);
  });
});
