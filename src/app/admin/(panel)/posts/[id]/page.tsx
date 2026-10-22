import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { getPostForEdit } from "@/lib/data/admin/posts";
import { PostForm } from "../_components/post-form";

export const metadata: Metadata = { title: "Edit post" };

async function EditPost({ params }: { params: PageProps<"/admin/posts/[id]">["params"] }) {
  const { id } = await params;
  const post = await getPostForEdit(id);
  if (!post) notFound();
  return (
    <>
      <PageHeader title={post.values.title} back={{ href: "/admin/posts", label: "Blog posts" }} />
      <PostForm id={post.id} initial={post.values} publicSlug={post.slug} />
    </>
  );
}

export default function EditPostPage({ params }: PageProps<"/admin/posts/[id]">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <Suspense fallback={<FormSkeleton fields={6} />}>
        <EditPost params={params} />
      </Suspense>
    </div>
  );
}
