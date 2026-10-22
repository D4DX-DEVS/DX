"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, useCallback, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { heroState } from "./scene/state";

const HeroScene = dynamic(() => import("./scene/hero-scene"), { ssr: false });

export interface HeroProject {
  title: string;
  slug: string;
  category: string;
  src: string;
}

// The root layout's head script adds `immersive` before first paint when WebGL 2 is there,
// motion is welcome and the screen is tall enough; it is removed again if the scene fails.
function subscribe(onChange: () => void): () => void {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}
const isImmersive = () => document.documentElement.classList.contains("immersive");
const onServer = () => false;

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

interface CaptionsProps {
  projects: HeroProject[];
  current: number;
}

/** One caption per project, shown while its panel is the one ahead; the last one closes the flight. */
function Captions({ projects, current }: CaptionsProps) {
  const closing = current === projects.length;
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {projects.map((p, i) => {
        const on = current === i;
        return (
          <div
            key={p.slug}
            data-on={on}
            aria-hidden={!on}
            inert={!on}
            className={cn(
              "hero-caption absolute bottom-[var(--margin)] left-[var(--margin)] max-w-[min(38rem,calc(100%-2*var(--margin)))]",
              i % 2 === 0 && "md:right-[var(--margin)] md:left-auto md:text-right",
            )}
          >
            <p className="text-[0.9375rem] font-medium text-brand-ink">{p.category}</p>
            <p className="mt-2 text-[clamp(1.75rem,3vw,2.875rem)] leading-[1.05] font-medium tracking-[-0.03em] text-balance text-ink">
              {p.title}
            </p>
            <Link href={`/work/${p.slug}`} className="link pointer-events-auto mt-4 inline-flex min-h-11 items-center font-medium text-ink">
              View the project<span className="sr-only">: {p.title}</span>
            </Link>
          </div>
        );
      })}
      <div
        data-on={closing}
        aria-hidden={!closing}
        inert={!closing}
        className="hero-caption absolute inset-x-[var(--margin)] bottom-[var(--margin)] flex flex-col items-center text-center"
      >
        <p className="text-[clamp(1.75rem,3vw,2.875rem)] leading-[1.05] font-medium tracking-[-0.03em] text-ink">Yours could be next.</p>
        <Link href="/work" className="link pointer-events-auto mt-5 inline-flex min-h-11 items-center font-medium text-ink">
          See all the work
        </Link>
      </div>
    </div>
  );
}

interface Hero3DProps {
  projects: HeroProject[];
  labelledBy: string;
  /** The static first screen: shown at once, kept as the fallback, faded as the flight begins. */
  children: ReactNode;
}

/**
 * A pinned stage that turns the hero into a flight: the mark lifts off the page in 3D, comes
 * apart, and the camera flies past one panel per shipped app before reaching the name. The
 * static hero is the first paint, the no-WebGL version and the reduced-motion version.
 */
export function Hero3D({ projects, labelledBy, children }: Hero3DProps) {
  const supported = useSyncExternalStore(subscribe, isImmersive, onServer);
  const count = projects.length;
  const immersive = supported && count > 0;
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [caption, setCaption] = useState(-1);

  const onReady = useCallback(() => setReady(true), []);
  // A lost GPU context brings the flat mark back until the browser restores it.
  const onContext = useCallback((lost: boolean) => setReady(!lost), []);
  const onFail = useCallback(() => {
    document.documentElement.classList.remove("immersive");
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, []);

  // Render only while the hero is on screen. A layout effect so the cleanup also runs when Next
  // keeps this route mounted but hidden (<Activity>) after navigating away.
  useLayoutEffect(() => {
    const el = section.current;
    if (!immersive || !el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const last = entries.at(-1);
        if (last) setRunning(last.isIntersecting);
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      setRunning(false);
    };
  }, [immersive]);

  useGSAP(
    () => {
      const el = section.current;
      if (!immersive || !el) return;
      const sync = (self: ScrollTrigger) => {
        heroState.progress = self.progress;
      };
      // The flight ends one screen before the runway does: that last screen is the light page
      // rising over the finished scene (.curtain on the home page).
      const trigger = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: () => `bottom bottom+=${window.innerHeight}`,
        onUpdate: sync,
        onRefresh: sync,
      });
      gsap
        .timeline({ scrollTrigger: { trigger: el, start: "top top", end: () => `+=${window.innerHeight * 0.3}`, scrub: true } })
        .to("[data-hero-copy]", { autoAlpha: 0, y: -48, ease: "none" }, 0);
      ScrollTrigger.refresh();
      // onUpdate only fires on change, so take the starting position (a return visit, a restored scroll) now.
      sync(trigger);
      return () => {
        heroState.progress = 0;
        heroState.smooth = 0;
      };
    },
    { scope: section, dependencies: [immersive, count], revertOnUpdate: true },
  );

  return (
    <section
      ref={section}
      data-hero
      data-3d={immersive && ready ? "ready" : undefined}
      aria-labelledby={labelledBy}
      className="hero relative -mt-20"
      style={{ "--runway": immersive ? `${230 + count * 40}svh` : "200svh" } as React.CSSProperties}
    >
      <div ref={stage} className="hero-stage relative overflow-hidden">
        {immersive ? (
          <div className="hero-canvas absolute inset-0" aria-hidden="true">
            <SceneBoundary onError={onFail}>
              <HeroScene
                panels={projects.map((p) => p.src)}
                stage={stage}
                running={running}
                onReady={onReady}
                onCaption={setCaption}
                onContext={onContext}
              />
            </SceneBoundary>
          </div>
        ) : null}
        {children}
        {immersive ? <Captions projects={projects} current={ready ? caption : -1} /> : null}
      </div>
    </section>
  );
}
