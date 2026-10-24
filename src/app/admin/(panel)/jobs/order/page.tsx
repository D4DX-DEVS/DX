import { Briefcase } from "@/components/icons";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/skeletons";
import { EmptyState } from "@/components/admin/states";
import { listJobsInOrder } from "@/lib/data/admin/jobs";
import { JobSorter } from "../_components/job-sorter";

export const metadata: Metadata = { title: "Reorder positions" };

async function Sorter() {
  const jobs = await listJobsInOrder();
  if (jobs.length === 0) {
    return <EmptyState icon={Briefcase} title="No positions yet" description="Add a position first, then put them in order." action={{ href: "/admin/jobs/new", label: "New position" }} />;
  }
  const rows = jobs.map((j) => ({ id: j.id, title: j.title, subtitle: [j.level, j.experience].filter(Boolean).join(" · "), tag: j.open ? "Open" : "Closed", muted: !j.open }));
  return <JobSorter rows={rows} />;
}

export default function ReorderJobsPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Reorder positions"
        description="Drag a position up or down, or use the arrows. The Join Our Team page lists them in this order, and each move saves at once."
        back={{ href: "/admin/jobs", label: "Positions" }}
      />
      <Suspense fallback={<TableSkeleton columns={3} />}>
        <Sorter />
      </Suspense>
    </div>
  );
}
