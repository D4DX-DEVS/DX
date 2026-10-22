import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShimmerImage } from "@/components/media/shimmer-image";
import { Lines } from "@/components/site/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { getPost, getPostSlugs } from "@/lib/data/public";
import { formatDate } from "@/lib/format";
import { sanitizeRichText } from "@/lib/sanitize";
import { Cta } from "../../_home/cta";

/** Every published post is prerendered; new ones render on their first visit. */
export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  // Cache Components needs at least one param; on an empty database the placeholder renders notFound().
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "__empty" }];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { type: "article", publishedTime: post.publishedAt ?? undefined, images: post.cover ? [{ url: post.cover.url }] : undefined },
  };
}

async function Post({ slug }: { slug: string }) {
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article>
      <header className="relative -mt-20 overflow-hidden pt-20">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_10%,rgb(45_80_210/0.28),transparent_70%)]"
        />
        <div className="frame relative mx-auto max-w-5xl pt-[clamp(2.5rem,6vw,5rem)] pb-[clamp(2.5rem,5vw,4rem)]">
          <Link href="/blog" className="link inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium text-soft">
            <ArrowLeft className="size-4" aria-hidden="true" />
            All posts
          </Link>
          <p className="eyebrow mt-6 num">
            <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt)}</time>
          </p>
          <h1 className="mt-4 text-[clamp(2rem,4vw,3.5rem)] leading-[1.05] font-medium tracking-[-0.03em]">{post.title}</h1>
          {post.tags.length ? (
            <ul aria-label="Tags" className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <li key={t} className="rounded-full bg-raised-2 px-3 py-1.5 text-[0.8125rem] leading-none">
                  {t}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>
      <div className="theme-light">
        <div className="frame mx-auto max-w-5xl pt-[clamp(2.5rem,5vw,4rem)]">
          {post.cover ? (
            <ShimmerImage media={post.cover} alt={post.cover.alt || ""} preload sizes="(min-width: 1024px) 1024px, 100vw" className="mb-12 rounded-3xl bg-raised-2" />
          ) : null}
          <div className="prose-d4 mx-auto" dangerouslySetInnerHTML={{ __html: sanitizeRichText(post.content) }} />
        </div>
        <Cta />
      </div>
    </article>
  );
}

function PostSkeleton() {
  return (
    <div className="frame mx-auto max-w-5xl pt-[clamp(2.5rem,6vw,5rem)]" aria-busy="true" aria-label="Loading post">
      <Skeleton className="h-4 w-24 rounded-full" />
      <Skeleton className="mt-8 h-12 w-[90%] rounded-xl" />
      <Lines count={8} className="mt-12" />
    </div>
  );
}

export default function PostPage({ params }: PageProps<"/blog/[slug]">) {
  return (
    <Suspense fallback={<PostSkeleton />}>
      {params.then(({ slug }) => (
        <Post slug={slug} />
      ))}
    </Suspense>
  );
}
