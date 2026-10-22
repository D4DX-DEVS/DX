"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/** A picture held at 112% inside its frame that drifts a few percent with the scroll. */
export function ParallaxFrame({ children, className, amount = 6 }: { children: ReactNode; className?: string; amount?: number }) {
  const frame = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          inner.current,
          { yPercent: -amount },
          { yPercent: amount, ease: "none", scrollTrigger: { trigger: frame.current, start: "top bottom", end: "bottom top", scrub: true } },
        );
      });
      return () => mm.revert();
    },
    { scope: frame },
  );

  return (
    <div ref={frame} className={cn("relative overflow-hidden", className)}>
      <div ref={inner} className="absolute inset-x-0 -top-[8%] -bottom-[8%]">
        {children}
      </div>
    </div>
  );
}
