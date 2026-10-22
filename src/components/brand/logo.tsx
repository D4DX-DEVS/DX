import { MARK, WORDMARK } from "./paths";

const WORD_SCALE = (MARK.height * 0.56) / WORDMARK.height;
const GAP = 150;
const WORD_X = MARK.width + GAP;
const WORD_Y = (MARK.height - WORDMARK.height * WORD_SCALE) / 2;
const WIDTH = Math.ceil(WORD_X + WORDMARK.width * WORD_SCALE);

interface LogoProps {
  className?: string;
  title?: string;
  /** "brand" draws the mark in the logo's blue, as the original artwork does; "mono" uses the text colour throughout. */
  tone?: "brand" | "mono";
}

/** The D4DX lockup: the four-panel mark beside the wordmark, which takes the current text colour. */
export function Logo({ className, title = "D4DX", tone = "brand" }: LogoProps) {
  return (
    <svg viewBox={`0 0 ${WIDTH} ${MARK.height}`} className={className} role="img" aria-label={title} fill="currentColor">
      <g fill={tone === "brand" ? "var(--brand-strong)" : undefined}>
        <path d={MARK.body.d} />
        <path d={MARK.top.d} />
        <path d={MARK.notch.d} />
        <path d={MARK.bottom.d} />
      </g>
      <path d={WORDMARK.d} transform={`translate(${WORD_X} ${WORD_Y}) scale(${WORD_SCALE})`} />
    </svg>
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
