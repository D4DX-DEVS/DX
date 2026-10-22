import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { nextOrder } from "@/lib/data/admin/projects";
import { getProjectSlugOptions } from "@/lib/data/admin/services";
import { TestimonialForm } from "../_components/testimonial-form";

export const metadata: Metadata = { title: "New testimonial" };

async function NewTestimonial() {
  const [projects, order] = await Promise.all([getProjectSlugOptions(false), nextOrder("testimonials")]);
  return (
    <TestimonialForm id={null} projects={projects} initial={{ quote: "", name: "", role: "", context: "", projectSlug: "", published: true, order }} />
  );
}

export default function NewTestimonialPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="New testimonial" back={{ href: "/admin/testimonials", label: "Testimonials" }} />
      <Suspense fallback={<FormSkeleton fields={6} />}>
        <NewTestimonial />
      </Suspense>
    </div>
  );
}
