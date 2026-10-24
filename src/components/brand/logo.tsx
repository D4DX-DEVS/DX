import logoFull from "@/assets/brand/logo.webp";
import logo160 from "@/assets/brand/logo-160.webp";
import logo320 from "@/assets/brand/logo-320.webp";
import { MARK, WORDMARK } from "./paths";

// The main logo: the supplied artwork (the blue mark with D4DX set in white for dark grounds), kept as
// lossless WebP at three widths so every screen density gets a copy close to the size it is drawn at, which
// keeps the thin letters sharp. A plain <img> on purpose: next/image would recompress it.
const SRC_SET = `${logo160.src} 160w, ${logo320.src} 320w, ${logoFull.src} 448w`;

interface LogoProps {
  className?: string;
  title?: string;
  /** The width it is drawn at, for choosing a file (the default suits the header and footer). */
  sizes?: string;
}

/** The D4DX logo, for dark grounds. Size it by height (`h-8 w-auto`). */
export function Logo({ className, title = "D4DX", sizes = "160px" }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoFull.src}
      srcSet={SRC_SET}
      sizes={sizes}
      width={logoFull.width}
      height={logoFull.height}
      alt={title}
      decoding="async"
      className={className}
    />
  );
}

/** Just the mark, for small places (favicons are generated from the original artwork). */
export function MarkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${MARK.width} ${MARK.height}`} className={className} aria-hidden="true" fill="currentColor">
      <path d={MARK.body.d} />
      <path d={MARK.top.d} />
      <path d={MARK.notch.d} />
      <path d={MARK.bottom.d} />
    </svg>
  );
}

/** The wordmark alone, as one outline: used where the name is set as a monument. */
export function Wordmark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox={`0 0 ${WORDMARK.width} ${WORDMARK.height}`}
      className={className}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d={WORDMARK.d} />
    </svg>
  );
}

/**
 * The mark in the logo's blue, lit from the top left as the original artwork is, with a
 * brighter notch. `id` keeps the gradients apart when the mark appears twice on a page.
 */
export function BlueMark({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox={`0 0 ${MARK.width} ${MARK.height}`} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5b82ff" />
          <stop offset="55%" stopColor="#2d50d2" />
          <stop offset="100%" stopColor="#1c3497" />
        </linearGradient>
        <linearGradient id={`${id}-notch`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9fb6ff" />
          <stop offset="100%" stopColor="#4d6dff" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id}-fill)`}>
        <path d={MARK.body.d} />
        <path d={MARK.top.d} />
        <path d={MARK.bottom.d} />
      </g>
      <path d={MARK.notch.d} fill={`url(#${id}-notch)`} />
    </svg>
  );
}
