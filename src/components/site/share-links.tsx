"use client";

import { useState } from "react";
import { Copy, FacebookLogo, LinkedinLogo, WhatsappLogo, XLogo, Check } from "@/components/icons";
import { cn } from "@/lib/utils";

const chip =
  "grid size-11 place-items-center rounded-full border border-border bg-raised text-ink transition-[transform,background-color,color,border-color] duration-300 hover:-translate-y-0.5 hover:border-brand hover:bg-brand hover:text-on-brand active:scale-95";

/** Share buttons for the page: four networks and a copy-link button. They are plain links, so they work without script. */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { label: "Share on WhatsApp", href: `https://wa.me/?text=${t}%20${u}`, icon: WhatsappLogo },
    { label: "Share on Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: FacebookLogo },
    { label: "Share on LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, icon: LinkedinLogo },
    { label: "Share on X", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}`, icon: XLogo },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: show the address to copy by hand.
      setManual(true);
    }
  }

  return (
    <>
    <ul className="flex flex-wrap gap-2.5">
      {links.map(({ label, href, icon: Icon }) => (
        <li key={label}>
          <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={chip}>
            <Icon weight="fill" aria-hidden="true" className="size-5" />
          </a>
        </li>
      ))}
      <li>
        <button type="button" onClick={copy} aria-label={copied ? "Link copied" : "Copy link"} title="Copy link" className={cn(chip, copied && "border-brand bg-brand text-on-brand")}>
          {copied ? <Check aria-hidden="true" className="size-5" /> : <Copy aria-hidden="true" className="size-5" />}
        </button>
      </li>
    </ul>
    {manual ? (
      <input
        readOnly
        value={url}
        aria-label="Link to copy"
        onFocus={(e) => e.currentTarget.select()}
        className="mt-3 w-full rounded-xl border border-border bg-raised px-3 py-2 text-sm"
      />
    ) : null}
    </>
  );
}
