import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { getProjectIndex, getTestimonials } from "@/lib/data/public";
import type { ProjectIndexEntry, TestimonialDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  return name
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

// Wide and narrow cards alternate row by row; a card left alone on the last row takes it whole.
const SPANS = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"];

function spanFor(i: number, count: number): string {
  return count % 2 === 1 && i === count - 1 ? "lg:col-span-12" : SPANS[i % SPANS.length];
}

interface VoiceProps {
  voice: TestimonialDTO;
  project: ProjectIndexEntry | undefined;
  lead: boolean;
  span: string;
}

function Voice({ voice, project, lead, span }: VoiceProps) {
  return (
    <figure
      data-reveal
      className={cn("flex h-full flex-col rounded-3xl p-6 sm:p-8 md:p-10", lead ? "bg-brand text-white" : "bg-raised text-ink", span)}
    >
      <span aria-hidden="true" className={cn("text-[4rem] leading-[0.6] font-semibold", lead ? "text-white/40" : "text-brand-ink")}>
        “
      </span>
      <blockquote
        className={cn(
          "mt-4 font-medium tracking-[-0.02em] text-balance",
          lead ? "text-[clamp(1.375rem,2.3vw,2.125rem)] leading-[1.25]" : "text-[clamp(1.125rem,1.6vw,1.375rem)] leading-[1.4]",
        )}
      >
        {voice.quote}
      </blockquote>
      {voice.context ? <p className={cn("mt-4 max-w-[48ch] leading-relaxed", lead ? "text-white/80" : "text-soft")}>{voice.context}</p> : null}
      <figcaption className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-3 pt-8">
        <span
          aria-hidden="true"
          className={cn("grid size-11 place-items-center rounded-full text-sm font-semibold", lead ? "bg-white/15" : "bg-raised-2")}
        >
          {initials(voice.name)}
        </span>
        <span className="mr-auto leading-snug">
          <span className="block font-semibold">{voice.name}</span>
          <span className={cn("block text-[0.9375rem]", lead ? "text-white/80" : "text-soft")}>{voice.role}</span>
        </span>
        {project ? (
          <Link
            href={`/work/${project.slug}`}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[0.9375rem] font-medium transition-colors",
              lead ? "bg-white/15 hover:bg-white/25" : "bg-raised-2 hover:bg-accent",
            )}
          >
            {project.title}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </figcaption>
    </figure>
  );
}

/** What clients say, in their words: the lead voice on the brand's blue, the next beside it. */
export async function Voices() {
  const [voices, index] = await Promise.all([getTestimonials(), getProjectIndex()]);
  if (!voices.length) return null;
  const bySlug = new Map(index.map((p) => [p.slug, p]));
  const shown = voices.slice(0, 4);

  return (
    <section aria-labelledby="voices-title" className="frame pt-[var(--section-gap)]">
      <Reveal stagger={0.1}>
        <h2 id="voices-title" data-reveal className="text-[length:var(--step-head)] leading-tight font-semibold tracking-[-0.02em]">
          In their words
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
          {shown.map((v, i) => (
            <Voice key={v.id} voice={v} project={bySlug.get(v.projectSlug)} lead={i === 0} span={spanFor(i, shown.length)} />
          ))}
        </div>
      </Reveal>
    </section>
  );
}
