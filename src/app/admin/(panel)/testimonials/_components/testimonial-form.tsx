"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { DeleteButton } from "@/components/admin/delete-button";
import { FormSection, SaveBar } from "@/components/admin/fields/form-shell";
import { Field } from "@/components/site/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { deleteTestimonial, saveTestimonial } from "@/lib/actions/admin/testimonials";
import { testimonialSchema, type TestimonialInput } from "@/lib/schemas/admin";

// Radix Select cannot hold an empty value, so "no project" travels as this token.
const NONE = "__none";

interface TestimonialFormProps {
  id: string | null;
  initial: TestimonialInput;
  projects: { value: string; label: string }[];
}

export function TestimonialForm({ id, initial, projects }: TestimonialFormProps) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TestimonialInput>({ resolver: zodResolver(testimonialSchema), defaultValues: initial });

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveTestimonial(id, values);
    if (!result.ok) {
      for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) setError(key as keyof TestimonialInput, { message: messages[0] });
      }
      toast.error(result.message ?? "Could not save the testimonial.");
      return;
    }
    toast.success(id ? "Testimonial saved." : "Testimonial created.");
    if (!id && result.id) {
      router.replace(`/admin/testimonials/${result.id}`);
      return;
    }
    reset(values);
    router.refresh();
  });

  const err = (key: keyof TestimonialInput) => (errors[key] ? `${key}-error` : undefined);
  // A slug pointing at a project that was since deleted still shows, so it can be changed.
  const known = new Set(projects.map((p) => p.value));
  const options = initial.projectSlug && !known.has(initial.projectSlug) ? [...projects, { value: initial.projectSlug, label: `${initial.projectSlug} (missing)` }] : projects;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <FormSection title="Testimonial">
            <Field id="quote" label="Quote" hint="Their words, without quotation marks." error={errors.quote?.message}>
              <Textarea id="quote" rows={4} maxLength={400} aria-invalid={Boolean(errors.quote)} aria-describedby={err("quote") ?? "quote-hint"} {...register("quote")} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="name" label="Name" error={errors.name?.message}>
                <Input id="name" aria-invalid={Boolean(errors.name)} aria-describedby={err("name")} {...register("name")} />
              </Field>
              <Field id="role" label="Role" optional error={errors.role?.message}>
                <Input id="role" placeholder="e.g. Secretary General, JIH" aria-describedby={err("role")} {...register("role")} />
              </Field>
            </div>
            <Field id="context" label="Context" optional hint="What they were talking about." error={errors.context?.message}>
              <Textarea id="context" rows={2} maxLength={160} aria-describedby={err("context") ?? "context-hint"} {...register("context")} />
            </Field>
            <Field id="projectSlug" label="Project" optional error={errors.projectSlug?.message}>
              <Controller
                control={control}
                name="projectSlug"
                render={({ field }) => (
                  <Select value={field.value || NONE} onValueChange={(v) => field.onChange(v === NONE ? "" : v)}>
                    <SelectTrigger id="projectSlug" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>None</SelectItem>
                      {options.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </FormSection>
        </div>

        <div className="space-y-6">
          <FormSection title="Publishing">
            <div className="flex min-h-11 items-center justify-between gap-3">
              <label htmlFor="published" className="text-sm font-medium">
                Show on the site
              </label>
              <Controller control={control} name="published" render={({ field }) => <Switch id="published" checked={field.value} onCheckedChange={field.onChange} />} />
            </div>
            <Field id="order" label="Position" hint="Lower numbers come first." error={errors.order?.message}>
              <Input id="order" type="number" min={0} max={9999} aria-describedby={err("order") ?? "order-hint"} {...register("order", { valueAsNumber: true })} />
            </Field>
          </FormSection>
        </div>
      </div>

      <SaveBar
        pending={isSubmitting}
        dirty={isDirty}
        label={id ? "Save changes" : "Create testimonial"}
        start={
          id ? (
            <DeleteButton name={`the quote from ${initial.name}`} consequence="It disappears from the site." action={deleteTestimonial.bind(null, id)} redirectTo="/admin/testimonials" />
          ) : null
        }
      />
    </form>
  );
}
