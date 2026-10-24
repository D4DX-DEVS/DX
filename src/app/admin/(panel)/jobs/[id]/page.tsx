import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { getJobForEdit } from "@/lib/data/admin/jobs";
import { JobForm } from "../_components/job-form";

export const metadata: Metadata = { title: "Edit job" };

async function EditJob({ params }: { params: PageProps<"/admin/jobs/[id]">["params"] }) {
  const { id } = await params;
  const job = await getJobForEdit(id);
  if (!job) notFound();
  return (
    <>
      <PageHeader title={job.values.title} back={{ href: "/admin/jobs", label: "Positions" }} />
      <JobForm id={job.id} initial={job.values} />
    </>
  );
}

export default function EditJobPage({ params }: PageProps<"/admin/jobs/[id]">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <Suspense fallback={<FormSkeleton fields={6} />}>
        <EditJob params={params} />
      </Suspense>
    </div>
  );
}
