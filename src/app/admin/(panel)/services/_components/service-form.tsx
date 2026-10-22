"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { DeleteButton } from "@/components/admin/delete-button";
import { FormSection, SaveBar } from "@/components/admin/fields/form-shell";
import { ListField } from "@/components/admin/fields/list-field";
import { Field } from "@/components/site/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { deleteService, saveService } from "@/lib/actions/admin/services";
import { slugify } from "@/lib/listing";
import { serviceSchema, type ServiceInput } from "@/lib/schemas/admin";

// Radix Select cannot hold an empty value, so "no project" travels as this token.
const NONE = "__none";

interface ServiceFormProps {
  id: string | null;
  initial: ServiceInput;
  projects: { value: string; label: string }[];
}

export function ServiceForm({ id, initial, projects }: ServiceFormProps) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<ServiceInput>({ resolver: zodResolver(serviceSchema), defaultValues: initial });

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveService(id, values);
    if (!result.ok) {
      for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) setError(key as keyof ServiceInput, { message: messages[0] });
      }
      toast.error(result.message ?? "Could not save the service.");
      return;
    }
    toast.success(id ? "Service saved." : "Service created.");
    if (!id && result.id) {
      router.replace(`/admin/services/${result.id}`);
      return;
    }
    reset(values);
    router.refresh();
  });

  const err = (name: keyof ServiceInput) => (errors[name] ? `${name}-error` : undefined);
  // A slug pointing at a project that was since deleted or unpublished still shows, so it can be changed.
  const known = new Set(projects.map((p) => p.value));
  const options = initial.proofProjectSlug && !known.has(initial.proofProjectSlug) ? [...projects, { value: initial.proofProjectSlug, label: `${initial.proofProjectSlug} (not published)` }] : projects;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <FormSection title="Service">
            <Field id="title" label="Title" error={errors.title?.message}>
              <Input
                id="title"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={err("title")}
                {...register("title", {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    if (!id && !dirtyFields.slug) setValue("slug", slugify(e.target.value));
                  },
                })}
              />
            </Field>
            <Field id="slug" label="Slug" hint="A short, unique id: lowercase letters, numbers and hyphens." error={errors.slug?.message}>
              <Input id="slug" aria-invalid={Boolean(errors.slug)} aria-describedby={err("slug") ?? "slug-hint"} {...register("slug")} />
            </Field>
            <Field id="summary" label="Summary" error={errors.summary?.message}>
              <Textarea id="summary" rows={4} maxLength={400} aria-invalid={Boolean(errors.summary)} aria-describedby={err("summary")} {...register("summary")} />
            </Field>
            <Field id="points" label="What is included" optional error={errors.points?.message}>
              <Controller
                control={control}
                name="points"
                render={({ field }) => <ListField id="points" value={field.value} onChange={field.onChange} max={12} placeholder="e.g. API integration and cloud backend" />}
              />
            </Field>
          </FormSection>

          <FormSection title="Proof" description="A line and a project that show the service in practice.">
            <Field id="proof" label="Proof line" optional error={errors.proof?.message}>
              <Textarea id="proof" rows={2} maxLength={300} aria-describedby={err("proof")} {...register("proof")} />
            </Field>
            <Field id="proofProjectSlug" label="Proof project" optional error={errors.proofProjectSlug?.message}>
              <Controller
                control={control}
                name="proofProjectSlug"
                render={({ field }) => (
                  <Select value={field.value || NONE} onValueChange={(v) => field.onChange(v === NONE ? "" : v)}>
                    <SelectTrigger id="proofProjectSlug" className="w-full">
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
        label={id ? "Save changes" : "Create service"}
        start={
          id ? (
            <DeleteButton name={initial.title} consequence="It disappears from the services page and the home page." action={deleteService.bind(null, id)} redirectTo="/admin/services" />
          ) : null
        }
      />
    </form>
  );
}
