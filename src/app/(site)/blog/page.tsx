import { ArrowUpRight, Newspaper } from "@/components/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ShimmerImage } from "@/components/media/shimmer-image";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/site/page-hero";
import { Pager } from "@/components/site/pager";
import { Lines } from "@/components/site/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { BLOG_PAGE_SIZE, getPostsPage } from "@/lib/data/public";
import { publicPage, type SearchParamsRecord } from "@/lib/listing";
import type { PostCard } from "@/lib/types";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes from the D4DX studio on building apps, websites, ERP and SaaS.",
};

function Card({ post }: { post: PostCard }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-raised p-2 transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgb(11_20_48/0.3)]"
    >
      {post.cover ? (
        <ShimmerImage
          media={post.cover}
          alt=""
          fill
          sizes="(min-width: 1024px) 31vw, (min-width: 640px) 48vw, 100vw"
          className="aspect-[16/10] rounded-2xl bg-raised-2"
          imgClassName="transition-transform duration-500 ease-[var(--ease-soft)] group-hover:scale-[1.04]"
        />
      ) : (
        <div className="grid aspect-[16/10] place-items-center rounded-2xl bg-[var(--brand-tint)] text-brand-ink">
          <Newspaper className="size-10" aria-hidden="true" />
        </div>
      )}
      <div className="flex flex-1 flex-col px-4 pt-5 pb-4">
        <h2 className="line-clamp-2 text-lg leading-snug font-semibold">{post.title}</h2>
        {post.excerpt ? <p className="mt-2 line-clamp-3 leading-relaxed text-soft">{post.excerpt}</p> : null}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[0.9375rem] font-semibold text-brand-ink">
          Read the post
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

async function Posts({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  const params = await searchParams;
  const result = await getPostsPage(publicPage(params.page));

  if (!result.data.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-10 text-center">
        <p className="font-semibold">No posts on this page.</p>
        <Link href="/blog" className="btn btn-outline mt-6">
          Back to the latest posts
        </Link>
      </div>
    );
  }

  return (
    <>
      <Reveal as="ul" stagger={0.05} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.data.map((post) => (
          <li key={post.id} data-reveal className="min-w-0">
            <Card post={post} />
          </li>
        ))}
      </Reveal>
      <Pager page={result.page} totalPages={result.totalPages} total={result.total} noun="posts" href={(p) => (p > 1 ? `/blog?page=${p}` : "/blog")} />
    </>
  );
}

function PostsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading posts">
      {Array.from({ length: BLOG_PAGE_SIZE }, (_, i) => (
        <div key={i} className="rounded-3xl border border-border bg-raised p-2">
          <Skeleton className="aspect-[16/10] rounded-2xl" />
          <div className="px-4 pt-5 pb-4">
            <Skeleton className="shimmer-line h-3.5 w-1/3" />
            <Skeleton className="shimmer-line mt-3 h-5 w-4/5" />
            <Lines count={3} className="mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BlogPage({ searchParams }: PageProps<"/blog">) {
  return (
    <>
      <PageHero eyebrow="Blog" title="Notes from the studio" lead="What we learn building apps, websites, ERP and SaaS, written down for the next project." />
      <div className="theme-light">
        <section aria-label="Posts" className="frame py-[var(--section-gap)]">
          <Suspense fallback={<PostsSkeleton />}>
            <Posts searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
    </>
  );
}
