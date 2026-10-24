import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { PostForm } from "../_components/post-form";

export const metadata: Metadata = { title: "New post" };

async function NewPost() {
  // Today's date belongs to the request, not to the prerendered shell.
  await connection();
  const today = new Date().toISOString().slice(0, 10);
  return (
    <PostForm
      id={null}
      initial={{ title: "", slug: "", excerpt: "", content: "", cover: null, tags: [], website: "", playStore: "", appStore: "", status: "draft", publishedAt: today }}
    />
  );
}

export default function NewPostPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="New post" back={{ href: "/admin/posts", label: "Blog posts" }} description="Saved as a draft until you publish it." />
      <Suspense fallback={<FormSkeleton fields={6} />}>
        <NewPost />
      </Suspense>
    </div>
  );
}
