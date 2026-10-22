import { ArrowRight, Briefcase, CircleCheck, Clock, GraduationCap, HeartHandshake, MapPin, Rocket, Users, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/site/page-hero";
import { Lines } from "@/components/site/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { getOpenJobs } from "@/lib/data/public";
import type { SearchParamsRecord } from "@/lib/listing";
import { SectionHead } from "../_home/section-head";
import { ApplicationForm } from "./_components/application-form";

export const metadata: Metadata = {
  title: "Careers",
  description: "Open positions at D4DX Innovations, Mavoor Road, Calicut. Build apps, websites, ERP and SaaS used every day.",
};

const GENERAL = "General application";

const PERKS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Rocket, title: "Real products", text: "Your work ships to the stores and to clients who use it every day." },
  { icon: GraduationCap, title: "Learn as you build", text: "Code reviews, pairing and time to pick up new tools." },
  { icon: Users, title: "A small team", text: "Designers, developers and testers in one room on Mavoor Road." },
  { icon: HeartHandshake, title: "Long-term work", text: "We stay with products for years, so you see your work grow." },
];

async function Jobs() {
  const jobs = await getOpenJobs();
  if (!jobs.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-10 text-center">
        <Briefcase className="mx-auto size-8 text-soft" aria-hidden="true" />
        <p className="mt-4 font-semibold">No open positions right now.</p>
        <p className="mt-2 text-soft">We still read every general application. Send yours below.</p>
      </div>
    );
  }
  return (
    <Reveal as="ul" stagger={0.06} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {jobs.map((job) => (
        <li key={job.id} id={job.slug} data-reveal className="flex h-full scroll-mt-24 flex-col rounded-3xl border border-border bg-raised p-6 sm:p-8">
          <h3 className="text-xl font-semibold tracking-[-0.01em]">{job.title}</h3>
          <ul aria-label="Details" className="mt-4 flex flex-wrap gap-2 text-[0.8125rem]">
            {[
              { icon: Briefcase, text: job.level },
              { icon: Clock, text: job.experience },
              { icon: MapPin, text: job.location },
            ]
              .filter((d) => d.text)
              .map(({ icon: Icon, text }) => (
                <li key={text} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-tint)] px-3 py-1.5 font-medium text-brand-ink">
                  <Icon className="size-3.5" aria-hidden="true" />
                  {text}
                </li>
              ))}
          </ul>
          {job.summary ? <p className="mt-4 leading-relaxed text-soft">{job.summary}</p> : null}
          {job.requirements.length ? (
            <ul aria-label="What you bring" className="mt-5 flex flex-col gap-2">
              {job.requirements.map((r) => (
                <li key={r} className="flex gap-2.5 text-[0.9375rem] leading-snug">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand-ink" aria-hidden="true" />
                  {r}
                </li>
              ))}
            </ul>
          ) : null}
          <Link href={`/careers?position=${encodeURIComponent(job.title)}#apply`} className="btn btn-brand mt-auto self-start">
            Apply for this role
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </Reveal>
  );
}

async function Apply({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  const [jobs, params] = await Promise.all([getOpenJobs(), searchParams]);
  const positions = [...jobs.map((j) => j.title), GENERAL];
  const wanted = typeof params.position === "string" ? params.position : "";
  return <ApplicationForm key={wanted} positions={positions} initialPosition={positions.includes(wanted) ? wanted : ""} />;
}

export default function CareersPage({ searchParams }: PageProps<"/careers">) {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Build software people open every day"
        lead="Join a small studio on Mavoor Road that designs, builds and looks after apps, websites, ERP and SaaS."
      >
        <a href="#positions" className="btn btn-brand mt-8">
          See open positions
        </a>
      </PageHero>
      <div className="theme-light">
        <section aria-labelledby="perks-title" className="frame pt-[var(--section-gap)]">
          <Reveal>
            <SectionHead id="perks-title" eyebrow="Why D4DX" title="Work that ships" lead="What working at the studio is like." />
          </Reveal>
          <Reveal as="ul" stagger={0.06} className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PERKS.map(({ icon: Icon, title, text }) => (
              <li key={title} data-reveal className="group rounded-3xl border border-border bg-raised p-6">
                <span aria-hidden="true" className="grid size-12 place-items-center rounded-xl bg-[var(--brand-tint)] text-brand-ink transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-6">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 leading-relaxed text-soft">{text}</p>
              </li>
            ))}
          </Reveal>
        </section>

        <section id="positions" aria-labelledby="positions-title" className="frame scroll-mt-24 pt-[var(--section-gap)]">
          <Reveal>
            <SectionHead id="positions-title" eyebrow="Open positions" title="Join the team" />
          </Reveal>
          <div className="mt-10">
            <Suspense fallback={<Lines count={6} />}>
              <Jobs />
            </Suspense>
          </div>
        </section>

        <section id="apply" aria-labelledby="apply-title" className="frame scroll-mt-24 py-[var(--section-gap)]">
          <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
            <div className="lg:col-span-4">
              <p className="eyebrow">Apply</p>
              <h2 id="apply-title" className="mt-3 text-[length:var(--step-head)] leading-tight font-semibold tracking-[-0.02em]">
                Send your application
              </h2>
              <p className="mt-3 max-w-[38ch] text-soft">Pick a role, or choose a general application if none fits yet. Attach your résumé as a PDF.</p>
            </div>
            <div className="lg:col-span-8">
              <Suspense fallback={<Skeleton className="h-[36rem] rounded-3xl" />}>
                <Apply searchParams={searchParams} />
              </Suspense>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
