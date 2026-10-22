"use client";

import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Media, ProjectReel } from "@/lib/types";
import { cn } from "@/lib/utils";

const FRAME_MS = 2600;

export interface ShowreelTab {
  slug: string;
  label: string;
}

const REDUCED = "(prefers-reduced-motion: reduce)";
function onReducedChange(notify: () => void): () => void {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
}
const prefersReduced = () => window.matchMedia(REDUCED).matches;
const onServer = () => false;

interface ShowreelProps {
  projects: ProjectReel[];
  tabs: ShowreelTab[];
}

/** One screen on the stage. A new key mounts it, which plays the cut-in. */
function Frame({ media, live, className }: { media: Media; live: boolean; className?: string }) {
  return (
    <div className={cn("absolute inset-0", className)} data-live={live}>
      <Image src={media.url} alt="" fill sizes="(min-width: 1024px) 62vw, 100vw" quality={80} className="showreel-img object-cover" />
    </div>
  );
}

/**
 * The work as a showreel: a 4:3 stage (the shape of every project screen, so nothing is
 * cropped) plays each project's screens in turn, then moves to the next project, with a
 * playlist beside it to jump between them. Pauses off screen and on request; under reduced
 * motion it holds still and the controls step through by hand.
 */
export function Showreel({ projects, tabs }: ShowreelProps) {
  const root = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("all");
  const [project, setProject] = useState(0);
  const [frame, setFrame] = useState(0);
  const [previous, setPrevious] = useState<Media | null>(null);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduced = useSyncExternalStore(onReducedChange, prefersReduced, onServer);
  // Bumped whenever playback restarts, so the progress bar restarts with the timer.
  const [run, setRun] = useState(0);

  const list = projects.filter((p) => filter === "all" || p.category.slug === filter);
  const current = list[Math.min(project, list.length - 1)];
  const frames = current?.frames ?? [];
  const shown = frames[Math.min(frame, frames.length - 1)];
  const playing = visible && !paused && !reduced && list.length > 0;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const go = (nextProject: number, nextFrame: number) => {
    if (shown) setPrevious(shown);
    setProject(nextProject);
    setFrame(nextFrame);
    setRun((r) => r + 1);
  };

  const step = (direction: 1 | -1) => {
    if (!list.length) return;
    if (direction === 1) {
      if (frame < frames.length - 1) go(project, frame + 1);
      else go((project + 1) % list.length, 0);
    } else if (frame > 0) {
      go(project, frame - 1);
    } else {
      const back = (project - 1 + list.length) % list.length;
      go(back, Math.max(0, (list[back]?.frames.length ?? 1) - 1));
    }
  };

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => step(1), FRAME_MS);
    return () => window.clearTimeout(id);
    // step reads the latest state each render; the timer restarts on every cut.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, project, frame, run, filter]);

  const choose = (i: number) => go(i, 0);
  const pick = (slug: string) => {
    setFilter(slug);
    setPrevious(null);
    setProject(0);
    setFrame(0);
    setRun((r) => r + 1);
  };

  if (!current || !shown) {
    return <p className="mt-8 text-soft">Projects will appear here once they are published from the admin.</p>;
  }

  return (
    <div ref={root}>
      <div role="group" aria-label="Filter projects by kind" className="mt-8 flex flex-wrap gap-2">
        {[{ slug: "all", label: "All projects" }, ...tabs].map((t) => {
          const on = t.slug === filter;
          return (
            <button
              key={t.slug}
              type="button"
              aria-pressed={on}
              onClick={() => pick(t.slug)}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-5 text-[0.9375rem] font-medium transition-colors duration-200 active:scale-[0.97]",
                on ? "bg-brand text-on-brand" : "bg-raised text-ink hover:bg-accent",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-[var(--gutter)]">
        {/* The player. */}
        <div className="lg:col-span-8">
          <Link
            href={`/work/${current.slug}`}
            aria-label={`Open ${current.title}`}
            className="showreel-stage group relative block aspect-[4/3] overflow-hidden rounded-3xl bg-[#070a12]"
            data-playing={playing}
            style={{ "--frame": `${FRAME_MS}ms` } as React.CSSProperties}
          >
            {previous && previous.url !== shown.url ? <Frame key={`prev-${previous.url}`} media={previous} live={false} className="showreel-under" /> : null}
            <Frame key={`${run}-${shown.url}`} media={shown} live className="showreel-in" />
            <div aria-hidden="true" className="absolute inset-x-5 top-5 z-10 flex gap-1.5 sm:inset-x-6 sm:top-6">
              {frames.map((f, i) => (
                <span key={f.url} className="h-1 flex-1 overflow-hidden rounded-full bg-black/30">
                  <span
                    key={i === frame ? `on-${run}` : "rest"}
                    className="showreel-bar block h-full rounded-full bg-white"
                    data-state={i < frame ? "done" : i === frame ? "on" : "todo"}
                  />
                </span>
              ))}
            </div>
            <span
              aria-hidden="true"
              className="absolute right-5 bottom-5 z-10 grid size-12 place-items-center rounded-full bg-white text-ink opacity-0 transition-[opacity,transform] duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 sm:right-6 sm:bottom-6"
            >
              <ArrowUpRight className="size-5" />
            </span>
          </Link>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <div key={current.slug} className="min-w-0 motion-safe:animate-[load-rise_420ms_var(--ease-out)_both]">
              <p className="text-sm font-semibold text-brand-ink">{current.category.name}</p>
              <h3 className="mt-1 text-[clamp(1.5rem,2.2vw,2rem)] leading-tight font-semibold tracking-[-0.02em]">
                <Link href={`/work/${current.slug}`} className="link decoration-transparent hover:decoration-current">
                  {current.title}
                </Link>
              </h3>
              {current.client ? <p className="mt-1 text-soft">{current.client}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => step(-1)} aria-label="Previous screen" className="showreel-control">
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              {!reduced ? (
                <button
                  type="button"
                  onClick={() => {
                    setPaused((p) => !p);
                    setRun((r) => r + 1);
                  }}
                  aria-label={paused ? "Play the showreel" : "Pause the showreel"}
                  aria-pressed={paused}
                  className="showreel-control showreel-control-main"
                >
                  {paused ? <Play className="size-5 translate-x-px" aria-hidden="true" /> : <Pause className="size-5" aria-hidden="true" />}
                </button>
              ) : null}
              <button type="button" onClick={() => step(1)} aria-label="Next screen" className="showreel-control">
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* The playlist: every project, the playing one lit with its progress. */}
        <ol
          aria-label="Projects in the showreel"
          className="-mx-[var(--margin)] flex snap-x snap-mandatory gap-3 overflow-x-auto [scrollbar-width:none] px-[var(--margin)] pb-2 lg:col-span-4 lg:mx-0 lg:flex-col lg:gap-2 lg:overflow-visible lg:px-0 lg:pb-0"
        >
          {list.map((p, i) => {
            const on = i === project;
            return (
              <li key={p.id} className="w-60 shrink-0 snap-start lg:w-auto">
                <button
                  type="button"
                  onClick={() => choose(i)}
                  aria-current={on ? "true" : undefined}
                  className={cn("showreel-item group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl p-2.5 pr-4 text-left", on ? "bg-raised" : "hover:bg-raised/70")}
                >
                  <span className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl bg-raised-2">
                    <Image
                      src={p.cover.url}
                      alt=""
                      fill
                      sizes="96px"
                      quality={70}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate font-semibold leading-tight", on ? "text-ink" : "text-ink/80")}>{p.title}</span>
                    <span className="mt-1 block truncate text-sm text-soft">{p.category.name}</span>
                  </span>
                  {on ? (
                    <span aria-hidden="true" className="absolute inset-x-2.5 bottom-0 h-0.5 overflow-hidden rounded-full bg-border">
                      <span className="block h-full bg-brand transition-[width] duration-500" style={{ width: `${((frame + 1) / p.frames.length) * 100}%` }} />
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
