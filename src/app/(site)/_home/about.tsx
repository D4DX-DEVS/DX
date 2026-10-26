import { ArrowRight } from "@/components/icons";
import Link from "next/link";
import { BlueMark, Wordmark } from "@/components/brand/logo";
import { Reveal } from "@/components/motion/reveal";
import { TitleFx } from "@/components/motion/title-fx";
import { BandLights } from "@/components/site/band-lights";

const VALUES = ["Ideas", "Technology", "People", "Impact"];

/**
 * Who the studio is, in a sentence, beside the logo set large inside an orbit with a light
 * running round it. The four values beside it light up one after another.
 */
export function About() {
  return (
    <section
      aria-labelledby="about-title"
      className="theme-dark dark-band py-[clamp(2.5rem,5vw,4rem)]"
    >
      <BandLights />
      <Reveal className="frame grid grid-cols-1 items-center gap-y-12 md:grid-cols-12 md:gap-x-[var(--gutter)]">
        <div className="md:col-span-6 lg:col-span-5">
          <p data-reveal className="eyebrow">
            About D4DX
          </p>
          <TitleFx
            as="h2"
            id="about-title"
            data-reveal
            className="mt-3 text-[clamp(1.875rem,3.2vw,2.75rem)] leading-tight font-semibold tracking-[-0.02em]"
          >
            D4DX <span className="text-shine">Innovations LLP</span>
          </TitleFx>
          <p
            data-reveal
            className="mt-5 max-w-[52ch] text-[length:var(--step-lead)] leading-relaxed text-white/75"
          >
            An IT services and consulting company on Mavoor Road in Calicut. We
            design and build apps, websites, ERP and SaaS for organisations
            across sectors, and we stay on after launch to keep them running.
          </p>
          <Link data-reveal href="/about" className="btn btn-outline mt-8">
            Know more about us
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div
          data-reveal
          className="flex items-center justify-center gap-8 sm:gap-12 md:col-span-6 md:col-start-7 lg:col-span-6 lg:col-start-7"
        >
          <div className="relative flex flex-col items-center">
            <div className="relative grid place-items-center">
              {/* The orbit: behind the mark all the way round, and once more in front of its lower half. */}
              <svg
                aria-hidden="true"
                viewBox="0 0 400 140"
                className="absolute top-[30%] left-1/2 z-0 w-[150%] max-w-none -translate-x-1/2 -rotate-[8deg]"
              >
                <defs>
                  <linearGradient id="about-orbit" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2d50d2" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="#6f8fff" />
                    <stop offset="100%" stopColor="#2d50d2" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                <ellipse
                  cx="200"
                  cy="70"
                  rx="190"
                  ry="52"
                  fill="none"
                  stroke="url(#about-orbit)"
                  strokeWidth="2"
                />
                <circle r="5" fill="#cfe0ff" className="about-orbit-dot" />
              </svg>
              <BlueMark
                id="about-mark"
                className="about-mark relative z-10 w-[min(44vw,15rem)] drop-shadow-[0_24px_48px_rgb(45_80_210/0.45)]"
              />
              <svg
                aria-hidden="true"
                viewBox="0 0 400 140"
                className="pointer-events-none absolute top-[30%] left-1/2 z-20 w-[150%] max-w-none -translate-x-1/2 -rotate-[8deg] [clip-path:inset(50%_0_0_0)]"
              >
                <ellipse
                  cx="200"
                  cy="70"
                  rx="190"
                  ry="52"
                  fill="none"
                  stroke="url(#about-orbit)"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
            <Wordmark
              className="relative z-10 mt-7 h-8 w-auto text-white sm:h-10"
              title="D4DX"
            />
            <p className="relative z-10 mt-2 text-[0.75rem] font-medium tracking-[0.32em] text-white/65 uppercase">
              Innovations LLP
            </p>
          </div>
          <div className="relative hidden lg:block">
            <span
              aria-hidden="true"
              className="absolute top-0 bottom-0 left-0 w-px bg-white/15"
            />
            <span
              aria-hidden="true"
              className="about-pip absolute top-[1.125rem] -left-[4px] size-2 rounded-full bg-brand-ink shadow-[0_0_12px_3px_rgb(111_143_255/0.8)]"
            />
            <ul aria-label="What we stand for" className="pl-8">
              {VALUES.map((v, n) => (
                <li
                  key={v}
                  className="about-value flex h-11 items-center text-[0.8125rem] font-medium tracking-[0.26em] uppercase"
                  style={{ "--n": n } as React.CSSProperties}
                >
                  {v}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
