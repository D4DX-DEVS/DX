import { describe, expect, it } from "vitest";
import { contentTypeFor, isSafeMediaPath, isSafeVideoPath, looksLikePdf, safeDownloadName, sniffVideo } from "./media-utils";

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

describe("isSafeVideoPath", () => {
  it("accepts the video layout and nothing else", () => {
    expect(isSafeVideoPath(["videos", "2026", "10", "3f2a9c1e-77aa.mp4"])).toBe(true);
    expect(isSafeVideoPath(["videos", "2026", "10", "a.webm"])).toBe(true);
    expect(isSafeVideoPath(["videos", "2026", "10", "a.mov"])).toBe(false);
    expect(isSafeVideoPath(["videos", "..", "10", "a.mp4"])).toBe(false);
    expect(isSafeVideoPath(["other", "2026", "10", "a.mp4"])).toBe(false);
    expect(isSafeVideoPath(["2026", "10", "a.mp4"])).toBe(false);
  });
  it("maps the content types", () => {
    expect(contentTypeFor("a.mp4")).toBe("video/mp4");
    expect(contentTypeFor("a.webm")).toBe("video/webm");
  });
});

describe("sniffVideo", () => {
  it("reads the container from the first bytes", () => {
    const mp4 = Uint8Array.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32, 0, 0]);
    const webm = Uint8Array.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42]);
    expect(sniffVideo(mp4)).toBe("mp4");
    expect(sniffVideo(webm)).toBe("webm");
    expect(sniffVideo(new TextEncoder().encode("<html>not a video at all</html>"))).toBeNull();
  });
});
