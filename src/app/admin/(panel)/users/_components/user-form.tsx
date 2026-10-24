"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "@/components/icons";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { DeleteButton } from "@/components/admin/delete-button";
import { FormSection, SaveBar } from "@/components/admin/fields/form-shell";
import { Field } from "@/components/site/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteUser, saveUser } from "@/lib/actions/admin/users";
import { adminUserSchema, type AdminUserInput } from "@/lib/schemas/admin";

// A new admin needs a password; on edit an empty one keeps the current password.
const createSchema = adminUserSchema.refine((v) => v.password.length > 0, { path: ["password"], message: "Set a password for the new admin." });

interface UserFormProps {
  id: string | null;
  initial: AdminUserInput;
  isSelf?: boolean;
}

export function UserForm({ id, initial, isSelf = false }: UserFormProps) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminUserInput>({ resolver: zodResolver(id ? adminUserSchema : createSchema), defaultValues: initial });

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveUser(id, values);
    if (!result.ok) {
      for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) setError(key as keyof AdminUserInput, { message: messages[0] });
      }
      toast.error(result.message ?? "Could not save the admin.");
      return;
    }
    toast.success(id ? "Admin saved." : "Admin created. They can sign in now.");
    if (!id && result.id) {
      router.replace(`/admin/users/${result.id}`);
      return;
    }
    reset({ ...values, password: "" });
    router.refresh();
  });

  const err = (name: keyof AdminUserInput) => (errors[name] ? `${name}-error` : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-2xl space-y-6">
      <FormSection title="Profile">
        <Field id="name" label="Name" error={errors.name?.message}>
          <Input id="name" autoComplete="off" aria-invalid={Boolean(errors.name)} aria-describedby={err("name")} {...register("name")} />
        </Field>
        <Field id="email" label="Email" hint="Used to sign in." error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="off"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={err("email") ?? "email-hint"}
            {...register("email")}
          />
        </Field>
        <Field
          id="role"
          label="Role"
          hint={isSelf ? "This is your account. You can only step down if another owner remains." : "Owners can also manage admin users; editors manage content and the inbox."}
          error={errors.role?.message}
        >
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="role" className="w-full" aria-describedby={err("role") ?? "role-hint"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </FormSection>

      <FormSection
        title={id ? "Reset password" : "Password"}
        description={id ? "Leave empty to keep the current password. Setting one signs this admin out on every device." : "Share it with them privately; they can change it under Your account."}
      >
        <Field id="password" label={id ? "New password" : "Password"} optional={Boolean(id)} hint="At least 10 characters." error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              className="pr-12"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={err("password") ?? "password-hint"}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              aria-pressed={show}
              className="absolute top-1/2 right-0.5 grid size-11 -translate-y-1/2 place-items-center rounded-full text-soft hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:size-9"
            >
              {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            </button>
          </div>
        </Field>
      </FormSection>

      <SaveBar
        pending={isSubmitting}
        dirty={isDirty}
        label={id ? "Save changes" : "Create admin"}
        start={
          id && !isSelf ? (
            <DeleteButton name={initial.name} consequence="They can no longer sign in to the admin." action={deleteUser.bind(null, id)} redirectTo="/admin/users" />
          ) : null
        }
      />
    </form>
  );
}
