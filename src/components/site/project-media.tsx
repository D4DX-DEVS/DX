"use client";

import { useEffect, useRef, useState } from "react";
import { ShimmerImage } from "@/components/media/shimmer-image";
import { Lightbox } from "@/components/site/lightbox";
import type { Media } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProjectMediaProps {
  cover: Media;
  /** "" when the project has no video. */
  video: string;
  title: string;
  className?: string;
}

/**
 * The project's picture at the head of its page: the designed cover, and over it the project's video
 * (muted, looping) once it can play. The video pauses while off screen. Without one, just the cover.
 */
export function ProjectMedia({ cover, video, title, className }: ProjectMediaProps) {
  const box = useRef<HTMLDivElement>(null);
  const clip = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    const v = clip.current;
    if (!el || !v) return;
    // The video may have become playable before this component hydrated, in which case onCanPlay never fires.
    if (v.readyState >= 3) setReady(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !reduced) v.play().catch(() => undefined);
      else v.pause();
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={box} className={cn("relative aspect-[4/3] overflow-hidden bg-raised", className)}>
      <ShimmerImage media={cover} alt={cover.alt || title} fill preload sizes="(min-width: 1100px) 1040px, 100vw" className="absolute inset-0 size-full" />
      {video ? (
        <video
          ref={clip}
          src={video}
          poster={cover.url}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={`${title}, in motion`}
          onCanPlay={() => setReady(true)}
          className={cn("absolute inset-0 size-full object-cover transition-opacity duration-700", ready ? "opacity-100" : "opacity-0")}
        />
      ) : (
        <>
          <button type="button" onClick={() => setZoom(0)} aria-label={`Open ${title} full size`} className="absolute inset-0 cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brand" />
          <Lightbox images={[cover]} index={zoom} onIndex={setZoom} label={title} />
        </>
      )}
    </div>
  );
}
