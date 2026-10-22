import { ArrowUpRight, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/site/page-hero";
import { BentoSkeleton, CtaSkeleton } from "@/components/site/skeletons";
import { getServices } from "@/lib/data/public";
import { cn } from "@/lib/utils";
import { Cta } from "../_home/cta";
import { Process } from "../_home/process";
import { ServiceVisual } from "../_home/service-visual";
import { lookFor } from "../_home/services";

export const metadata: Metadata = {
  title: "Services",
  description: "Mobile apps, websites, ERP and SaaS: what D4DX builds, what each includes, and the shipped work that proves it.",
};

/** One block per service, picture and words alternating sides, each reachable by its slug. */
async function ServiceList() {
  const services = await getServices();
  if (!services.length) {
    return <p className="frame pt-[var(--section-gap)] text-soft">Services will appear here once they are published from the admin.</p>;
  }

  return (
    <div className="frame flex flex-col gap-[var(--section-gap)] pt-[var(--section-gap)]">
      {services.map((s, i) => {
        const look = lookFor(s.slug);
        const Icon = look.icon;
        return (
          <section key={s.id} id={s.slug} aria-labelledby={`${s.slug}-title`} className="scroll-mt-24">
            <Reveal className="grid grid-cols-1 items-center gap-y-8 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
              <div data-reveal className={cn("lg:col-span-5", i % 2 === 1 && "lg:order-2 lg:col-start-8")}>
                <span aria-hidden="true" className="grid size-12 place-items-center rounded-xl" style={{ background: look.tint, color: look.ink }}>
                  <Icon className="size-6" strokeWidth={1.75} />
                </span>
                <h2 id={`${s.slug}-title`} className="mt-5 text-[length:var(--step-head)] leading-tight font-semibold tracking-[-0.02em]">
                  {s.title}
                </h2>
                <p className="mt-4 max-w-[52ch] text-[length:var(--step-lead)] leading-relaxed text-soft">{s.summary}</p>
                {s.points.length ? (
                  <ul aria-label={`${s.title} includes`} className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {s.points.map((point) => (
                      <li key={point} className="flex gap-2.5 text-[0.9375rem] leading-snug">
                        <Check className="mt-0.5 size-4 shrink-0" style={{ color: look.ink }} aria-hidden="true" />
                        {point}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {s.proof ? <p className="mt-6 max-w-[56ch] border-l-2 pl-4 text-sm leading-relaxed text-soft" style={{ borderColor: look.ink }}>{s.proof}</p> : null}
                {s.proofProject ? (
                  <Link
                    href={`/work/${s.proofProject.slug}`}
                    className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-[0.9375rem] font-semibold"
                    style={{ color: look.ink }}
                  >
                    <span className="link">See {s.proofProject.title}</span>
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
              {s.proofProject ? (
                <div data-reveal className={cn("group lg:col-span-7", i % 2 === 1 ? "lg:order-1 lg:col-start-1" : "lg:col-start-6")}>
                  <ServiceVisual project={s.proofProject} />
                </div>
              ) : null}
            </Reveal>
          </section>
        );
      })}
    </div>
  );
}

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Our services"
        title="Software for every part of your work"
        lead="Four kinds of software, each one already shipped and in daily use. Pick what you need, or talk to us and we will help you decide."
      >
        <Link href="/contact" className="btn btn-brand mt-8">
          Start a project
        </Link>
      </PageHero>
      <div className="theme-light">
        <Suspense fallback={<BentoSkeleton />}>
          <ServiceList />
        </Suspense>
        <Process />
        <Suspense fallback={<CtaSkeleton />}>
          <Cta />
        </Suspense>
      </div>
    </>
  );
}
