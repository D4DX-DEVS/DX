import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { getCategoryForEdit } from "@/lib/data/admin/categories";
import { CategoryForm } from "../_components/category-form";

export const metadata: Metadata = { title: "Edit category" };

async function EditCategory({ params }: { params: PageProps<"/admin/categories/[id]">["params"] }) {
  const { id } = await params;
  const category = await getCategoryForEdit(id);
  if (!category) notFound();
  return (
    <>
      <PageHeader title={category.values.name} back={{ href: "/admin/categories", label: "Categories" }} />
      <CategoryForm id={category.id} initial={category.values} />
    </>
  );
}

export default function EditCategoryPage({ params }: PageProps<"/admin/categories/[id]">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <Suspense fallback={<FormSkeleton fields={4} />}>
        <EditCategory params={params} />
      </Suspense>
    </div>
  );
}
