"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "@/components/icons";
import { cn } from "@/lib/utils";

const RING = 2 * Math.PI * 25;

/**
 * Appears once the page has been scrolled a screen or so: a round button at the right edge whose
 * ring fills as you read down and whose arrow bobs. Sits above the phone tab bar.
 */
export function BackToTop() {
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const update = () => {
      frame.current = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setShow(window.scrollY > 520);
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    const onScroll = () => {
      if (!frame.current) frame.current = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  const toTop = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Back to top"
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      className={cn(
        "back-top group fixed right-4 bottom-[5.25rem] z-40 grid size-14 place-items-center rounded-full bg-[#0a1230]/90 text-white shadow-[0_14px_36px_-10px_rgb(45_80_210/0.9)] ring-1 ring-white/15 backdrop-blur-md transition-[opacity,transform] duration-500 ease-[var(--ease-out)] lg:right-8 lg:bottom-8",
        show ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-6 scale-75 opacity-0",
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 56 56" className="absolute inset-0 size-full -rotate-90">
        <circle cx="28" cy="28" r="25" fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="2.5" />
        <circle
          cx="28"
          cy="28"
          r="25"
          fill="none"
          stroke="url(#back-top-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={RING}
          strokeDashoffset={RING * (1 - progress)}
          style={{ transition: "stroke-dashoffset 120ms linear" }}
        />
        <defs>
          <linearGradient id="back-top-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6f8fff" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>
      </svg>
      <span aria-hidden="true" className="back-top-ping absolute inset-0 rounded-full" />
      <ArrowUp weight="bold" aria-hidden="true" className="back-top-arrow relative size-5" />
    </button>
  );
}
