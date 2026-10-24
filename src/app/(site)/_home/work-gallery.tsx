"use client";

import { ArrowUpRight } from "@/components/icons";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ProjectReel } from "@/lib/types";
import { cn } from "@/lib/utils";

const SHOWN = 6;
const PLAY_MS = 2600;
const PLAY_FAST_MS = 1100;

export interface WorkTab {
  slug: string;
  label: string;
}

/** Colour pairs for the light that circles a card: its body, then its bright head. */
const LIGHTS: [string, string][] = [
  ["#2d50d2", "#96b2ff"],
  ["#7c3aed", "#c4b5fd"],
  ["#0891b2", "#67e8f9"],
  ["#059669", "#6ee7b7"],
  ["#ea580c", "#fdba74"],
  ["#db2777", "#f9a8d4"],
  ["#ca8a04", "#fde047"],
];

/**
 * A look for one card's border light: a colour, a speed between 3.5 and 9.5 seconds a turn, a head start
 * and a direction. Everything is drawn from the projects' ids, so it varies from card to card yet is the
 * same on the server and the client (no mismatch). Colours step through the palette by 3 (coprime with
 * its 7 entries), so the first seven cards never repeat one; `seed` shifts where that walk starts.
 */
function hashOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function lightFor(id: string, index: number, seed: number): React.CSSProperties {
  const h = hashOf(id);
  const [c1, c2] = LIGHTS[(seed + index * 3) % LIGHTS.length]!;
  return {
    "--c1": c1,
    "--c2": c2,
    "--dur": `${(3.5 + ((h >>> 8) % 61) / 10).toFixed(1)}s`,
    "--delay": `-${(((h >>> 16) % 90) / 10).toFixed(1)}s`,
    "--dir": (h >>> 24) % 2 ? "reverse" : "normal",
  } as React.CSSProperties;
}

const REDUCED = "(prefers-reduced-motion: reduce)";
function onReducedChange(notify: () => void): () => void {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
}
const prefersReduced = () => window.matchMedia(REDUCED).matches;
const onServer = () => false;

/**
 * One project: its video plays muted on a loop behind the title, or, with no video, its screens
 * play in turn like a short reel (faster while the pointer is on it). Either runs only while the
 * card is on screen, and screens load as the reel reaches them.
 */
function WorkCard({ project, index, seed }: { project: ProjectReel; index: number; seed: number }) {
  const root = useRef<HTMLAnchorElement>(null);
  const clip = useRef<HTMLVideoElement>(null);
  const at = useRef(0);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [hover, setHover] = useState(false);
  const [frame, setFrame] = useState(0);
  const [seen, setSeen] = useState(1);
  const [clipReady, setClipReady] = useState(false);
  const reduced = useSyncExternalStore(onReducedChange, prefersReduced, onServer);
  const frames = project.frames;
  const count = frames.length;
  const hasVideo = project.video !== "";
  const playing = visible && !reduced && count > 1 && !hasVideo;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const on = Boolean(entry?.isIntersecting);
        setVisible(on);
        if (on) {
          setEntered(true);
          setSeen((s) => Math.max(s, Math.min(count, 2)));
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [count]);

  useEffect(() => {
    const v = clip.current;
    if (!v) return;
    // It may have become playable before hydration, when onCanPlay could not be heard.
    if (v.readyState >= 3) setClipReady(true);
    if (visible && !reduced) v.play().catch(() => undefined);
    else v.pause();
  }, [visible, reduced]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const next = (at.current + 1) % count;
      at.current = next;
      setFrame(next);
      setSeen((s) => Math.max(s, Math.min(count, next + 2)));
    }, hover ? PLAY_FAST_MS : PLAY_MS);
    return () => window.clearInterval(id);
  }, [playing, hover, count]);

  return (
    <li
      className={cn(
        "min-w-0 transition-[opacity,transform] duration-700 ease-[var(--ease-out)]",
        entered ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      )}
      style={{ transitionDelay: entered ? `${(index % 3) * 90}ms` : "0ms" }}
    >
      <Link
        ref={root}
        href={`/work/${project.slug}`}
        style={lightFor(project.id, index, seed)}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        className="work-card group relative block overflow-hidden rounded-2xl bg-[#0b1226] p-[2px] sm:rounded-[2rem] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        <span aria-hidden="true" className="work-spin" />
        <span className="relative block aspect-[4/3.35] overflow-hidden rounded-[calc(1rem-2px)] bg-raised sm:rounded-[calc(2rem-2px)]">
          {frames.slice(0, seen).map((m, i) => (
            <Image
              key={m.url}
              src={m.url}
              alt=""
              fill
              sizes="(min-width: 1024px) 31vw, 48vw"
              quality={80}
              data-on={i === frame}
              className="work-frame object-cover"
            />
          ))}
          {hasVideo ? (
            <video
              ref={clip}
              src={project.video}
              poster={frames[0]?.url}
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
              tabIndex={-1}
              onCanPlay={() => setClipReady(true)}
              className={cn("absolute inset-0 size-full object-cover transition-opacity duration-700", clipReady ? "opacity-100" : "opacity-0")}
            />
          ) : null}
          <span aria-hidden="true" className="work-sheen" />
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

          <span className="absolute top-2.5 left-2.5 z-[3] max-w-[calc(100%-1.25rem)] truncate rounded-full bg-black/60 px-2.5 py-1 text-[0.625rem] font-semibold tracking-[0.06em] text-white uppercase ring-1 ring-white/15 sm:top-4 sm:left-4 sm:px-3.5 sm:py-1.5 sm:text-xs">
            {project.category.name}
          </span>
          {count > 1 && !hasVideo ? (
            <span aria-hidden="true" className="absolute top-[1.375rem] right-5 z-[3] hidden items-center gap-1.5 sm:flex">
              {frames.map((m, i) => (
                <span key={m.url} className={cn("h-1.5 rounded-full bg-white transition-all duration-500", i === frame ? "w-5 opacity-100" : "w-1.5 opacity-40")} />
              ))}
            </span>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 z-[3] flex items-end justify-between gap-4 p-3 sm:p-6">
            <div className="min-w-0">
              <h3 className="work-title truncate text-[0.9375rem] leading-tight sm:text-[1.375rem] font-semibold tracking-[-0.01em] text-white">{project.title}</h3>
              <p className="mt-1 hidden truncate text-sm text-white/70 sm:mt-1.5 sm:block">
                {project.client || project.category.name}
                {project.year ? <span className="num">{`, ${project.year}`}</span> : null}
              </p>
            </div>
            <span aria-hidden="true" className="work-arrow hidden size-12 shrink-0 place-items-center sm:grid place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/30">
              <ArrowUpRight className="size-5" />
            </span>
          </div>
        </span>
      </Link>
    </li>
  );
}

/** The home page's projects: kind filters over a grid of three, each card a looping reel of the project's screens. */
export function WorkGallery({ projects, tabs }: { projects: ProjectReel[]; tabs: WorkTab[] }) {
  const [filter, setFilter] = useState("all");
  const list = (filter === "all" ? projects : projects.filter((p) => p.category.slug === filter)).slice(0, SHOWN);
  const seed = hashOf(projects.map((p) => p.id).join(""));

  if (!projects.length) {
    return <p className="mt-10 text-soft">Projects will appear here once they are published from the admin.</p>;
  }

  return (
    <div>
      <div role="group" aria-label="Filter projects by kind" className="no-scrollbar -mx-[var(--margin)] mt-6 flex gap-2 overflow-x-auto px-[var(--margin)] pb-1 sm:mx-0 sm:mt-8 sm:flex-wrap sm:gap-2.5 sm:overflow-visible sm:px-0 sm:pb-0">
        {[{ slug: "all", label: "All projects" }, ...tabs].map((t) => {
          const on = t.slug === filter;
          return (
            <button
              key={t.slug}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(t.slug)}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center rounded-full px-5 text-sm font-medium whitespace-nowrap sm:min-h-11 sm:px-6 sm:text-[0.9375rem] transition-[background-color,box-shadow,transform,color] duration-300 active:scale-[0.97]",
                on
                  ? "bg-brand text-on-brand shadow-[0_10px_30px_-10px_rgb(45_80_210/0.95)]"
                  : "text-ink/85 ring-1 ring-brand/45 hover:bg-brand/15 hover:text-ink hover:ring-brand/80",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <ul key={filter} className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-3 lg:gap-5">
        {list.map((p, i) => (
          <WorkCard key={p.id} project={p} index={i} seed={seed} />
        ))}
      </ul>
    </div>
  );
}
