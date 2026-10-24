import { ArrowRight, ArrowUpRight, Check, Globe, Smartphone } from "@/components/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ShimmerImage } from "@/components/media/shimmer-image";
import { Reveal } from "@/components/motion/reveal";
import { TitleFx } from "@/components/motion/title-fx";
import { BandLights } from "@/components/site/band-lights";
import { BentoSkeleton } from "@/components/site/skeletons";
import { getProject, getProjectIndex, getServices } from "@/lib/data/public";
import type { Platform, ProjectIndexEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Process } from "../_home/process";
import { lookFor, type Look } from "../_home/services";

export const metadata: Metadata = {
  title: "Solutions",
  description: "Mobile apps, websites, ERP and SaaS: what D4DX builds, what each includes, and the shipped work that proves it.",
};

const PLATFORM_LABEL: Record<Platform, string> = { android: "Android", ios: "iOS", web: "Web", desktop: "Desktop" };

/** Where "See ... work" leads, by solution: the work page, filtered when the kind exists. */
const WORK_LABEL: Record<string, string> = {
  "mobile-apps": "See mobile app work",
  websites: "See website work",
  erp: "See ERP work",
  saas: "See SaaS products",
};

/**
 * The hero's picture, made of real work: a website's own page in a browser, and an app's own screen in a
 * phone laid over it, both floating gently. Falls back to nothing if the studio has no such projects yet.
 */
async function HeroVisual() {
  const index = await getProjectIndex();
  const site = index.find((p) => p.platforms.length > 0 && p.platforms.every((x) => x === "web"));
  const app = index.find((p) => p.platforms.includes("android") || p.platforms.includes("ios"));
  const [siteProject, appProject] = await Promise.all([site ? getProject(site.slug) : null, app ? getProject(app.slug) : null]);
  const pageShot = siteProject?.gallery[0] ?? siteProject?.cover;
  const phoneShot = appProject?.gallery[1] ?? appProject?.gallery[0] ?? appProject?.cover;
  if (!pageShot && !phoneShot) return null;

  return (
    <div className="relative mx-auto w-full max-w-[44rem] pb-10 sm:pb-14 lg:ml-auto">
      {pageShot ? (
        <div className="solutions-float relative ml-auto w-[88%]">
          <div className="overflow-hidden rounded-2xl bg-[#171a26] shadow-[0_40px_90px_-30px_rgb(0_0_0/0.8)] ring-1 ring-white/20">
            <div className="flex h-8 items-center gap-1.5 bg-[#252a3a] px-3.5" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
            </div>
            <ShimmerImage media={pageShot} alt="" fill preload sizes="(min-width: 1024px) 40vw, 90vw" className="aspect-[16/10] bg-white" imgClassName="object-top" />
          </div>
          <div aria-hidden="true" className="mx-auto h-2.5 w-[106%] -translate-x-[2.8%] rounded-b-2xl bg-gradient-to-b from-[#3a3f52] to-[#1a1d29]" />
        </div>
      ) : null}
      {phoneShot ? (
        <div className="solutions-float-b absolute bottom-0 left-0 w-[30%] min-w-28 -rotate-6" style={{ animationDelay: "-2.5s" }}>
          <div className="overflow-hidden rounded-[1.6rem] bg-[#0b0d14] p-1.5 shadow-[0_30px_70px_-20px_rgb(0_0_0/0.85)] ring-1 ring-white/25">
            <ShimmerImage media={phoneShot} alt="" fill sizes="(min-width: 1024px) 14vw, 30vw" className="aspect-[9/19.5] rounded-[1.2rem] bg-white" imgClassName="object-top" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Hero() {
  return (
    <section aria-labelledby="solutions-title" className="theme-dark dark-band relative -mt-20 pt-20">
      <BandLights />
      <div className="frame relative grid grid-cols-1 items-center gap-x-[var(--gutter)] gap-y-12 py-[clamp(3rem,7vw,6rem)] lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow">Our solutions</p>
          <TitleFx as="h1" id="solutions-title" className="mt-4 text-[clamp(2.25rem,4.6vw,4rem)] leading-[1.04] font-medium tracking-[-0.035em] text-balance">
            Software for every part of <span className="text-shine">your work</span>
          </TitleFx>
          <p className="mt-6 max-w-[48ch] text-[length:var(--step-lead)] leading-[1.55] text-white/75">
            Four kinds of software, each one already shipped and in daily use. Pick what you need, or talk to us and we will help you decide.
          </p>
          <Link href="/contact" className="btn btn-brand mt-8">
            Start a project
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="relative lg:col-span-7">
          <Suspense fallback={<div className="aspect-[16/10] w-full rounded-2xl bg-white/5" />}>
            <HeroVisual />
          </Suspense>
          <div aria-hidden="true" className="absolute top-2 right-0 hidden text-right xl:block">
            <p className="font-script text-[1.75rem] leading-tight text-white/90">
              Ideas
              <br />
              People
              <br />
              Impact
            </p>
            <svg viewBox="0 0 160 12" className="mt-1 ml-auto h-3 w-36 text-white/80">
              <path d="M2 9 C 40 3, 100 3, 158 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A solution's picture: the studio's own designed image of a project that proves it, on a soft panel of the solution's colour. */
function SolutionVisual({ project, look }: { project: ProjectIndexEntry; look: Look }) {
  return (
    <div className="relative rounded-[2rem] p-4 ring-1 ring-black/5 sm:p-7" style={{ background: `linear-gradient(145deg, ${look.tint}, #ffffff 78%)` }}>
      <ul aria-label="Runs on" className="absolute -top-3.5 right-6 z-10 flex gap-2">
        {project.platforms.map((p) => (
          <li key={p} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-ink shadow-[0_8px_20px_-8px_rgb(11_20_48/0.35)] ring-1 ring-black/5">
            {p === "web" ? <Globe className="size-3.5" aria-hidden="true" /> : <Smartphone className="size-3.5" aria-hidden="true" />}
            {PLATFORM_LABEL[p]}
          </li>
        ))}
      </ul>
      <Link
        href={`/work/${project.slug}`}
        aria-label={`See ${project.title}`}
        className="group relative block overflow-hidden rounded-3xl shadow-[0_34px_70px_-34px_rgb(11_20_48/0.55)] ring-1 ring-black/5 transition-[transform,box-shadow] duration-500 ease-[var(--ease-out)] hover:-translate-y-1.5"
      >
        <ShimmerImage
          media={project.cover}
          alt=""
          fill
          sizes="(min-width: 1024px) 52vw, 92vw"
          className="aspect-[4/3] bg-raised-2"
          imgClassName="transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.04]"
        />
        <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20">
          {project.onStores ? "Live on the stores" : project.title}
          <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </span>
      </Link>
    </div>
  );
}

/** One block per solution, words and picture alternating sides, each reachable by its slug. */
async function SolutionList() {
  const services = await getServices();
  if (!services.length) {
    return <p className="frame py-[var(--section-gap)] text-soft">Solutions will appear here once they are published from the admin.</p>;
  }

  return (
    <div className="frame flex flex-col gap-[clamp(3.5rem,8vw,6.5rem)] py-[clamp(3rem,7vw,6rem)]">
      {services.map((s, i) => {
        const look = lookFor(s.slug);
        const flip = i % 2 === 1;
        return (
          <section key={s.id} id={s.slug} aria-labelledby={`${s.slug}-title`} className="scroll-mt-24">
            <Reveal className="grid grid-cols-1 items-center gap-x-[var(--gutter)] gap-y-10 lg:grid-cols-12">
              <div data-reveal className={cn("lg:col-span-5", flip && "lg:order-2 lg:col-start-8")}>
                <span aria-hidden="true" className="grid size-12 place-items-center rounded-xl text-[1.0625rem] font-semibold num ring-1 ring-black/5" style={{ background: look.tint, color: look.ink }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 id={`${s.slug}-title`} className="mt-5 text-[clamp(1.75rem,2.8vw,2.375rem)] leading-tight font-semibold tracking-[-0.025em]">
                  {s.title}
                </h2>
                <p className="mt-4 max-w-[52ch] text-[length:var(--step-lead)] leading-relaxed text-soft">{s.summary}</p>
                {s.points.length ? (
                  <ul aria-label={`${s.title} includes`} className="mt-6 flex flex-col gap-3">
                    {s.points.map((point) => (
                      <li key={point} className="flex items-center gap-3 text-[0.9375rem] leading-snug">
                        <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full text-white" style={{ background: look.ink }}>
                          <Check weight="bold" className="size-3" />
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {s.proof ? <p className="mt-6 max-w-[56ch] border-l-2 pl-4 text-sm leading-relaxed text-soft" style={{ borderColor: look.ink }}>{s.proof}</p> : null}
                <Link
                  href={s.proofProject ? `/work/${s.proofProject.slug}` : "/work"}
                  className="group mt-7 inline-flex min-h-11 items-center gap-1.5 text-[0.9375rem] font-semibold"
                  style={{ color: look.ink }}
                >
                  {WORK_LABEL[s.slug] ?? `See ${s.title} work`}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </div>
              {s.proofProject ? (
                <div data-reveal className={cn("lg:col-span-6", flip ? "lg:order-1 lg:col-start-1" : "lg:col-start-7")}>
                  <SolutionVisual project={s.proofProject} look={look} />
                </div>
              ) : null}
            </Reveal>
          </section>
        );
      })}
    </div>
  );
}

export default function SolutionsPage() {
  return (
    <>
      <Hero />
      <div className="theme-light">
        <Suspense fallback={<BentoSkeleton />}>
          <SolutionList />
        </Suspense>
      </div>
      <Process />
    </>
  );
}
