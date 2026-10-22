import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { getUserForEdit } from "@/lib/data/admin/users";
import { dateTime } from "@/lib/format";
import { UserForm } from "../_components/user-form";

export const metadata: Metadata = { title: "Edit admin" };

async function EditUser({ params }: { params: PageProps<"/admin/users/[id]">["params"] }) {
  const { id } = await params;
  const user = await getUserForEdit(id);
  if (!user) notFound();
  return (
    <>
      <PageHeader
        title={user.values.name}
        back={{ href: "/admin/users", label: "Admin users" }}
        description={user.lastLoginAt ? `Last signed in ${dateTime(user.lastLoginAt)}` : "Has not signed in yet."}
      />
      <UserForm id={user.id} initial={user.values} isSelf={user.isSelf} />
    </>
  );
}

export default function EditUserPage({ params }: PageProps<"/admin/users/[id]">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <Suspense fallback={<FormSkeleton fields={4} />}>
        <EditUser params={params} />
      </Suspense>
    </div>
  );
}
