"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormSection, SaveBar } from "@/components/admin/fields/form-shell";
import { Field } from "@/components/site/field";
import { Input } from "@/components/ui/input";
import { saveAccount } from "@/lib/actions/admin/account";
import { accountSchema, type AccountInput } from "@/lib/schemas/admin";

interface AccountFormProps {
  name: string;
  email: string;
}

export function AccountForm({ name, email }: AccountFormProps) {
  const router = useRouter();
  const defaults: AccountInput = { name, currentPassword: "", newPassword: "", confirmPassword: "" };
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AccountInput>({ resolver: zodResolver(accountSchema), defaultValues: defaults });

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveAccount(values);
    if (!result.ok) {
      for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) setError(key as keyof AccountInput, { message: messages[0] });
      }
      toast.error(result.message ?? "Could not save your account.");
      return;
    }
    toast.success(result.message ?? "Account saved.");
    reset({ name: values.name, currentPassword: "", newPassword: "", confirmPassword: "" });
    router.refresh();
  });

  const err = (field: keyof AccountInput, hint?: string) => (errors[field] ? `${field}-error` : hint);

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-2xl space-y-6">
      <FormSection title="Profile">
        <Field id="name" label="Name" hint="Shown in the admin's top bar." error={errors.name?.message}>
          <Input id="name" autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={err("name", "name-hint")} {...register("name")} />
        </Field>
        <Field id="account-email" label="Email" hint="Ask an owner to change the email you sign in with.">
          <Input id="account-email" type="email" value={email} readOnly disabled aria-describedby="account-email-hint" />
        </Field>
      </FormSection>

      <FormSection title="Change password" description="Leave these empty to keep your password. A new one signs you out on every other device.">
        <input type="email" autoComplete="username" value={email} readOnly hidden />
        <Field id="currentPassword" label="Current password" error={errors.currentPassword?.message}>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.currentPassword)}
            aria-describedby={err("currentPassword")}
            {...register("currentPassword")}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="newPassword" label="New password" hint="At least 10 characters." error={errors.newPassword?.message}>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.newPassword)}
              aria-describedby={err("newPassword", "newPassword-hint")}
              {...register("newPassword")}
            />
          </Field>
          <Field id="confirmPassword" label="Repeat new password" error={errors.confirmPassword?.message}>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={err("confirmPassword")}
              {...register("confirmPassword")}
            />
          </Field>
        </div>
      </FormSection>

      <SaveBar pending={isSubmitting} dirty={isDirty} />
    </form>
  );
}
