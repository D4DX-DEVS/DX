"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/** Weighted scrolling on desktop pointers only; off for touch and reduced motion. */
export function SmoothScroll() {
  const lenis = useRef<Lenis | null>(null);
  const pathname = usePathname();
  // A load or reload keeps the browser's restored position, and back/forward restores its own:
  // only a fresh link click to another page starts at the top.
  const lastPath = useRef(pathname);
  const fromHistory = useRef(false);

  useEffect(() => {
    // Tells the head script's watchdog that the app is running (see app/layout.tsx), and
    // undoes its fallback if the app arrived after the watchdog gave up.
    const root = document.documentElement;
    // A slow device can hydrate after the watchdog gave up: it had switched the 3D hero off, so switch it back on.
    if (root.classList.contains("no-hydrate") && (window as unknown as { __d4dxImmersive?: number }).__d4dxImmersive) {
      root.classList.add("immersive");
    }
    root.classList.add("hydrated");
    root.classList.remove("no-hydrate");
    // Fragment jumps and same-page entries fire popstate too, but never change the pathname.
    const onPop = () => {
      fromHistory.current = window.location.pathname !== lastPath.current;
    };
    window.addEventListener("popstate", onPop);
    // Sections grow after load (pictures arrive, data fills in), which leaves scroll animations measured
    // against an older, shorter page. Measure again, a moment after the page stops changing height.
    let height = document.body.scrollHeight;
    let settle = 0;
    const remeasure = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        const next = document.body.scrollHeight;
        if (Math.abs(next - height) > 4) {
          height = next;
          ScrollTrigger.refresh();
        }
      }, 300);
    };
    const observer = new ResizeObserver(remeasure);
    observer.observe(document.body);
    window.addEventListener("load", remeasure);
    const stopMeasuring = () => {
      window.clearTimeout(settle);
      observer.disconnect();
      window.removeEventListener("load", remeasure);
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduce || coarse) {
      return () => {
        window.removeEventListener("popstate", onPop);
        stopMeasuring();
      };
    }

    const instance = new Lenis({ lerp: 0.12, wheelMultiplier: 1 });
    lenis.current = instance;
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      window.removeEventListener("popstate", onPop);
      stopMeasuring();
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis.current = null;
    };
  }, []);

  useEffect(() => {
    if (pathname !== lastPath.current && !fromHistory.current) lenis.current?.scrollTo(0, { immediate: true });
    lastPath.current = pathname;
    fromHistory.current = false;
    // New page, new section positions.
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}
