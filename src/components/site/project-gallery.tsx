"use client";

import { useState } from "react";
import { ShimmerImage } from "@/components/media/shimmer-image";
import { Reveal } from "@/components/motion/reveal";
import type { Media } from "@/lib/types";
import { Lightbox } from "./lightbox";

/** The project's screens, three across, each lifted with a shadow and opening full size on click. */
export function ProjectGallery({ images, title }: { images: Media[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <Reveal stagger={0.05} className="grid grid-cols-2 items-start gap-4 sm:grid-cols-3 sm:gap-6">
        {images.map((m, i) => (
          <div key={m.url} data-reveal>
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Open ${title}, screen ${i + 1}, full size`}
              className="group block w-full cursor-zoom-in overflow-hidden rounded-2xl text-left shadow-[0_22px_50px_-22px_rgb(11_20_48/0.55)] ring-1 ring-black/5 transition-[transform,box-shadow] duration-300 ease-[var(--ease-out)] hover:-translate-y-1 hover:shadow-[0_30px_60px_-24px_rgb(11_20_48/0.6)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              <ShimmerImage
                media={m}
                alt={m.alt || `${title}, screen ${i + 1}`}
                sizes="(min-width: 1400px) 440px, (min-width: 640px) 33vw, 50vw"
                className="bg-raised-2"
                imgClassName="transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.03]"
              />
            </button>
          </div>
        ))}
      </Reveal>
      <Lightbox images={images} index={open} onIndex={setOpen} label={`${title} screens`} />
    </>
  );
}
