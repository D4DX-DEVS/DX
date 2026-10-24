import { ArrowLeft, ArrowRight, ArrowUpRight, CircleCheck, Globe } from "@/components/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShimmerImage } from "@/components/media/shimmer-image";
import { ProjectGallery } from "@/components/site/project-gallery";
import { ProjectMedia } from "@/components/site/project-media";
import { Lines } from "@/components/site/skeletons";
import { AppStoreBadge, GooglePlayBadge } from "@/components/site/store-badges";
import { Skeleton } from "@/components/ui/skeleton";
import { getProject, getProjectIndex } from "@/lib/data/public";
import { sanitizeRichText } from "@/lib/sanitize";
import type { Platform } from "@/lib/types";
import { TitleFx } from "@/components/motion/title-fx";

const PLATFORM_LABEL: Record<Platform, string> = { android: "Android", ios: "iOS", web: "Web", desktop: "Desktop" };

/** Every published project is prerendered; new ones render on their first visit. */
export async function generateStaticParams() {
  const index = await getProjectIndex();
  // Cache Components needs at least one param; on an empty database the placeholder renders notFound().
  return index.length ? index.map((p) => ({ slug: p.slug })) : [{ slug: "__empty" }];
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: project.title,
    description: project.summary || `${project.title}, ${project.category.name.toLowerCase()} by D4DX Innovations.`,
    openGraph: { images: [{ url: project.cover.url, width: project.cover.width, height: project.cover.height }] },
  };
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-soft">{label}</dt>
      <dd className="mt-1 font-semibold">{children}</dd>
    </div>
  );
}

async function Project({ slug }: { slug: string }) {
  const [project, index] = await Promise.all([getProject(slug), getProjectIndex()]);
  if (!project) notFound();

  const at = index.findIndex((p) => p.slug === slug);
  const next = index.length > 1 ? index[(at + 1) % index.length] : null;
  const prev = index.length > 1 ? index[(at - 1 + index.length) % index.length] : null;
  const { playStore, appStore, website } = project.links;
  const hasLinks = Boolean(playStore || appStore || website);

  return (
    <article>
      <header className="relative -mt-20 overflow-hidden pt-20">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_10%,rgb(45_80_210/0.28),transparent_70%)]"
        />
        <div className="frame relative pt-[clamp(2.5rem,6vw,5rem)]">
          <Link href="/work" className="link inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium text-soft">
            <ArrowLeft className="size-4" aria-hidden="true" />
            All work
          </Link>
          <p className="eyebrow mt-6">{project.category.name}</p>
          <h1 className="mt-4 max-w-[20ch] text-[length:var(--step-xl)] leading-[1.02] font-medium tracking-[-0.035em]">{project.title}</h1>
          {project.summary ? <p className="mt-6 max-w-[56ch] text-[length:var(--step-lead)] leading-[1.5] text-soft">{project.summary}</p> : null}
          {hasLinks ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {playStore ? <GooglePlayBadge href={playStore} app={project.title} /> : null}
              {appStore ? <AppStoreBadge href={appStore} app={project.title} /> : null}
              {website ? (
                <a href={website} target="_blank" rel="noopener noreferrer" className="btn btn-quiet h-14 rounded-xl">
                  <Globe className="size-5" aria-hidden="true" />
                  Visit the website
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          ) : null}
          <ProjectMedia
            cover={project.cover}
            video={project.video}
            title={project.title}
            className="mx-auto mt-[clamp(2.5rem,5vw,4rem)] max-w-[1040px] rounded-t-3xl"
          />
        </div>
      </header>

      <div className="theme-light">
        <div className="frame grid grid-cols-1 gap-y-12 pt-[var(--section-gap)] lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
          <aside className="lg:col-span-4">
            <dl className="grid grid-cols-2 gap-6 rounded-3xl border border-border bg-raised p-6 sm:p-8 lg:sticky lg:top-28 lg:grid-cols-1">
              {project.client ? <Fact label="Client">{project.client}</Fact> : null}
              <Fact label="Kind of work">{project.category.name}</Fact>
              {project.year ? <Fact label="Year">{project.year}</Fact> : null}
              {project.platforms.length ? <Fact label="Runs on">{project.platforms.map((p) => PLATFORM_LABEL[p]).join(", ")}</Fact> : null}
            </dl>
          </aside>
          <div className="lg:col-span-8">
            {project.body ? <div className="prose-d4" dangerouslySetInnerHTML={{ __html: sanitizeRichText(project.body) }} /> : null}
            {project.features.length ? (
              <section aria-labelledby="features-title" className="mt-12">
                <TitleFx as="h2" id="features-title" className="text-[length:var(--step-head)] leading-tight font-semibold tracking-[-0.02em]">
                  What it does
                </TitleFx>
                <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {project.features.map((f) => (
                    <li key={f} className="flex gap-3 rounded-2xl border border-border bg-raised p-4 leading-snug">
                      <CircleCheck className="mt-0.5 size-5 shrink-0 text-brand-ink" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>

        {project.gallery.length ? (
          <section aria-label="Screens" className="frame pt-[var(--section-gap)]">
            <div className="mx-auto max-w-[68rem]">
              <ProjectGallery images={project.gallery} title={project.title} />
            </div>
          </section>
        ) : null}

        {prev && next ? (
          <nav aria-label="More projects" className="frame grid grid-cols-1 gap-4 pt-[var(--section-gap)] sm:grid-cols-2">
            {[
              { p: prev, label: "Previous project", icon: ArrowLeft },
              { p: next, label: "Next project", icon: ArrowRight },
            ].map(({ p, label, icon: Icon }, i) => (
              <Link
                key={label}
                href={`/work/${p.slug}`}
                className="group flex items-center gap-4 rounded-3xl border border-border bg-raised p-3 pr-6 transition-shadow hover:shadow-[0_18px_40px_-18px_rgb(11_20_48/0.3)]"
              >
                <ShimmerImage media={p.cover} alt="" fill sizes="120px" className="aspect-[4/3] w-24 shrink-0 rounded-2xl bg-raised-2 sm:w-28" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-soft">{label}</span>
                  <span className="mt-1 block truncate font-semibold">{p.title}</span>
                </span>
                <Icon
                  className={i === 0 ? "size-5 text-soft transition-transform group-hover:-translate-x-1" : "size-5 text-soft transition-transform group-hover:translate-x-1"}
                  aria-hidden="true"
                />
              </Link>
            ))}
          </nav>
        ) : null}

      </div>
    </article>
  );
}

function ProjectSkeleton() {
  return (
    <div className="frame pt-[clamp(2.5rem,6vw,5rem)]" aria-busy="true" aria-label="Loading project">
      <Skeleton className="h-4 w-24 rounded-full" />
      <Skeleton className="mt-8 h-14 w-[min(36rem,90%)] rounded-xl" />
      <Lines count={2} className="mt-6 max-w-[56ch]" />
      <Skeleton className="mt-12 aspect-[16/9] rounded-t-3xl" />
    </div>
  );
}

export default function ProjectPage({ params }: PageProps<"/work/[slug]">) {
  return (
    <Suspense fallback={<ProjectSkeleton />}>
      {params.then(({ slug }) => (
        <Project slug={slug} />
      ))}
    </Suspense>
  );
}
