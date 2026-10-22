"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/** Taller than this many screens, a section reveals part by part. */
const TALL = 1.25;

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  id?: string;
  /** Seconds between parts. Lists use a shorter step than headings and text. */
  stagger?: number;
  "aria-labelledby"?: string;
}

/**
 * Reveals the parts of one section in reading order as it enters: every [data-reveal] rises
 * and fades, every [data-reveal-mask] opens from its top edge. A section taller than the screen
 * (a list stacked on a phone) reveals its parts as each one arrives instead, so none plays out
 * of sight. Fires once. Under reduced motion, or if scripts fail, the parts are simply there.
 */
export function Reveal({ children, as: Tag = "div", className, stagger = 0.08, ...rest }: RevealProps) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const items = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-mask]"));
        const shown = new Set<Element>();
        const triggers: ScrollTrigger[] = [];
        const reveal = (targets: Element[]) => {
          const fresh = targets.filter((t) => !shown.has(t));
          if (!fresh.length) return;
          for (const t of fresh) shown.add(t);
          const done = shown.size === items.length;
          if (done) for (const t of triggers) t.kill();
          // Once shown, stay shown: parts added later (new data, hot reload) need no animation.
          const tl = gsap.timeline({ onComplete: done ? () => el.classList.add("reveal-off") : undefined });
          const parts = fresh.filter((t) => t.hasAttribute("data-reveal"));
          const masks = fresh.filter((t) => t.hasAttribute("data-reveal-mask"));
          if (parts.length) tl.to(parts, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger }, 0);
          if (masks.length) tl.to(masks, { clipPath: "inset(0 0 0% 0)", duration: 1.15, ease: "power4.inOut", stagger: stagger * 1.4 }, 0);
        };
        // Entering from either direction counts, so a page restored below the section still shows it.
        if (el.offsetHeight > window.innerHeight * TALL) {
          const each = (batch: Element[]) => reveal(batch);
          triggers.push(...ScrollTrigger.batch(items, { start: "top 92%", end: "bottom top", onEnter: each, onEnterBack: each, onLeave: each }));
        } else {
          const all = () => reveal(items);
          triggers.push(ScrollTrigger.create({ trigger: el, start: "top 88%", end: "bottom top", onEnter: all, onEnterBack: all, onLeave: all }));
        }
        const passed = triggers.filter((t) => t.progress > 0 || t.scroll() > t.start).map((t) => t.trigger);
        reveal(passed.includes(el) ? items : passed.filter((t): t is Element => t !== undefined));
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <Tag ref={root} className={cn(className)} {...rest}>
      {children}
    </Tag>
  );
}
