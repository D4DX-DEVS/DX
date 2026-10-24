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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { deleteJob, saveJob } from "@/lib/actions/admin/jobs";
import { slugify } from "@/lib/listing";
import { jobSchema, type JobInput } from "@/lib/schemas/admin";

interface JobFormProps {
  id: string | null;
  initial: JobInput;
}

export function JobForm({ id, initial }: JobFormProps) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<JobInput>({ resolver: zodResolver(jobSchema), defaultValues: initial });

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveJob(id, values);
    if (!result.ok) {
      for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) setError(key as keyof JobInput, { message: messages[0] });
      }
      toast.error(result.message ?? "Could not save the job.");
      return;
    }
    toast.success(id ? "Job saved." : "Job created.");
    if (!id && result.id) {
      router.replace(`/admin/jobs/${result.id}`);
      return;
    }
    reset(values);
    router.refresh();
  });

  const err = (name: string) => (name in errors ? `${name}-error` : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <FormSection title="The role">
            <Field id="title" label="Title" error={errors.title?.message}>
              <Input
                id="title"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={err("title")}
                {...register("title", {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    // New jobs get a slug from the title until the slug is edited by hand.
                    if (!id && !dirtyFields.slug) setValue("slug", slugify(e.target.value));
                  },
                })}
              />
            </Field>
            <Field id="slug" label="Slug" hint="A short unique name: lowercase letters, numbers and hyphens." error={errors.slug?.message}>
              <Input id="slug" aria-invalid={Boolean(errors.slug)} aria-describedby={err("slug") ?? "slug-hint"} {...register("slug")} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field id="level" label="Level" optional error={errors.level?.message}>
                <Input id="level" placeholder="e.g. Experienced" {...register("level")} />
              </Field>
              <Field id="experience" label="Experience" optional error={errors.experience?.message}>
                <Input id="experience" placeholder="e.g. 1+ year" {...register("experience")} />
              </Field>
              <Field id="location" label="Location" optional error={errors.location?.message}>
                <Input id="location" placeholder="e.g. Calicut, on site" {...register("location")} />
              </Field>
            </div>
            <Field id="summary" label="Summary" optional error={errors.summary?.message}>
              <Textarea id="summary" rows={4} maxLength={600} {...register("summary")} />
            </Field>
            <Field id="requirements" label="Requirements" optional error={errors.requirements?.message}>
              <Controller
                control={control}
                name="requirements"
                render={({ field }) => (
                  <ListField id="requirements" value={field.value} onChange={field.onChange} placeholder="e.g. A year of shipping Flutter apps" max={20} maxLength={300} />
                )}
              />
            </Field>
          </FormSection>
        </div>

        <div className="space-y-6">
          <FormSection title="Publishing">
            <div className="flex min-h-11 items-center justify-between gap-3">
              <label htmlFor="open" className="text-sm font-medium">
                Open for applications
              </label>
              <Controller control={control} name="open" render={({ field }) => <Switch id="open" checked={field.value} onCheckedChange={field.onChange} />} />
            </div>
            <Field id="order" label="Position" hint="Lower numbers come first." error={errors.order?.message}>
              <Input id="order" type="number" min={0} max={9999} {...register("order", { valueAsNumber: true })} />
            </Field>
          </FormSection>
        </div>
      </div>

      <SaveBar
        pending={isSubmitting}
        dirty={isDirty}
        label={id ? "Save changes" : "Create job"}
        start={id ? <DeleteButton name={initial.title} consequence="It disappears from the Join Our Team page." action={deleteJob.bind(null, id)} redirectTo="/admin/jobs" /> : null}
      />
    </form>
  );
}
