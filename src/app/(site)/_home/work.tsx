import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { getCategories, getProjectReels } from "@/lib/data/public";
import { SectionHead } from "./section-head";
import { Showreel } from "./showreel";

/** Recent projects as a showreel the visitor can watch or step through, with a way into the full index. */
export async function Work() {
  const [projects, categories] = await Promise.all([getProjectReels(6), getCategories()]);
  const present = new Set(projects.map((p) => p.category.slug));
  const tabs = categories.filter((c) => present.has(c.slug)).map((c) => ({ slug: c.slug, label: c.name }));

  return (
    <section aria-labelledby="work-title" className="frame pt-[var(--section-gap)]">
      <Reveal>
        <SectionHead
          id="work-title"
          eyebrow="Our work"
          title={
            <>
              Products we <span className="text-shine">shipped</span> and still look after
            </>
          }
          lead="Recent work across web, mobile and ERP, built for our clients and in daily use. Watch the reel, or pick a project."
          action={
            <Link href="/work" className="btn btn-outline min-h-11">
              View all projects
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          }
        />
      </Reveal>
      <Showreel projects={projects} tabs={tabs} />
    </section>
  );
}
