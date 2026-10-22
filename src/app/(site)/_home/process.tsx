import { ArrowRight, CodeXml, FileText, Rocket, Search, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

interface Step {
  icon: LucideIcon;
  title: string;
  text: string;
}

const STEPS: Step[] = [
  { icon: Search, title: "Discover", text: "A call or a visit to understand your users and what the software must do on day one." },
  { icon: FileText, title: "Plan", text: "A written scope and screens you can click through before any code is written." },
  { icon: CodeXml, title: "Develop", text: "Regular builds you can install, each release tested by a quality analyst." },
  { icon: Rocket, title: "Launch & grow", text: "Stores, servers and domains handled, then updates for as long as it runs." },
];

/** The four steps every project goes through, in a row. */
export function Process() {
  return (
    <section aria-labelledby="process-title" className="frame pt-[var(--section-gap)]">
      <Reveal stagger={0.08} className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
        <div className="lg:col-span-3">
          <p data-reveal className="eyebrow">
            Our process
          </p>
          <h2 id="process-title" data-reveal className="mt-3 text-[length:var(--step-head)] leading-tight font-semibold tracking-[-0.02em]">
            From idea to impact
          </h2>
          <p data-reveal className="mt-3 max-w-[36ch] text-soft">
            A simple, open and collaborative process that turns your idea into software people use.
          </p>
        </div>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-4 lg:gap-0">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.title} data-reveal className="relative flex flex-col rounded-2xl border border-border bg-raised p-5 lg:border-0 lg:bg-transparent lg:p-0 lg:pr-8">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-[var(--brand-tint)] text-brand-ink">
                    <Icon className="size-5" />
                  </span>
                  {i < STEPS.length - 1 ? (
                    <span aria-hidden="true" className="hidden flex-1 items-center gap-1 text-soft/60 lg:flex">
                      <span className="h-px flex-1 border-t border-dashed border-current" />
                      <ArrowRight className="size-4" />
                    </span>
                  ) : null}
                </div>
                <p className="mt-5 text-sm font-semibold text-brand-ink num">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-1 text-lg leading-snug font-semibold">{step.title}</h3>
                <p className="mt-2 max-w-[30ch] text-[0.9375rem] leading-relaxed text-soft">{step.text}</p>
              </li>
            );
          })}
        </ol>
      </Reveal>
    </section>
  );
}
