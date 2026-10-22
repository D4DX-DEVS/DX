import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { getProjectSlugOptions } from "@/lib/data/admin/services";
import { getTestimonialForEdit } from "@/lib/data/admin/testimonials";
import { TestimonialForm } from "../_components/testimonial-form";

export const metadata: Metadata = { title: "Edit testimonial" };

async function EditTestimonial({ params }: { params: PageProps<"/admin/testimonials/[id]">["params"] }) {
  const { id } = await params;
  const [testimonial, projects] = await Promise.all([getTestimonialForEdit(id), getProjectSlugOptions(false)]);
  if (!testimonial) notFound();
  return (
    <>
      <PageHeader title={`Quote from ${testimonial.values.name}`} back={{ href: "/admin/testimonials", label: "Testimonials" }} />
      <TestimonialForm id={testimonial.id} initial={testimonial.values} projects={projects} />
    </>
  );
}

export default function EditTestimonialPage({ params }: PageProps<"/admin/testimonials/[id]">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <Suspense fallback={<FormSkeleton fields={6} />}>
        <EditTestimonial params={params} />
      </Suspense>
    </div>
  );
}
