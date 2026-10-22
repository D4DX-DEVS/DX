"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

export interface Stage {
  lead: string;
  text: string;
}

/**
 * The five moments of a project. As each crosses the middle of the screen it lights up and
 * the bar beside the list fills; the others wait, dimmed. Under reduced motion all are lit.
 */
export function ProcessSteps({ stages }: { stages: Stage[] }) {
  const root = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-step]", el).forEach((step, i) => {
          ScrollTrigger.create({
            trigger: step,
            start: "top 62%",
            end: "bottom 62%",
            onToggle: (self) => {
              if (self.isActive) setActive(i);
            },
          });
        });
        gsap.fromTo(
          fill.current,
          { scaleY: 0 },
          { scaleY: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 62%", end: "bottom 62%", scrub: true } },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative pl-7 sm:pl-10">
      <span aria-hidden="true" className="absolute top-2 bottom-2 left-0 w-1 rounded-full bg-raised-2">
        <span ref={fill} className="block h-full w-full origin-top rounded-full bg-brand" />
      </span>
      <ol className="flex flex-col">
        {stages.map((stage, i) => (
          <li key={stage.lead} data-step data-active={i === active} className="flex flex-col justify-center py-7 md:min-h-[34svh] md:py-10">
            <h3 className="text-[clamp(1.5rem,2.6vw,2.5rem)] leading-tight font-semibold tracking-[-0.025em]">{stage.lead}</h3>
            <p className="mt-3 max-w-[46ch] text-[length:var(--step-lead)] leading-relaxed text-soft">{stage.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
