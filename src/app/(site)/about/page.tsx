import type { Metadata } from "next";
import { Suspense } from "react";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/site/page-hero";
import { GridSkeleton, VoicesSkeleton } from "@/components/site/skeletons";
import { TeamGrid } from "@/components/site/team-grid";
import { getTeam } from "@/lib/data/public";
import { About } from "../_home/about";
import { SectionHead } from "../_home/section-head";
import { Voices } from "../_home/voices";

export const metadata: Metadata = {
  title: "About",
  description: "D4DX Innovations LLP is an IT services and consulting studio on Mavoor Road, Calicut: the people, the record and what clients say.",
};

async function FullTeam() {
  const team = await getTeam();
  return <TeamGrid team={team} />;
}

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="A studio that stays after launch"
        lead="We design and build apps, websites, ERP and SaaS from Mavoor Road in Calicut, and keep them running for as long as they are in use."
      />
      <div className="theme-dark">
        <About />
        <section id="team" aria-labelledby="team-title" className="frame scroll-mt-24 pt-[var(--section-gap)]">
          <Reveal>
            <SectionHead
              id="team-title"
              eyebrow="Our team"
              title={
                <>
                  The people behind <span className="text-shine">D4DX</span>
                </>
              }
              lead="Designers, developers, testers and the people who keep the projects moving."
            />
          </Reveal>
          <div className="mt-10">
            <Suspense fallback={<GridSkeleton count={10} />}>
              <FullTeam />
            </Suspense>
          </div>
        </section>
        <Suspense fallback={<VoicesSkeleton />}>
          <Voices />
        </Suspense>
      </div>
    </>
  );
}
