import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { nextOrder } from "@/lib/data/admin/projects";
import { CategoryForm } from "../_components/category-form";

export const metadata: Metadata = { title: "New category" };

async function NewCategory() {
  const order = await nextOrder("categories");
  return <CategoryForm id={null} initial={{ name: "", slug: "", description: "", order }} />;
}

export default function NewCategoryPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="New category" back={{ href: "/admin/categories", label: "Categories" }} />
      <Suspense fallback={<FormSkeleton fields={4} />}>
        <NewCategory />
      </Suspense>
    </div>
  );
}
