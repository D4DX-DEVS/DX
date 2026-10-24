import { Skeleton } from "@/components/ui/skeleton";
import { MARK } from "@/components/brand/paths";
import { TEAM_CELL, TEAM_ROW } from "@/components/site/team-grid";
import { cn } from "@/lib/utils";

/** Loading states for the public pages. Each one is the final layout with shimmer in place of data. */

export function Lines({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton
          key={i}
          className="shimmer-line h-4"
          style={{ width: `${i === count - 1 ? 62 : 100 - i * 6}%` }}
        />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  // The same runway as the hero, so the home page's curtain rises over it and not onto it.
  return (
    <div className="-mt-20 h-[200svh]">
      <section
        className="frame sticky top-0 grid min-h-svh grid-cols-1 content-center gap-y-10 pt-24 pb-[calc(var(--margin)*2)] md:grid-cols-12 md:gap-x-[var(--gutter)] md:pt-20"
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="order-2 md:order-1 md:col-span-6 lg:col-span-5">
          <Skeleton className="h-[clamp(2.25rem,4.4vw,4rem)] w-[90%] rounded-xl" />
          <Skeleton className="mt-3 h-[clamp(2.25rem,4.4vw,4rem)] w-[70%] rounded-xl" />
          <Lines count={2} className="mt-7 max-w-[38ch]" />
          <Skeleton className="mt-8 h-12 w-44 rounded-full" />
        </div>
        <div className="order-1 h-[min(50vw,220px)] justify-self-center md:order-2 md:col-span-6 md:h-[clamp(280px,52svh,520px)] md:justify-self-end lg:col-start-7">
          <svg
            viewBox={`0 0 ${MARK.width} ${MARK.height}`}
            className="h-full w-auto animate-pulse fill-raised"
          >
            <path d={MARK.body.d} />
            <path d={MARK.top.d} />
            <path d={MARK.notch.d} />
            <path d={MARK.bottom.d} />
          </svg>
        </div>
      </section>
    </div>
  );
}

/** Shaped like WorkGrid: 4:3 covers with a title and a kind beneath. */
export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-4"
      aria-busy="true"
    >
      {Array.from({ length: count }, (_, n) => (
        <div key={n} className="min-w-0">
          <Skeleton className="aspect-[4/3] rounded-xl" />
          <Skeleton className="shimmer-line mt-3 h-4 w-2/3" />
          <Skeleton className="shimmer-line mt-2 h-3.5 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function WorkSectionSkeleton() {
  return (
    <section
      className="theme-dark dark-band py-[clamp(2.5rem,5vw,4rem)]"
      aria-busy="true"
      aria-label="Loading work"
    >
      <div className="frame">
        <Skeleton className="shimmer-line h-9 w-56" />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/3.3] rounded-[2rem]" />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Shaped like the home page's team band: a heading over two rows of six portraits. */
export function TeamSkeleton() {
  return (
    <section
      className="theme-dark dark-band py-[clamp(2.5rem,5vw,4rem)]"
      aria-busy="true"
      aria-label="Loading team"
    >
      <div className="frame">
        <Skeleton className="shimmer-line h-9 w-72" />
        <div className={cn("mt-10", TEAM_ROW)}>
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className={cn("aspect-[4/5] rounded-[2.25rem]", TEAM_CELL)} />
          ))}
        </div>
      </div>
    </section>
  );
}

const SPANS = [
  "lg:col-span-7",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-7",
];

function Heading() {
  return <Skeleton className="shimmer-line h-8 w-52" />;
}

/** Shaped like the services bento: four cards, each a 16:10 picture over a title and text. */
export function BentoSkeleton() {
  return (
    <section
      className="frame pt-[var(--section-gap)]"
      aria-busy="true"
      aria-label="Loading"
    >
      <Heading />
      <div className="mt-8 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
        {SPANS.map((span, i) => (
          <div key={i} className={cn("rounded-3xl bg-raised p-3 sm:p-4", span)}>
            <Skeleton className="aspect-[16/10] rounded-xl" />
            <div className="px-2 pt-5 pb-2 sm:px-3">
              <Skeleton className="shimmer-line h-6 w-1/2" />
              <Lines count={2} className="mt-4" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Shaped like Voices: the wide lead card on blue and a narrower one beside it. */
export function VoicesSkeleton() {
  return (
    <section
      className="frame pt-[var(--section-gap)]"
      aria-busy="true"
      aria-label="Loading"
    >
      <Heading />
      <div className="mt-8 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
        <div className="min-h-72 rounded-3xl bg-brand/40 p-8 lg:col-span-7">
          <Lines count={3} />
        </div>
        <div className="min-h-72 rounded-3xl bg-raised p-8 lg:col-span-5">
          <Lines count={3} />
        </div>
      </div>
    </section>
  );
}

/** Shaped like Studio: the about card, the location card and the team strip. */
export function StudioSkeleton() {
  return (
    <section
      className="pt-[var(--section-gap)]"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="frame">
        <Heading />
        <div className="mt-8 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
          <div className="min-h-72 rounded-3xl bg-raised p-8 lg:col-span-7">
            <Lines count={4} />
          </div>
          <div className="overflow-hidden rounded-3xl bg-raised lg:col-span-5">
            <Skeleton className="aspect-[16/10] rounded-none" />
            <div className="p-8">
              <Lines count={2} />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-4 overflow-hidden py-4 pl-[var(--margin)]">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton
            key={i}
            className="aspect-[4/5] w-36 shrink-0 rounded-2xl sm:w-44"
          />
        ))}
      </div>
    </section>
  );
}
