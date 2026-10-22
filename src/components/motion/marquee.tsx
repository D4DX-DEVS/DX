"use client";

import { Pause, Play } from "lucide-react";
import { Fragment, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: ReactNode;
  /** Names the row for assistive tech and the pause button, e.g. "The team". */
  label: string;
  className?: string;
  /** Seconds for one full loop. */
  duration?: number;
  /** Copies of the content in each half. Raise it when one copy is narrower than a wide screen. */
  repeat?: number;
  reverse?: boolean;
}

/**
 * An endless row: the content twice, sliding left by one copy's width, in CSS. It pauses under
 * the pointer, while focused, and from its own button for touch and keyboard; under reduced
 * motion it stops and becomes a plain scrollable row. Only the first copy is exposed to
 * assistive tech and keyboard focus.
 */
export function Marquee({ children, label, className, duration = 40, repeat = 1, reverse = false }: MarqueeProps) {
  const [paused, setPaused] = useState(false);
  const copies = Array.from({ length: Math.max(1, repeat) }, (_, i) =>
    i === 0 ? (
      <Fragment key={i}>{children}</Fragment>
    ) : (
      <div key={i} className="marquee-copy" aria-hidden="true" inert>
        {children}
      </div>
    ),
  );

  return (
    <div
      className={cn("marquee relative", className)}
      data-paused={paused}
      style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
    >
      <div role="region" aria-label={label} tabIndex={0} className="flex rounded-md">
        <div className="marquee-track" data-reverse={reverse}>
          {copies}
        </div>
        <div className="marquee-track" data-reverse={reverse} aria-hidden="true" inert>
          {copies}
        </div>
      </div>
      <button
        type="button"
        aria-label={`Pause ${label.toLowerCase()}`}
        aria-pressed={paused}
        onClick={() => setPaused((p) => !p)}
        className="absolute top-1/2 right-[var(--margin)] grid size-11 -translate-y-1/2 place-items-center rounded-full bg-ground/85 text-ink ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-raised-2 motion-reduce:hidden"
      >
        {paused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
