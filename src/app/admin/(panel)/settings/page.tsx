import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { getSettingsForEdit } from "@/lib/data/admin/settings";
import { SettingsForm } from "./_components/settings-form";

export const metadata: Metadata = { title: "Site settings" };

async function Settings() {
  const initial = await getSettingsForEdit();
  return <SettingsForm initial={initial} />;
}

export default function SettingsPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="Site settings" description="Contact details, address and social links shown in the footer and on the contact page." />
      <Suspense fallback={<FormSkeleton fields={8} />}>
        <Settings />
      </Suspense>
    </div>
  );
}
