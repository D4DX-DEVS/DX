import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Lines } from "@/components/site/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { getLegalPage, getLegalSlugs } from "@/lib/data/public";
import { formatDate } from "@/lib/format";
import { sanitizeRichText } from "@/lib/sanitize";

export async function generateStaticParams() {
  const pages = await getLegalSlugs();
  // Cache Components needs at least one param; on an empty database the placeholder renders notFound().
  return pages.length ? pages.map((p) => ({ slug: p.slug })) : [{ slug: "__empty" }];
}

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLegalPage(slug);
  return { title: page?.title ?? "Page not found", robots: { index: Boolean(page) } };
}

async function Legal({ slug }: { slug: string }) {
  const page = await getLegalPage(slug);
  if (!page) notFound();

  return (
    <article>
      <header className="frame mx-auto max-w-4xl pt-[clamp(2.5rem,6vw,5rem)] pb-10">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-4 text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] font-medium tracking-[-0.03em]">{page.title}</h1>
        {page.updatedAt ? <p className="mt-4 text-sm text-soft">Last updated {formatDate(page.updatedAt)}</p> : null}
      </header>
      <div className="theme-light">
        <div className="frame mx-auto max-w-4xl py-[clamp(2.5rem,5vw,4rem)]">
          <div className="prose-d4" dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.content) }} />
        </div>
      </div>
    </article>
  );
}

export default function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="frame mx-auto max-w-4xl pt-[clamp(2.5rem,6vw,5rem)]" aria-busy="true" aria-label="Loading">
          <Skeleton className="h-12 w-2/3 rounded-xl" />
          <Lines count={10} className="mt-12" />
        </div>
      }
    >
      {params.then(({ slug }) => (
        <Legal slug={slug} />
      ))}
    </Suspense>
  );
}
