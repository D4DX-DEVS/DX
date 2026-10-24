import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { getCategoryOptions, nextOrder } from "@/lib/data/admin/projects";
import { ProjectForm } from "../_components/project-form";

export const metadata: Metadata = { title: "New project" };

async function NewProject() {
  const [categories, order] = await Promise.all([getCategoryOptions(), nextOrder("projects")]);
  return (
    <ProjectForm
      id={null}
      categories={categories}
      initial={{
        title: "",
        slug: "",
        categoryId: categories[0]?.value ?? "",
        client: "",
        date: "",
        summary: "",
        body: "",
        features: [],
        platforms: [],
        links: { playStore: "", appStore: "", website: "" },
        cover: null,
        gallery: [],
        video: "",
        featured: false,
        status: "draft",
        order,
      }}
    />
  );
}

export default function NewProjectPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="New project" back={{ href: "/admin/projects", label: "Projects" }} description="Saved as a draft until you publish it." />
      <Suspense fallback={<FormSkeleton fields={8} />}>
        <NewProject />
      </Suspense>
    </div>
  );
}
