import { Suspense } from "react";
import { BentoSkeleton, CtaSkeleton, HeroSkeleton, ProofSkeleton, StudioSkeleton, WorkSectionSkeleton } from "@/components/site/skeletons";
import { About } from "./_home/about";
import { Cta } from "./_home/cta";
import { Hero } from "./_home/hero";
import { Process } from "./_home/process";
import { Proof } from "./_home/proof";
import { Services } from "./_home/services";
import { Team } from "./_home/team";
import { Work } from "./_home/work";

/**
 * Each data section streams behind its own boundary, so whatever is ready shows at once
 * and the rest shimmers in place. All reads are cached and tagged, so in practice the page
 * is served from the prerendered shell and only re-renders after an admin edit.
 * The dark 3D hero hands over to a light page for everything below it.
 */
export default function HomePage() {
  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <Hero />
      </Suspense>
      <div className="theme-light curtain">
        <About />
        <Suspense fallback={<BentoSkeleton />}>
          <Services />
        </Suspense>
        <Suspense fallback={<WorkSectionSkeleton />}>
          <Work />
        </Suspense>
        <Process />
        <Suspense fallback={<ProofSkeleton />}>
          <Proof />
        </Suspense>
        <Suspense fallback={<StudioSkeleton />}>
          <Team />
        </Suspense>
        <Suspense fallback={<CtaSkeleton />}>
          <Cta />
        </Suspense>
      </div>
    </>
  );
}
