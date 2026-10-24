import { ArrowRight } from "@/components/icons";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { BandLights } from "@/components/site/band-lights";
import { getCategories, getProjectReels } from "@/lib/data/public";
import { SectionHead } from "./section-head";
import { WorkGallery } from "./work-gallery";

/** Recent projects on a dark band: kind filters over a grid of reels, with a way into the full index. */
export async function Work() {
  const [projects, categories] = await Promise.all([getProjectReels(24), getCategories()]);
  const present = new Set(projects.map((p) => p.category.slug));
  const tabs = categories.filter((c) => present.has(c.slug)).map((c) => ({ slug: c.slug, label: c.name }));

  return (
    <section aria-labelledby="work-title" className="theme-dark dark-band py-[clamp(2.5rem,5vw,4rem)]">
      <BandLights />
      <div className="frame">
        <Reveal>
          <SectionHead
            id="work-title"
            eyebrow="Our work"
            title={
              <>
                Products we <span className="text-shine">shipped</span> and still look after
              </>
            }
            lead="Recent work across web, mobile and ERP, built for our clients and in daily use."
            action={
              <Link href="/work" className="btn btn-outline min-h-11">
                View all projects
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            }
          />
        </Reveal>
        <WorkGallery projects={projects} tabs={tabs} />
      </div>
    </section>
  );
}
