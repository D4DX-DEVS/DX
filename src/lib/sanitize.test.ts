import { describe, expect, it } from "vitest";
import { excerptFrom, sanitizeRichText } from "./sanitize";

describe("sanitizeRichText", () => {
  it("removes scripts, styles, event handlers and classes", () => {
    const out = sanitizeRichText('<p class="x" onclick="evil()">Hi<script>alert(1)</script></p><style>p{}</style>');
    expect(out).toBe("<p>Hi</p>");
  });

  it("demotes h1 to h2 and drops empty blocks", () => {
    expect(sanitizeRichText("<h1>Title</h1><p> </p>")).toBe("<h2>Title</h2>");
  });

  it("blocks javascript: links and opens external links safely", () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript");
    expect(sanitizeRichText('<a href="https://play.google.com/x">x</a>')).toContain('rel="noopener noreferrer"');
  });

  it("keeps our own media images and drops data: images", () => {
    expect(sanitizeRichText('<img src="/media/2026/10/a.webp" alt="a">')).toContain('src="/media/2026/10/a.webp"');
    expect(sanitizeRichText('<img src="data:image/png;base64,AAAA">')).not.toContain("<img");
  });
});

describe("excerptFrom", () => {
  it("strips tags and cuts on a word boundary", () => {
    expect(excerptFrom("<p>Hello <strong>world</strong> again</p>", 12)).toBe("Hello world…");
    expect(excerptFrom("<p>Short</p>")).toBe("Short");
  });
});
