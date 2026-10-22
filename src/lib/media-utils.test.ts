import { describe, expect, it } from "vitest";
import { contentTypeFor, isSafeMediaPath, looksLikePdf, safeDownloadName } from "./media-utils";

describe("isSafeMediaPath", () => {
  it("accepts the storage layout", () => {
    expect(isSafeMediaPath(["2026", "10", "3f2a9c1e-77aa.webp"])).toBe(true);
  });
  it("rejects traversal and unexpected shapes", () => {
    expect(isSafeMediaPath(["..", "10", "a.webp"])).toBe(false);
    expect(isSafeMediaPath(["2026", "10", "../secret.webp"])).toBe(false);
    expect(isSafeMediaPath(["2026", "10", "a.svg"])).toBe(false);
    expect(isSafeMediaPath(["2026", "a.webp"])).toBe(false);
    expect(isSafeMediaPath(["2026", "10", "A.WEBP"])).toBe(false);
  });
});

describe("contentTypeFor", () => {
  it("maps known image extensions", () => {
    expect(contentTypeFor("x.webp")).toBe("image/webp");
    expect(contentTypeFor("x.jpg")).toBe("image/jpeg");
    expect(contentTypeFor("x.bin")).toBe("application/octet-stream");
  });
});

describe("looksLikePdf", () => {
  it("checks the magic bytes", () => {
    expect(looksLikePdf(new TextEncoder().encode("%PDF-1.7 ..."))).toBe(true);
    expect(looksLikePdf(new TextEncoder().encode("<html>"))).toBe(false);
    expect(looksLikePdf(new Uint8Array())).toBe(false);
  });
});

describe("safeDownloadName", () => {
  it("strips unsafe characters and keeps a .pdf extension", () => {
    expect(safeDownloadName('../../etc/"passwd"')).toBe("....etcpasswd.pdf");
    expect(safeDownloadName("Jahana CV.pdf")).toBe("Jahana CV.pdf");
    expect(safeDownloadName("")).toBe("resume.pdf");
  });
});
