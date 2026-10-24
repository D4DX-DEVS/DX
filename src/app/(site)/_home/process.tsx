import { CodeXml, FileText, Rocket, Search, type LucideIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/reveal";
import { TitleFx } from "@/components/motion/title-fx";

interface Step {
  icon: LucideIcon;
  /** Which of the icon's own animations to play (see .process-icon in globals.css). */
  motion: "scan" | "write" | "pulse" | "launch";
  title: string;
  text: string;
}

const STEPS: Step[] = [
  { icon: Search, motion: "scan", title: "Discover", text: "A call or a visit to understand your users and what the software must do on day one." },
  { icon: FileText, motion: "write", title: "Plan", text: "A written scope and screens you can click through before any code is written." },
  { icon: CodeXml, motion: "pulse", title: "Develop", text: "Regular builds you can install, each release tested by a quality analyst." },
  { icon: Rocket, motion: "launch", title: "Launch & grow", text: "Stores, servers and domains handled, then updates for as long as it runs." },
];

/**
 * The four steps every project goes through. Each step's icon has a small motion of its own (a
 * lens scanning, a page being written, code pulsing, a rocket lifting off), a ring that ripples
 * out, and a light that travels the line to the next step.
 */
export function Process() {
  return (
    <section aria-labelledby="process-title" className="theme-dark dark-band py-[clamp(2.5rem,5vw,4rem)]">
      <Reveal stagger={0.1} className="frame grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
        <div className="lg:col-span-3">
          <p data-reveal className="eyebrow">
            Our process
          </p>
          <TitleFx as="h2" id="process-title" data-reveal className="mt-3 text-[length:var(--step-head)] leading-tight font-semibold tracking-[-0.02em]">
            From idea to impact
          </TitleFx>
          <p data-reveal className="mt-3 max-w-[36ch] text-white/70">
            A simple, open and collaborative process that turns your idea into software people use.
          </p>
        </div>
        <ol className="grid grid-cols-4 gap-2 sm:grid-cols-2 sm:gap-4 lg:col-span-9 lg:grid-cols-4 lg:gap-0">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                data-reveal
                style={{ "--i": i } as React.CSSProperties}
                className="process-step group relative flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.04] px-1.5 py-4 text-center transition-[transform,box-shadow] duration-500 ease-[var(--ease-out)] hover:-translate-y-1.5 hover:shadow-[0_24px_44px_-28px_rgb(45_80_210/0.55)] sm:items-stretch sm:p-5 sm:text-left lg:border-0 lg:bg-transparent lg:p-0 lg:pr-8 lg:hover:shadow-none"
              >
                <div className="flex items-center justify-center gap-3 sm:justify-start">
                  <span aria-hidden="true" className="process-badge relative grid size-11 shrink-0 place-items-center rounded-xl sm:size-14 sm:rounded-2xl bg-brand/20 text-brand-ink ring-1 ring-brand-ink/25">
                    <span className="process-ring" />
                    <Icon weight="duotone" data-motion={step.motion} className="process-icon size-5 sm:size-7" />
                  </span>
                  {i < STEPS.length - 1 ? <span aria-hidden="true" className="process-track hidden flex-1 lg:block" /> : null}
                </div>
                <p className="mt-2.5 text-xs font-semibold text-brand-ink num sm:mt-5 sm:text-sm">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-0.5 text-[0.75rem] leading-tight font-semibold sm:mt-1 sm:text-lg sm:leading-snug">{step.title}</h3>
                <p className="mt-2 hidden max-w-[30ch] text-[0.9375rem] leading-relaxed text-white/70 sm:block">{step.text}</p>
              </li>
            );
          })}
        </ol>
      </Reveal>
    </section>
  );
}
