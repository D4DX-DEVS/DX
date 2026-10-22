import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { PageForm } from "../_components/page-form";

export const metadata: Metadata = { title: "New page" };

export default function NewLegalPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="New page" back={{ href: "/admin/pages", label: "Legal pages" }} />
      <PageForm id={null} initial={{ title: "", slug: "", content: "" }} />
    </div>
  );
}
