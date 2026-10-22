import { ArrowRight, CircleCheck, Cloud, Layers, Monitor, Smartphone, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { getServices } from "@/lib/data/public";
import { SectionHead } from "./section-head";

export interface Look {
  icon: LucideIcon;
  /** Icon and link colour, readable on white. */
  ink: string;
  /** Tile behind the icon and the card's top edge. */
  tint: string;
}

const LOOKS: Record<string, Look> = {
  websites: { icon: Monitor, ink: "#2d50d2", tint: "#e7ecfd" },
  "mobile-apps": { icon: Smartphone, ink: "#0b7f58", tint: "#dcf5ea" },
  erp: { icon: Layers, ink: "#6d34d6", tint: "#eee6fd" },
  saas: { icon: Cloud, ink: "#0b6f8f", tint: "#dcf1f7" },
};

/** Each service's icon and colour, shared by the home cards and the services page. */
export function lookFor(slug: string): Look {
  return LOOKS[slug] ?? LOOKS.websites;
}

/**
 * What the studio builds: one card per service, each in its own colour. On hover the card lifts,
 * its colour washes in, the icon tilts and the rule under the points draws across.
 */
export async function Services() {
  const services = await getServices();
  if (!services.length) return null;

  return (
    <section aria-labelledby="services-title" className="frame pt-[var(--section-gap)]">
      <Reveal>
        <SectionHead
          id="services-title"
          eyebrow="Our services"
          title="What we do"
          lead="End-to-end digital services to help you build, grow and stay ahead, each one already shipped and in daily use."
        />
      </Reveal>

      <Reveal as="ul" stagger={0.08} className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {services.map((s, i) => {
          const look = lookFor(s.slug);
          const Icon = look.icon;
          return (
            <li
              key={s.id}
              data-reveal
              className="service-card group relative isolate flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-raised p-6 sm:p-7"
              style={{ "--ink-c": look.ink, "--tint": look.tint } as React.CSSProperties}
            >
              {/* A wash of the service's colour that rises in on hover, and its icon as a watermark. */}
              <span aria-hidden="true" className="service-wash pointer-events-none absolute inset-0 -z-10" />
              <Icon aria-hidden="true" strokeWidth={1} className="service-mark pointer-events-none absolute -right-8 -bottom-8 -z-10 size-44" />

              <div className="flex items-start justify-between">
                <span aria-hidden="true" className="service-icon relative grid size-14 place-items-center rounded-2xl text-white">
                  <span className="service-ping absolute inset-0 rounded-2xl" />
                  <Icon className="relative size-6" strokeWidth={1.75} />
                </span>
                <span className="text-sm font-semibold text-soft num">{String(i + 1).padStart(2, "0")}</span>
              </div>

              <h3 className="mt-6 text-xl leading-snug font-semibold tracking-[-0.01em]">{s.title}</h3>
              <p className="mt-2 line-clamp-3 leading-relaxed text-soft">{s.summary}</p>

              {s.points.length ? (
                <ul aria-label={`${s.title} includes`} className="mt-5 flex flex-col gap-2">
                  {s.points.slice(0, 3).map((point, n) => (
                    <li
                      key={point}
                      className="service-point flex items-center gap-2 text-[0.875rem] leading-snug"
                      style={{ "--n": n } as React.CSSProperties}
                    >
                      <CircleCheck className="size-4 shrink-0 text-[var(--ink-c)]" aria-hidden="true" />
                      <span className="truncate">{point}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-auto pt-6">
                <span aria-hidden="true" className="block h-px bg-border">
                  <span className="service-line block h-px bg-[var(--ink-c)]" />
                </span>
                <Link
                  href={`/services#${s.slug}`}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-between gap-3 text-[0.9375rem] font-semibold text-[var(--ink-c)] outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:outline-2 focus-visible:after:outline-[var(--ink-c)]"
                >
                  <span>
                    Learn more<span className="sr-only"> about {s.title}</span>
                  </span>
                  <span aria-hidden="true" className="service-arrow grid size-10 place-items-center overflow-hidden rounded-full">
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
              </div>
            </li>
          );
        })}
      </Reveal>
    </section>
  );
}
