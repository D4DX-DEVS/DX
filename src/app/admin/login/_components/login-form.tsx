"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field, inputClass } from "@/components/site/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/auth/actions";
import { loginSchema, type LoginInput } from "@/lib/schemas/admin";

export function LoginForm({ next }: { next: string | null }) {
  const [show, setShow] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "", remember: true } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    // On success the action redirects, so only failures come back.
    const result = await login(values, next);
    if (result.ok) return;
    for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
      if (messages?.[0]) setError(key as keyof LoginInput, { message: messages[0] });
    }
    setFormError(result.message ?? "Could not sign in.");
    toast.error(result.message ?? "Could not sign in.");
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError ? (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {formError}
        </p>
      ) : null}
      <Field id="email" label="Email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          autoFocus
          className={inputClass}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
      </Field>
      <Field id="password" label="Password" error={errors.password?.message}>
        <div className="relative">
          <Input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            className={`${inputClass} pr-12`}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            className="absolute top-1/2 right-1 grid size-11 -translate-y-1/2 place-items-center rounded-full text-soft hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </Field>
      <div className="flex min-h-11 items-center gap-3">
        <Controller
          control={control}
          name="remember"
          render={({ field }) => <Checkbox id="remember" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />}
        />
        <Label htmlFor="remember" className="text-sm font-normal text-soft">
          Keep me signed in for 14 days
        </Label>
      </div>
      <button type="submit" disabled={isSubmitting} className="btn btn-brand w-full disabled:opacity-70">
        {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <LogIn className="size-4" aria-hidden="true" />}
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
