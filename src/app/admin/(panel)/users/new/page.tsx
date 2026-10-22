import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { requireOwner } from "@/lib/auth/dal";
import { UserForm } from "../_components/user-form";

export const metadata: Metadata = { title: "New admin" };

async function NewUser() {
  await requireOwner();
  return <UserForm id={null} initial={{ name: "", email: "", role: "editor", password: "" }} />;
}

export default function NewUserPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="New admin" back={{ href: "/admin/users", label: "Admin users" }} description="They sign in with this email and password." />
      <Suspense fallback={<FormSkeleton fields={4} />}>
        <NewUser />
      </Suspense>
    </div>
  );
}
