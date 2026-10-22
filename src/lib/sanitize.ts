import sanitizeHtml from "sanitize-html";

/**
 * Rich text is stored already cleaned: one allowlist for blog posts, project bodies and
 * legal pages. Headings start at h2 because every page owns its single h1.
 */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["h2", "h3", "h4", "p", "br", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "blockquote", "code", "pre", "hr", "img", "figure", "figcaption"],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "width", "height"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https"] },
    allowProtocolRelative: false,
    transformTags: {
      h1: "h2",
      h5: "h4",
      h6: "h4",
      a: (tagName, attribs) => {
        const href = attribs.href ?? "#";
        const external = /^https?:\/\//.test(href) && !href.includes("d4dx.co");
        const out: Record<string, string> = external ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };
        return { tagName, attribs: out };
      },
    },
    exclusiveFilter: (frame) => {
      // Drop empty paragraphs and spans that page builders leave behind.
      if (["p", "h2", "h3", "h4", "li"].includes(frame.tag) && !frame.text.trim() && !frame.mediaChildren.length) return true;
      // Images only from our own media folder (absolute https images are re-hosted at import).
      if (frame.tag === "img") return !(frame.attribs.src ?? "").startsWith("/media/") && !(frame.attribs.src ?? "").startsWith("https://");
      return false;
    },
    // Relative /media/ image paths must survive the scheme check.
    allowedSchemesAppliedToAttributes: ["href"],
  });
}

/** Plain text excerpt from HTML, cut on a word boundary. */
export function excerptFrom(html: string, max = 200): string {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}
