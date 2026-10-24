import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { topJobOrder } from "@/lib/data/admin/jobs";
import { JobForm } from "../_components/job-form";

export const metadata: Metadata = { title: "New position" };

async function NewJob() {
  // A new position takes the top of the list; the admin can move it afterwards.
  const order = await topJobOrder();
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
      <PageHeader title="New position" back={{ href: "/admin/jobs", label: "Positions" }} />
      <Suspense fallback={<FormSkeleton fields={6} />}>
        <NewJob />
      </Suspense>
    </div>
  );
}
