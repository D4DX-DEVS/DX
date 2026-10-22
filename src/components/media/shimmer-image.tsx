"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Media } from "@/lib/types";

interface ShimmerImageProps {
  media: Media;
  sizes: string;
  alt?: string;
  /** Fill the parent box (parent must be positioned and sized). Otherwise uses the image ratio. */
  fill?: boolean;
  preload?: boolean;
  className?: string;
  imgClassName?: string;
  quality?: 70 | 80;
  style?: React.CSSProperties;
}

/**
 * The box shimmers until its picture has arrived, then the picture fades in, so text that
 * has already streamed in reads at once while each image finishes on its own.
 */
export function ShimmerImage({ media, sizes, alt, fill, preload, className, imgClassName, quality = 80, style }: ShimmerImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, [media.url]);

  return (
    <div
      className={cn("relative overflow-hidden", !loaded && "shimmer", className)}
      style={fill ? style : { aspectRatio: `${media.width} / ${media.height}`, ...style }}
    >
      <Image
        ref={ref}
        src={media.url}
        alt={alt ?? media.alt}
        sizes={sizes}
        quality={quality}
        preload={preload}
        loading={preload ? "eager" : "lazy"}
        {...(fill ? { fill: true } : { width: media.width, height: media.height })}
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-500 ease-out",
          !loaded && "in-[.js]:opacity-0",
          imgClassName,
        )}
      />
    </div>
  );
}
