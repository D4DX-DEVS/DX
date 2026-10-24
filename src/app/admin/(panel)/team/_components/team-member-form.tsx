"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { DeleteButton } from "@/components/admin/delete-button";
import { FormSection, SaveBar } from "@/components/admin/fields/form-shell";
import { ImageField } from "@/components/admin/fields/image-field";
import { Field } from "@/components/site/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { deleteTeamMember, saveTeamMember } from "@/lib/actions/admin/team";
import { teamMemberSchema, type TeamMemberInput } from "@/lib/schemas/admin";

interface TeamMemberFormProps {
  id: string | null;
  initial: TeamMemberInput;
}

export function TeamMemberForm({ id, initial }: TeamMemberFormProps) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TeamMemberInput>({ resolver: zodResolver(teamMemberSchema), defaultValues: initial });

  const name = useWatch({ control, name: "name" });

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveTeamMember(id, values);
    if (!result.ok) {
      for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) setError(key as keyof TeamMemberInput, { message: messages[0] });
      }
      toast.error(result.message ?? "Could not save the team member.");
      return;
    }
    toast.success(id ? "Team member saved." : "Team member added.");
    if (!id && result.id) {
      router.replace(`/admin/team/${result.id}`);
      return;
    }
    reset(values);
    router.refresh();
  });

  const err = (key: keyof TeamMemberInput) => (errors[key] ? `${key}-error` : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <FormSection title="Person">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="name" label="Name" error={errors.name?.message}>
                <Input id="name" autoComplete="off" aria-invalid={Boolean(errors.name)} aria-describedby={err("name")} {...register("name")} />
              </Field>
              <Field id="role" label="Role" error={errors.role?.message}>
                <Input id="role" aria-invalid={Boolean(errors.role)} aria-describedby={err("role")} {...register("role")} />
              </Field>
            </div>
            <Field id="linkedin" label="LinkedIn profile" optional error={errors.linkedin?.message}>
              <Input id="linkedin" type="url" placeholder="https://www.linkedin.com/in/…" aria-invalid={Boolean(errors.linkedin)} aria-describedby={err("linkedin")} {...register("linkedin")} />
            </Field>
          </FormSection>

          <FormSection title="Photo" description="A head-and-shoulders portrait with a plain background works best. When you save, the site makes a pencil-sketch version of it automatically; visitors see the sketch, and the colour photo when they hover.">
            <Field id="photo" label="Portrait" optional error={errors.photo?.message}>
              <Controller
                control={control}
                name="photo"
                render={({ field }) => (
                  <ImageField id="photo" value={field.value} onChange={field.onChange} defaultAlt={name ? `Portrait of ${name}` : ""} aspect="portrait" invalid={Boolean(errors.photo)} />
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
        label={id ? "Save changes" : "Add team member"}
        start={id ? <DeleteButton name={initial.name} consequence="They disappear from the about page." action={deleteTeamMember.bind(null, id)} redirectTo="/admin/team" /> : null}
      />
    </form>
  );
}
