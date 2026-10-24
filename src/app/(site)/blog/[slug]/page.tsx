import { ArrowLeft, ArrowRight, ArrowUpRight, Globe } from "@/components/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShimmerImage } from "@/components/media/shimmer-image";
import { ShareLinks } from "@/components/site/share-links";
import { Lines } from "@/components/site/skeletons";
import { AppStoreBadge, GooglePlayBadge } from "@/components/site/store-badges";
import { Skeleton } from "@/components/ui/skeleton";
import { getPost, getPostSlugs, getRelatedPosts } from "@/lib/data/public";
import { sanitizeRichText } from "@/lib/sanitize";

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
  const [post, related] = await Promise.all([getPost(slug), getRelatedPosts(slug, 4)]);
  if (!post) notFound();

  const site = process.env.SITE_URL ?? "http://localhost:3233";
  const url = new URL(`/blog/${post.slug}`, site).toString();
  const hasLinks = Boolean(post.website || post.playStore || post.appStore);

  return (
    <article>
      <header className="relative -mt-20 overflow-hidden pt-20">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_10%,rgb(45_80_210/0.3),transparent_70%)]"
        />
        <div className="frame relative pt-[clamp(2.5rem,6vw,5rem)] pb-[clamp(2.5rem,5vw,4rem)]">
          <Link href="/blog" className="link inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium text-soft">
            <ArrowLeft className="size-4" aria-hidden="true" />
            All posts
          </Link>
          {post.tags.length ? (
            <ul aria-label="Tags" className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <li key={t} className="rounded-full bg-brand/20 px-3.5 py-1.5 text-[0.8125rem] leading-none font-medium text-brand-ink ring-1 ring-brand-ink/25">
                  {t}
                </li>
              ))}
            </ul>
          ) : null}
          <h1 className="mt-5 max-w-[26ch] text-[clamp(2rem,4.4vw,3.75rem)] leading-[1.04] font-medium tracking-[-0.035em] text-balance">{post.title}</h1>
          {post.excerpt ? <p className="mt-6 max-w-[62ch] text-[length:var(--step-lead)] leading-[1.55] text-soft">{post.excerpt}</p> : null}
        </div>
      </header>

      <div className="theme-light">
        <div className="frame pt-[clamp(2rem,4vw,3.5rem)]">
          {post.cover ? (
            <ShimmerImage
              media={post.cover}
              alt={post.cover.alt || ""}
              preload
              sizes="(min-width: 1400px) 1340px, 100vw"
              className="rounded-3xl bg-raised-2 shadow-[0_30px_70px_-40px_rgb(11_20_48/0.45)] ring-1 ring-black/5"
            />
          ) : null}

          <div className="grid grid-cols-1 gap-x-[clamp(2rem,4vw,4rem)] gap-y-12 pt-[clamp(2rem,4vw,3.5rem)] lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="prose-d4 max-w-none [&_blockquote]:text-justify [&_li]:text-justify [&_p]:text-justify [&_p]:hyphens-auto" dangerouslySetInnerHTML={{ __html: sanitizeRichText(post.content) }} />
            </div>

            <aside className="lg:col-span-4">
              <div className="flex flex-col gap-5 lg:sticky lg:top-28">
                {hasLinks ? (
                  <section aria-labelledby="links-title" className="rounded-3xl border border-border bg-raised p-6">
                    <h2 id="links-title" className="text-lg font-semibold">
                      Try it yourself
                    </h2>
                    <p className="mt-1 text-sm text-soft">Where to see or get what this post is about.</p>
                    <div className="mt-5 flex flex-col items-stretch gap-3">
                      {post.playStore ? <GooglePlayBadge href={post.playStore} app={post.title} variant="outline" className="w-full" /> : null}
                      {post.appStore ? <AppStoreBadge href={post.appStore} app={post.title} variant="outline" className="w-full" /> : null}
                      {post.website ? (
                        <a href={post.website} target="_blank" rel="noopener noreferrer" className="btn btn-brand h-14 rounded-xl">
                          <Globe className="size-5" aria-hidden="true" />
                          Visit the website
                          <ArrowUpRight className="size-4" aria-hidden="true" />
                        </a>
                      ) : null}
                    </div>
                  </section>
                ) : null}
                {related.length ? (
                  <section aria-labelledby="related-title" className="rounded-3xl border border-border bg-raised p-6">
                    <h2 id="related-title" className="text-lg font-semibold">
                      Related posts
                    </h2>
                    <ul className="mt-5 flex flex-col gap-4">
                      {related.map((r) => (
                        <li key={r.id}>
                          <Link href={`/blog/${r.slug}`} className="group flex items-center gap-4">
                            {r.cover ? (
                              <ShimmerImage
                                media={r.cover}
                                alt=""
                                fill
                                sizes="96px"
                                className="aspect-[4/3] w-24 shrink-0 rounded-xl bg-raised-2 shadow-[0_10px_24px_-14px_rgb(11_20_48/0.5)] ring-1 ring-black/5"
                                imgClassName="transition-transform duration-500 ease-[var(--ease-soft)] group-hover:scale-[1.06]"
                              />
                            ) : (
                              <span aria-hidden="true" className="aspect-[4/3] w-24 shrink-0 rounded-xl bg-raised-2" />
                            )}
                            <span className="line-clamp-3 text-[0.9375rem] leading-snug font-semibold transition-colors group-hover:text-brand-ink">{r.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                <section aria-labelledby="share-title" className="rounded-3xl border border-border bg-raised p-6">
                  <h2 id="share-title" className="text-lg font-semibold">
                    Share this post
                  </h2>
                  <div className="mt-4">
                    <ShareLinks url={url} title={post.title} />
                  </div>
                </section>
                <Link href="/contact" className="group flex items-center justify-between gap-4 rounded-3xl bg-brand p-6 text-on-brand transition-transform duration-300 hover:-translate-y-0.5">
                  <span>
                    <span className="block text-lg font-semibold">Have a project in mind?</span>
                    <span className="mt-1 block text-sm text-white/80">Tell us what it must do on day one.</span>
                  </span>
                  <ArrowRight className="size-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </div>
            </aside>
          </div>
        </div>

        <div className="pb-[var(--section-gap)]" />
      </div>
    </article>
  );
}

function PostSkeleton() {
  return (
    <div className="frame pt-[clamp(2.5rem,6vw,5rem)]" aria-busy="true" aria-label="Loading post">
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
