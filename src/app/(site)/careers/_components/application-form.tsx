"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, FileText, Loader2, Send, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field, inputClass, textareaClass } from "@/components/site/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitApplication } from "@/lib/actions/public";
import { MAX_PDF_BYTES } from "@/lib/media-utils";
import { applicationSchema, type ApplicationInput } from "@/lib/schemas/forms";
import { cn } from "@/lib/utils";

interface ApplicationFormProps {
  positions: string[];
  initialPosition: string;
}

const EXPERIENCE = ["Fresher", "Less than 1 year", "1–2 years", "3–5 years", "More than 5 years"];

function size(bytes: number): string {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function ApplicationForm({ positions, initialPosition }: ApplicationFormProps) {
  const [sent, setSent] = useState(false);
  const [resume, setResume] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const defaults: ApplicationInput = {
    position: initialPosition,
    name: "",
    email: "",
    phone: "",
    experience: "",
    portfolioUrl: "",
    githubUrl: "",
    message: "",
    website: "",
  };
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationInput>({ resolver: zodResolver(applicationSchema), defaultValues: defaults });

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setResumeError("Attach your résumé as a PDF.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setResumeError("The résumé must be 5 MB or smaller.");
      return;
    }
    setResumeError("");
    setResume(file);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!resume) {
      setResumeError("Attach your résumé as a PDF.");
      return;
    }
    const form = new FormData();
    for (const [key, value] of Object.entries(values)) form.set(key, value ?? "");
    form.set("resume", resume);
    const result = await submitApplication(form);
    if (result.ok) {
      toast.success("Application received. Thank you!");
      reset(defaults);
      setResume(null);
      setSent(true);
      return;
    }
    for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
      if (!messages?.[0]) continue;
      if (key === "resume") setResumeError(messages[0]);
      else setError(key as keyof ApplicationInput, { message: messages[0] });
    }
    toast.error(result.message ?? "Could not send your application.");
  });

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-start rounded-3xl border border-border bg-raised p-8 sm:p-10">
        <span className="grid size-14 place-items-center rounded-2xl bg-[var(--brand-tint)] text-brand-ink">
          <CircleCheck className="size-7" aria-hidden="true" />
        </span>
        <h3 className="mt-6 text-2xl font-semibold tracking-[-0.02em]">Application received</h3>
        <p className="mt-2 max-w-[44ch] text-soft">We read every application. If your profile fits, we will call you to arrange a conversation.</p>
        <button type="button" onClick={() => setSent(false)} className="btn btn-outline mt-8">
          Apply for another role
        </button>
      </div>
    );
  }

  const describedBy = (name: keyof ApplicationInput) => (errors[name] ? `${name}-error` : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="relative grid grid-cols-1 gap-5 rounded-3xl border border-border bg-raised p-6 sm:grid-cols-2 sm:p-8 md:p-10">
      <Field id="position" label="Position" error={errors.position?.message} className="sm:col-span-2">
        <Controller
          control={control}
          name="position"
          render={({ field }) => (
            <Select value={field.value || undefined} onValueChange={field.onChange}>
              <SelectTrigger id="position" className={cn("w-full", inputClass)} aria-invalid={Boolean(errors.position)} aria-describedby={describedBy("position")}>
                <SelectValue placeholder="Choose a position" />
              </SelectTrigger>
              <SelectContent className="theme-light">
                {positions.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field id="app-name" label="Full name" error={errors.name?.message}>
        <Input id="app-name" autoComplete="name" className={inputClass} aria-invalid={Boolean(errors.name)} {...register("name")} />
      </Field>
      <Field id="app-email" label="Email" error={errors.email?.message}>
        <Input id="app-email" type="email" autoComplete="email" className={inputClass} aria-invalid={Boolean(errors.email)} {...register("email")} />
      </Field>
      <Field id="app-phone" label="Phone" error={errors.phone?.message}>
        <Input id="app-phone" type="tel" autoComplete="tel" className={inputClass} aria-invalid={Boolean(errors.phone)} {...register("phone")} />
      </Field>
      <Field id="experience" label="Experience" optional error={errors.experience?.message}>
        <Controller
          control={control}
          name="experience"
          render={({ field }) => (
            <Select value={field.value || undefined} onValueChange={field.onChange}>
              <SelectTrigger id="experience" className={cn("w-full", inputClass)}>
                <SelectValue placeholder="Choose one" />
              </SelectTrigger>
              <SelectContent className="theme-light">
                {EXPERIENCE.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field id="portfolioUrl" label="Portfolio" optional error={errors.portfolioUrl?.message}>
        <Input id="portfolioUrl" type="url" placeholder="https://" className={inputClass} aria-invalid={Boolean(errors.portfolioUrl)} {...register("portfolioUrl")} />
      </Field>
      <Field id="githubUrl" label="GitHub" optional error={errors.githubUrl?.message}>
        <Input id="githubUrl" type="url" placeholder="https://github.com/" className={inputClass} aria-invalid={Boolean(errors.githubUrl)} {...register("githubUrl")} />
      </Field>

      <Field id="resume" label="Résumé (PDF, up to 5 MB)" error={resumeError} className="sm:col-span-2">
        <input
          ref={fileInput}
          id="resume"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          aria-invalid={Boolean(resumeError)}
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pickFile(e.dataTransfer.files[0]);
          }}
          className={cn(
            "group flex min-h-24 w-full items-center gap-4 rounded-xl border-2 border-dashed bg-raised-2/50 p-4 text-left transition-colors hover:border-brand hover:bg-[var(--brand-tint)]",
            resumeError ? "border-destructive" : "border-input",
          )}
        >
          <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-raised text-brand-ink transition-transform group-hover:-translate-y-0.5">
            {resume ? <FileText className="size-5" /> : <Upload className="size-5" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold">{resume ? resume.name : "Choose a PDF or drop it here"}</span>
            <span className="block text-sm text-soft">{resume ? `${size(resume.size)} · click to replace` : "Your latest CV"}</span>
          </span>
        </button>
      </Field>

      <Field id="app-message" label="Anything else?" optional error={errors.message?.message} className="sm:col-span-2">
        <Textarea id="app-message" rows={4} className={textareaClass} {...register("message")} />
      </Field>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="app-website">Website</label>
        <input id="app-website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      <div className="flex justify-end sm:col-span-2">
        <button type="submit" disabled={isSubmitting} className="btn btn-brand disabled:opacity-70">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
          {isSubmitting ? "Sending…" : "Send application"}
        </button>
      </div>
    </form>
  );
}
