import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { nextOrder } from "@/lib/data/admin/projects";
import { TeamMemberForm } from "../_components/team-member-form";

export const metadata: Metadata = { title: "New team member" };

async function NewTeamMember() {
  const order = await nextOrder("team_members");
  return <TeamMemberForm id={null} initial={{ name: "", role: "", photo: null, linkedin: "", published: true, order }} />;
}

export default function NewTeamMemberPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="New team member" back={{ href: "/admin/team", label: "Team" }} />
      <Suspense fallback={<FormSkeleton fields={5} />}>
        <NewTeamMember />
      </Suspense>
    </div>
  );
}
