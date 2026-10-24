import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { getPageForEdit } from "@/lib/data/admin/pages";
import { PageForm } from "../_components/page-form";

export const metadata: Metadata = { title: "Edit page" };

async function EditPage({ params }: { params: PageProps<"/admin/pages/[id]">["params"] }) {
  const { id } = await params;
  const page = await getPageForEdit(id);
  if (!page) notFound();
  return (
    <>
      <PageHeader title={page.values.title} back={{ href: "/admin/pages", label: "Pages" }} />
      <PageForm id={page.id} initial={page.values} publicSlug={page.slug} />
    </>
  );
}

export default function EditLegalPage({ params }: PageProps<"/admin/pages/[id]">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <Suspense fallback={<FormSkeleton fields={3} />}>
        <EditPage params={params} />
      </Suspense>
    </div>
  );
}
