import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { getTeamMemberForEdit } from "@/lib/data/admin/team";
import { TeamMemberForm } from "../_components/team-member-form";

export const metadata: Metadata = { title: "Edit team member" };

async function EditTeamMember({ params }: { params: PageProps<"/admin/team/[id]">["params"] }) {
  const { id } = await params;
  const member = await getTeamMemberForEdit(id);
  if (!member) notFound();
  return (
    <>
      <PageHeader title={member.values.name} back={{ href: "/admin/team", label: "Team" }} />
      <TeamMemberForm id={member.id} initial={member.values} />
    </>
  );
}

export default function EditTeamMemberPage({ params }: PageProps<"/admin/team/[id]">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <Suspense fallback={<FormSkeleton fields={5} />}>
        <EditTeamMember params={params} />
      </Suspense>
    </div>
  );
}
