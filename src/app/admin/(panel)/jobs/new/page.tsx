import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { nextOrder } from "@/lib/data/admin/projects";
import { JobForm } from "../_components/job-form";

export const metadata: Metadata = { title: "New job" };

async function NewJob() {
  const order = await nextOrder("jobs");
  return (
    <JobForm
      id={null}
      initial={{ title: "", slug: "", level: "", experience: "", location: "Calicut, on site", summary: "", requirements: [], open: true, order }}
    />
  );
}

export default function NewJobPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="New job" back={{ href: "/admin/jobs", label: "Jobs" }} />
      <Suspense fallback={<FormSkeleton fields={6} />}>
        <NewJob />
      </Suspense>
    </div>
  );
}
