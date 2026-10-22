import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { getCategoryOptions, getProjectForEdit } from "@/lib/data/admin/projects";
import { ProjectForm } from "../_components/project-form";

export const metadata: Metadata = { title: "Edit project" };

async function EditProject({ params }: { params: PageProps<"/admin/projects/[id]">["params"] }) {
  const { id } = await params;
  const [project, categories] = await Promise.all([getProjectForEdit(id), getCategoryOptions()]);
  if (!project) notFound();
  return (
    <>
      <PageHeader title={project.values.title} back={{ href: "/admin/projects", label: "Projects" }} />
      <ProjectForm id={project.id} initial={project.values} categories={categories} publicSlug={project.slug} />
    </>
  );
}

export default function EditProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <Suspense fallback={<FormSkeleton fields={8} />}>
        <EditProject params={params} />
      </Suspense>
    </div>
  );
}
