import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { getAccount } from "@/lib/data/admin/account";
import { dateTime } from "@/lib/format";
import { AccountForm } from "./_components/account-form";

export const metadata: Metadata = { title: "Your account" };

async function Account() {
  const account = await getAccount();
  return (
    <>
      <p className="text-sm text-soft">
        Signed in as <span className="text-ink">{account.email}</span> · <span className="capitalize">{account.role}</span>
        {account.lastLoginAt ? ` · last sign-in ${dateTime(account.lastLoginAt)}` : null}
      </p>
      <AccountForm name={account.name} email={account.email} />
    </>
  );
}

export default function AccountPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="Your account" description="Your name and password." />
      <Suspense fallback={<FormSkeleton fields={5} />}>
        <Account />
      </Suspense>
    </div>
  );
}
