import Link from "next/link";
import { cn } from "@/lib/utils";

export interface HeroProject {
  title: string;
  slug: string;
  category: string;
  src: string;
  /** The project's icon or logo, drawn over its picture. */
  icon: string | null;
}

/**
 * A fingerprint of the projects the banner shows (which, in what order, with which picture and icon). The recorded
 * video carries the one it was made from; when the site's projects no longer match it, the page stops using the
 * old recording and shows the live 3D flight, which always follows the current projects.
 */
export function heroSignature(projects: HeroProject[]): string {
  return projects.map((p) => [p.slug, p.src, p.icon ?? ""].join("|")).join(";");
}

interface CaptionsProps {
  projects: HeroProject[];
  current: number;
}

/** One caption per project, shown while its panel is the one ahead; the last one closes the flight. */
export function Captions({ projects, current }: CaptionsProps) {
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
              "hero-caption absolute bottom-[8.25rem] left-[var(--margin)] max-w-[min(26rem,calc(100%-2*var(--margin)))] md:bottom-[var(--margin)]",
              i % 2 === 0 &&
                "md:right-[var(--margin)] md:left-auto md:text-right",
            )}
          >
            <p className="text-[0.8125rem] font-medium text-brand-ink">
              {p.category}
            </p>
            <p className="mt-1 text-[clamp(1.125rem,1.7vw,1.5rem)] leading-[1.15] font-medium tracking-[-0.02em] text-balance text-ink">
              {p.title}
            </p>
            <Link
              href={`/work/${p.slug}`}
              className="link pointer-events-auto mt-2 inline-flex min-h-11 items-center text-sm font-medium text-ink"
            >
              View the project<span className="sr-only">: {p.title}</span>
            </Link>
          </div>
        );
      })}
      <div
        data-on={closing}
        aria-hidden={!closing}
        inert={!closing}
        className="hero-caption absolute inset-x-[var(--margin)] bottom-[8.25rem] flex flex-col items-center text-center md:bottom-[calc(var(--margin)+4rem)]"
      >
        <p className="text-[clamp(1.125rem,1.7vw,1.5rem)] leading-[1.15] font-medium tracking-[-0.02em] text-ink">
          Yours could be next.
        </p>
        <Link
          href="/work"
          className="link pointer-events-auto mt-2 inline-flex min-h-11 items-center text-sm font-medium text-ink"
        >
          See all the work
        </Link>
      </div>
    </div>
  );
}
