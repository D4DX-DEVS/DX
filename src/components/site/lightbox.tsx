"use client";

import Image from "next/image";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useCallback, useEffect } from "react";
import { ArrowLeft, ArrowRight, XIcon } from "@/components/icons";
import type { Media } from "@/lib/types";

interface LightboxProps {
  images: Media[];
  /** Which image is open; null when closed. */
  index: number | null;
  onIndex: (index: number | null) => void;
  /** Used in each image's alt text and the dialog's name. */
  label: string;
}

const control =
  "grid size-11 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white";

/** A full-screen viewer for a set of pictures: arrows or the arrow keys to move, Escape or a click outside to close. */
export function Lightbox({ images, index, onIndex, label }: LightboxProps) {
  const open = index !== null;
  const count = images.length;
  const step = useCallback((by: number) => onIndex(index === null ? null : (index + by + count) % count), [index, count, onIndex]);

  useEffect(() => {
    if (!open || count < 2) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, count, step]);

  const media = index === null ? null : images[index];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onIndex(null)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-lenis-prevent
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Content
          data-lenis-prevent
          aria-describedby={undefined}
          onClick={(e) => e.target === e.currentTarget && onIndex(null)}
          className="fixed inset-0 z-50 grid place-items-center p-4 outline-none sm:p-10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95"
        >
          <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
          {media ? (
            <Image
              key={media.url}
              src={media.url}
              alt={media.alt || `${label}, picture ${(index ?? 0) + 1} of ${count}`}
              width={media.width}
              height={media.height}
              sizes="100vw"
              quality={80}
              className="max-h-[86svh] w-auto max-w-full rounded-2xl object-contain shadow-[0_30px_90px_-20px_rgb(0_0_0/0.8)]"
            />
          ) : null}
          <DialogPrimitive.Close className={`${control} absolute top-4 right-4`} aria-label="Close">
            <XIcon className="size-5" aria-hidden="true" />
          </DialogPrimitive.Close>
          {count > 1 ? (
            <>
              <button type="button" onClick={() => step(-1)} aria-label="Previous picture" className={`${control} absolute top-1/2 left-3 -translate-y-1/2 sm:left-6`}>
                <ArrowLeft className="size-5" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next picture" className={`${control} absolute top-1/2 right-3 -translate-y-1/2 sm:right-6`}>
                <ArrowRight className="size-5" aria-hidden="true" />
              </button>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm text-white num ring-1 ring-white/25 backdrop-blur">
                {(index ?? 0) + 1} / {count}
              </p>
            </>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
