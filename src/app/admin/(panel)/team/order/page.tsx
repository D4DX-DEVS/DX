import { Users } from "@/components/icons";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/skeletons";
import { EmptyState } from "@/components/admin/states";
import { listTeamInOrder } from "@/lib/data/admin/team";
import { TeamSorter } from "../_components/team-sorter";

export const metadata: Metadata = { title: "Reorder team" };

async function Sorter() {
  const team = await listTeamInOrder();
  if (team.length === 0) {
    return <EmptyState icon={Users} title="No team members yet" description="Add people first, then put them in order." action={{ href: "/admin/team/new", label: "New team member" }} />;
  }
  return <TeamSorter initial={team} />;
}

export default function ReorderTeamPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Reorder team"
        description="Drag a person up or down, or use the arrows. The site shows them in this order, and each move saves at once."
        back={{ href: "/admin/team", label: "Team" }}
      />
      <Suspense fallback={<TableSkeleton columns={3} />}>
        <Sorter />
      </Suspense>
    </div>
  );
}
