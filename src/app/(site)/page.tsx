import { Suspense } from "react";
import { BentoSkeleton, HeroSkeleton, TeamSkeleton, WorkSectionSkeleton } from "@/components/site/skeletons";
import { About } from "./_home/about";
import { Hero } from "./_home/hero";
import { Process } from "./_home/process";
import { Services } from "./_home/services";
import { Team } from "./_home/team";
import { Work } from "./_home/work";

/**
 * Each data section streams behind its own boundary, so whatever is ready shows at once
 * and the rest shimmers in place. All reads are cached and tagged, so in practice the page
 * is served from the prerendered shell and only re-renders after an admin edit.
 * The dark 3D hero hands over to one continuous dark page: every band runs into the next with no gap.
 */
export default function HomePage() {
  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <Hero />
      </Suspense>
      <div className="theme-dark curtain">
        <About />
        <Suspense
          fallback={
            <div className="theme-dark dark-band py-[clamp(2.5rem,5vw,4rem)]">
              <BentoSkeleton />
            </div>
          }
        >
          <Services />
        </Suspense>
        <Suspense fallback={<WorkSectionSkeleton />}>
          <Work />
        </Suspense>
        <Process />
        <Suspense fallback={<TeamSkeleton />}>
          <Team />
        </Suspense>
      </div>
    </>
  );
}
