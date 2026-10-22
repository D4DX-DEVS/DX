import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { getProjectSlugOptions, getServiceForEdit } from "@/lib/data/admin/services";
import { ServiceForm } from "../_components/service-form";

export const metadata: Metadata = { title: "Edit service" };

async function EditService({ params }: { params: PageProps<"/admin/services/[id]">["params"] }) {
  const { id } = await params;
  const [service, projects] = await Promise.all([getServiceForEdit(id), getProjectSlugOptions(true)]);
  if (!service) notFound();
  return (
    <>
      <PageHeader title={service.values.title} back={{ href: "/admin/services", label: "Services" }} />
      <ServiceForm id={service.id} initial={service.values} projects={projects} />
    </>
  );
}

export default function EditServicePage({ params }: PageProps<"/admin/services/[id]">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <Suspense fallback={<FormSkeleton fields={6} />}>
        <EditService params={params} />
      </Suspense>
    </div>
  );
}
