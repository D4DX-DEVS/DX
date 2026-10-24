"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** The top bar: it keeps its place while the page scrolls, and takes a frosted ground once it is over content. */
export function StickyHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled}
      className={cn(
        "frame sticky top-0 z-40 flex h-20 items-center justify-between gap-6 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        scrolled && "bg-[#060a16]/75 shadow-[0_1px_0_rgb(255_255_255/0.08),0_18px_40px_-24px_rgb(0_0_0/0.8)] backdrop-blur-md",
      )}
    >
      {children}
    </header>
  );
}
