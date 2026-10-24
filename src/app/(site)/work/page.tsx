import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHero } from "@/components/site/page-hero";
import { GridSkeleton } from "@/components/site/skeletons";
import { WorkFeed } from "@/components/site/work-feed";
import { getCategories, getWorkAll } from "@/lib/data/public";
import type { SearchParamsRecord } from "@/lib/listing";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Work",
  description: "Apps, websites, ERP and SaaS shipped by D4DX for clients across Kerala and beyond.",
};

function workHref(category: string | null): string {
  return category ? `/work?category=${encodeURIComponent(category)}` : "/work";
}

/** The kinds of work as tabs; the current one comes from the URL. */
async function Tabs({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  const [categories, params] = await Promise.all([getCategories(), searchParams]);
  const current = typeof params.category === "string" ? params.category : null;
  const total = categories.reduce((sum, c) => sum + c.count, 0);
  const tabs = [{ slug: null, name: "All", count: total }, ...categories.filter((c) => c.count > 0)];

  return (
    <nav aria-label="Work by kind" className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const on = t.slug === current;
        return (
          <Link
            key={t.slug ?? "all"}
            href={workHref(t.slug)}
            aria-current={on ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-[0.9375rem] font-medium transition-colors duration-200",
              on ? "bg-brand text-on-brand" : "border border-border bg-raised text-ink hover:bg-accent",
            )}
          >
            {t.name}
            <span className={cn("text-sm num", on ? "text-white/75" : "text-soft")}>{t.count}</span>
          </Link>
        );
      })}
    </nav>
  );
}

async function Results({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : null;
  const { projects } = await getWorkAll(category);

  if (!projects.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-10 text-center">
        <p className="font-semibold">No projects here yet.</p>
        <p className="mt-2 text-soft">Try another kind of work, or see everything.</p>
        <Link href="/work" className="btn btn-outline mt-6">
          Show all projects
        </Link>
      </div>
    );
  }

  // Keyed by kind, so choosing another tab starts the list again from the top.
  return <WorkFeed key={category ?? "all"} projects={projects} />;
}

export default function WorkPage({ searchParams }: PageProps<"/work">) {
  return (
    <>
      <PageHero
        eyebrow="Our work"
        title="Software in daily use"
        lead="Apps on the stores, websites, ERP and SaaS: everything here was designed, built and shipped by the studio."
      />
      <div className="theme-light">
        <section aria-label="Projects" className="frame py-[var(--section-gap)]">
          <Suspense fallback={<div className="h-11" />}>
            <Tabs searchParams={searchParams} />
          </Suspense>
          <div className="mt-10">
            <Suspense fallback={<GridSkeleton count={12} />}>
              <Results searchParams={searchParams} />
            </Suspense>
          </div>
        </section>
      </div>
    </>
  );
}
