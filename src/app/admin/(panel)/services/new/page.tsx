import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { nextOrder } from "@/lib/data/admin/projects";
import { getProjectSlugOptions } from "@/lib/data/admin/services";
import { ServiceForm } from "../_components/service-form";

export const metadata: Metadata = { title: "New service" };

async function NewService() {
  const [projects, order] = await Promise.all([getProjectSlugOptions(true), nextOrder("services")]);
  return (
    <ServiceForm
      id={null}
      projects={projects}
      initial={{ title: "", slug: "", summary: "", proof: "", points: [], proofProjectSlug: "", published: true, order }}
    />
  );
}

export default function NewServicePage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="New service" back={{ href: "/admin/services", label: "Services" }} />
      <Suspense fallback={<FormSkeleton fields={6} />}>
        <NewService />
      </Suspense>
    </div>
  );
}
