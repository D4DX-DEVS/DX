"use client";

import { ArrowUpRight } from "@/components/icons";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ShimmerImage } from "@/components/media/shimmer-image";
import type { ProjectCard } from "@/lib/types";

const BATCH = 9;

/**
 * Every project on one page, drawn nine at a time: the next nine appear as the page nears its end, and
 * each picture loads only when it is close to the screen. A button does the same for anyone who prefers it.
 */
export function WorkFeed({ projects }: { projects: ProjectCard[] }) {
  const [shown, setShown] = useState(Math.min(BATCH, projects.length));
  const end = useRef<HTMLDivElement>(null);
  const more = shown < projects.length;

  useEffect(() => {
    const el = end.current;
    if (!el || !more) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setShown((n) => Math.min(projects.length, n + BATCH));
      },
      { rootMargin: "700px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [more, shown, projects.length]);

  return (
    <>
      <ul className="grid grid-cols-1 gap-x-4 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-5">
        {projects.slice(0, shown).map((p, i) => (
          <li key={p.id} className="feed-in min-w-0" style={{ animationDelay: `${(i % BATCH) * 55}ms` }}>
            <Link href={`/work/${p.slug}`} className="group block rounded-3xl">
              <div className="relative">
                <ShimmerImage
                  media={p.cover}
                  alt=""
                  fill
                  preload={i < 3}
                  sizes="(min-width: 1024px) 31vw, (min-width: 640px) 48vw, 100vw"
                  className="aspect-[4/3] rounded-3xl bg-raised ring-1 ring-black/5 transition-[transform,box-shadow] duration-500 ease-[var(--ease-out)] group-hover:-translate-y-1 group-hover:shadow-[0_26px_50px_-24px_rgb(45_80_210/0.55)]"
                  imgClassName="transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.04]"
                />
                <span
                  aria-hidden="true"
                  className="absolute top-4 right-4 grid size-11 translate-y-1 place-items-center rounded-full bg-white text-[#070a12] opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
                >
                  <ArrowUpRight className="size-5" />
                </span>
              </div>
              <p className="mt-4 truncate text-[1.0625rem] leading-tight font-semibold transition-colors group-hover:text-brand-ink">{p.title}</p>
              <p className="mt-1 text-sm text-soft num">
                {p.category.name}
                {p.year ? `, ${p.year}` : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      <div ref={end} aria-hidden="true" className="h-px" />
      <p className="mt-8 text-center text-sm text-soft" aria-live="polite">
        {more ? (
          <button type="button" onClick={() => setShown((n) => Math.min(projects.length, n + BATCH))} className="btn btn-outline">
            Show more projects
          </button>
        ) : projects.length > BATCH ? (
          <>That is all {projects.length} projects.</>
        ) : null}
      </p>
    </>
  );
}
