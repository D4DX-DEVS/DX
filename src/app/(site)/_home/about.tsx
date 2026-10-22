import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { BlueMark, Wordmark } from "@/components/brand/logo";
import { Reveal } from "@/components/motion/reveal";

const VALUES = ["Ideas", "Technology", "People", "Impact"];

/** Who the studio is, in a sentence, beside the logo set large. */
export function About() {
  return (
    <section aria-labelledby="about-title" className="frame pt-[var(--section-gap)]">
      <Reveal className="grid grid-cols-1 items-center gap-y-12 md:grid-cols-12 md:gap-x-[var(--gutter)]">
        <div className="md:col-span-6 lg:col-span-5">
          <p data-reveal className="eyebrow">
            About D4DX
          </p>
          <h2 id="about-title" data-reveal className="mt-3 text-[length:var(--step-head)] leading-tight font-semibold tracking-[-0.02em]">
            D4DX <span className="text-brand-ink">Innovations LLP</span>
          </h2>
          <p data-reveal className="mt-5 max-w-[52ch] text-[length:var(--step-lead)] leading-relaxed text-soft">
            An IT services and consulting company on Mavoor Road in Calicut. We design and build apps, websites, ERP and SaaS
            for organisations across sectors, and we stay on after launch to keep them running.
          </p>
          <Link data-reveal href="/about" className="btn btn-outline mt-8">
            Know more about us
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div data-reveal className="flex items-center justify-center gap-8 sm:gap-12 md:col-span-6 md:col-start-7 lg:col-span-6 lg:col-start-7">
          <div className="flex flex-col items-center">
            <BlueMark id="about-mark" className="w-[min(44vw,15rem)] drop-shadow-[0_24px_48px_rgb(45_80_210/0.28)]" />
            <Wordmark className="mt-6 h-8 w-auto text-ink sm:h-10" title="D4DX" />
            <p className="mt-2 text-[0.75rem] font-medium tracking-[0.32em] text-soft uppercase">Innovations LLP</p>
          </div>
          <ul aria-label="What we stand for" className="hidden flex-col gap-4 border-l border-border pl-8 lg:flex">
            {VALUES.map((v) => (
              <li key={v} className="text-[0.8125rem] font-medium tracking-[0.24em] text-soft uppercase">
                {v}
              </li>
            ))}
            <li aria-hidden="true" className="mt-1 h-0.5 w-8 rounded-full bg-brand" />
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
