"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormSection, SaveBar } from "@/components/admin/fields/form-shell";
import { ListField } from "@/components/admin/fields/list-field";
import { Field } from "@/components/site/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveSettings } from "@/lib/actions/admin/settings";
import { settingsSchema, type SettingsInput } from "@/lib/schemas/admin";

const SOCIALS = [
  { key: "linkedin", label: "LinkedIn" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
] as const;

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsInput>({ resolver: zodResolver(settingsSchema), defaultValues: initial });

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveSettings(values);
    if (!result.ok) {
      for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) setError(key as keyof SettingsInput, { message: messages[0] });
      }
      toast.error(result.message ?? "Could not save the settings.");
      return;
    }
    toast.success("Settings saved.");
    reset(values);
    router.refresh();
  });

  const err = (name: string) => (name in errors ? `${name}-error` : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <FormSection title="Contact" description="Where people reach the studio.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="email" label="Email" optional error={errors.email?.message}>
              <Input id="email" type="email" aria-invalid={Boolean(errors.email)} aria-describedby={err("email")} {...register("email")} />
            </Field>
            <Field id="phone" label="Phone" optional error={errors.phone?.message}>
              <Input id="phone" type="tel" aria-invalid={Boolean(errors.phone)} {...register("phone")} />
            </Field>
            <Field id="careersEmail" label="Careers email" optional error={errors.careersEmail?.message}>
              <Input id="careersEmail" type="email" aria-invalid={Boolean(errors.careersEmail)} aria-describedby={err("careersEmail")} {...register("careersEmail")} />
            </Field>
            <Field id="careersPhone" label="Careers phone" optional error={errors.careersPhone?.message}>
              <Input id="careersPhone" type="tel" aria-invalid={Boolean(errors.careersPhone)} {...register("careersPhone")} />
            </Field>
          </div>
          <Field id="whatsapp" label="WhatsApp number" optional hint="Digits only, with the country code (e.g. 919895804006)." error={errors.whatsapp?.message}>
            <Input
              id="whatsapp"
              inputMode="numeric"
              aria-invalid={Boolean(errors.whatsapp)}
              aria-describedby={err("whatsapp") ?? "whatsapp-hint"}
              {...register("whatsapp")}
            />
          </Field>
        </FormSection>

        <FormSection title="Address">
          <Field id="addressLines" label="Address lines" optional hint="One line per row, in the order they are printed." error={errors.addressLines?.message}>
            <Controller
              control={control}
              name="addressLines"
              render={({ field }) => (
                <ListField id="addressLines" value={field.value} onChange={field.onChange} placeholder="e.g. Mavoor Road, Thiruthiyad" max={6} maxLength={120} />
              )}
            />
          </Field>
          <Field id="mapUrl" label="Map link" optional error={errors.mapUrl?.message}>
            <Input id="mapUrl" type="url" placeholder="https://maps.app.goo.gl/…" aria-invalid={Boolean(errors.mapUrl)} aria-describedby={err("mapUrl")} {...register("mapUrl")} />
          </Field>
        </FormSection>

        <FormSection title="Social links" description="Leave empty what you do not use.">
          {SOCIALS.map((s) => (
            <Field key={s.key} id={`socials.${s.key}`} label={s.label} optional error={errors.socials?.[s.key]?.message}>
              <Input id={`socials.${s.key}`} type="url" placeholder="https://" aria-invalid={Boolean(errors.socials?.[s.key])} {...register(`socials.${s.key}`)} />
            </Field>
          ))}
        </FormSection>

        <FormSection title="Tagline" description="The short line about the studio, used in the footer and search results.">
          <Field id="tagline" label="Tagline" optional error={errors.tagline?.message}>
            <Textarea id="tagline" rows={3} maxLength={220} aria-invalid={Boolean(errors.tagline)} {...register("tagline")} />
          </Field>
        </FormSection>
      </div>

      <SaveBar pending={isSubmitting} dirty={isDirty} label="Save settings" />
    </form>
  );
}
