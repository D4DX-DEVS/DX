"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, FileText, Loader2, Send, Upload } from "@/components/icons";
import { useRef, useState } from "react";
import { Controller, useForm, type Path } from "react-hook-form";
import { toast } from "sonner";
import { Field, inputClass, textareaClass } from "@/components/site/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitApplication } from "@/lib/actions/public";
import { MAX_PDF_BYTES } from "@/lib/media-utils";
import { applicationSchema, EXPERIENCE_LEVELS, type ApplicationInput } from "@/lib/schemas/forms";
import { cn } from "@/lib/utils";

interface ApplicationFormProps {
  positions: string[];
  initialPosition: string;
  onClose: () => void;
}

function size(bytes: number): string {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** A titled group of fields, as on the Application Form this one follows. */
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid grid-cols-1 gap-x-5 gap-y-5 rounded-2xl bg-raised-2/60 p-5 sm:grid-cols-2">
      <legend className="col-span-full -mx-1 mb-1 px-1 text-[0.9375rem] font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

interface FileDropProps {
  id: string;
  file: File | null;
  error: string;
  empty: string;
  onPick: (file: File | undefined) => void;
}

/** A PDF drop zone: click to choose, or drop a file on it. */
function FileDrop({ id, file, error, empty, onPick }: FileDropProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={input} id={id} type="file" accept="application/pdf,.pdf" className="sr-only" aria-invalid={Boolean(error)} onChange={(e) => onPick(e.target.files?.[0])} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onPick(e.dataTransfer.files[0]);
        }}
        className={cn(
          "group flex min-h-20 w-full items-center gap-4 rounded-xl border-2 border-dashed bg-raised p-4 text-left transition-colors hover:border-brand hover:bg-[var(--brand-tint)]",
          error ? "border-destructive" : "border-input",
        )}
      >
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-raised-2 text-brand-ink transition-transform group-hover:-translate-y-0.5">
          {file ? <FileText className="size-5" /> : <Upload className="size-5" />}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold">{file ? file.name : empty}</span>
          <span className="block text-sm text-soft">{file ? `${size(file.size)} · click to replace` : "PDF, up to 5 MB"}</span>
        </span>
      </button>
    </>
  );
}

/** The Apply Now form (inside a dialog): every field the studio's application form asks, then the résumé. */
export function ApplicationForm({ positions, initialPosition, onClose }: ApplicationFormProps) {
  const [sent, setSent] = useState(false);
  const [resume, setResume] = useState<File | null>(null);
  const [certificates, setCertificates] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState("");
  const [certificatesError, setCertificatesError] = useState("");
  const defaults: ApplicationInput = {
    position: initialPosition,
    name: "",
    email: "",
    phone: "",
    dob: "",
    street: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
    qualification: "",
    course: "",
    specialization: "",
    institution: "",
    graduationYear: "",
    grade: "",
    experience: "" as ApplicationInput["experience"],
    keySkills: "",
    designation: "",
    notice: "",
    primarySkills: "",
    secondarySkills: "",
    frameworks: "",
    tools: "",
    databases: "",
    projectExperience: "",
    projectDescription: "",
    portfolioUrl: "",
    githubUrl: "",
    otherLinks: "",
    relocate: "",
    consentAccurate: false,
    consentData: false,
    website: "",
  };
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationInput>({ resolver: zodResolver(applicationSchema), defaultValues: defaults });

  const pick = (kind: "resume" | "certificates") => (file: File | undefined) => {
    if (!file) return;
    const setFile = kind === "resume" ? setResume : setCertificates;
    const fail = kind === "resume" ? setResumeError : setCertificatesError;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return fail("Attach a PDF.");
    if (file.size > MAX_PDF_BYTES) return fail("The file must be 5 MB or smaller.");
    fail("");
    setFile(file);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!resume) {
      setResumeError("Attach your résumé as a PDF.");
      return;
    }
    const form = new FormData();
    for (const [key, value] of Object.entries(values)) form.set(key, typeof value === "boolean" ? String(value) : (value ?? ""));
    form.set("resume", resume);
    if (certificates) form.set("certificates", certificates);
    const result = await submitApplication(form);
    if (result.ok) {
      toast.success("Application received. Thank you!");
      setSent(true);
      return;
    }
    for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
      if (!messages?.[0]) continue;
      if (key === "resume") setResumeError(messages[0]);
      else if (key === "certificates") setCertificatesError(messages[0]);
      else setError(key as Path<ApplicationInput>, { message: messages[0] });
    }
    toast.error(result.message ?? "Could not send your application.");
  });

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-start p-8 sm:p-10">
        <span className="grid size-14 place-items-center rounded-2xl bg-[var(--brand-tint)] text-brand-ink">
          <CircleCheck className="size-7" aria-hidden="true" />
        </span>
        <h3 className="mt-6 text-2xl font-semibold tracking-[-0.02em]">Application received</h3>
        <p className="mt-2 max-w-[44ch] text-soft">We read every application. If your profile fits, we will call you to arrange a conversation.</p>
        <button type="button" onClick={onClose} className="btn btn-brand mt-8">
          Close
        </button>
      </div>
    );
  }

  const text = (name: Exclude<keyof ApplicationInput, "experience" | "consentAccurate" | "consentData" | "position" | "website">, label: string, o: { required?: boolean; type?: string; auto?: string; placeholder?: string; wide?: boolean } = {}) => (
    <Field id={`app-${name}`} label={o.required ? `${label} *` : label} error={errors[name]?.message} className={o.wide ? "sm:col-span-2" : undefined}>
      <Input
        id={`app-${name}`}
        type={o.type ?? "text"}
        autoComplete={o.auto}
        placeholder={o.placeholder}
        className={inputClass}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `app-${name}-error` : undefined}
        {...register(name)}
      />
    </Field>
  );
  const area = (name: "keySkills" | "primarySkills" | "secondarySkills" | "frameworks" | "tools" | "databases" | "projectExperience" | "projectDescription" | "otherLinks", label: string, o: { required?: boolean; rows?: number } = {}) => (
    <Field id={`app-${name}`} label={o.required ? `${label} *` : label} error={errors[name]?.message} className="sm:col-span-2">
      <Textarea
        id={`app-${name}`}
        rows={o.rows ?? 3}
        className={cn(textareaClass, "min-h-24")}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `app-${name}-error` : undefined}
        {...register(name)}
      />
    </Field>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-5 p-5 sm:p-8">
      <div className="grid grid-cols-1 gap-5">
        {text("name", "Full Name", { required: true, auto: "name" })}
        <Field id="app-position" label="Position Applied For *" error={errors.position?.message}>
          <Controller
            control={control}
            name="position"
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="app-position" className={cn("w-full", inputClass)} aria-invalid={Boolean(errors.position)} aria-describedby={errors.position ? "app-position-error" : undefined}>
                  <SelectValue placeholder="e.g. Flutter Developer" />
                </SelectTrigger>
                <SelectContent className="theme-light z-[70]">
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
      </div>

      <Group title="Personal Information">
        {text("phone", "Mobile Number", { required: true, type: "tel", auto: "tel" })}
        {text("email", "Email Address", { required: true, type: "email", auto: "email" })}
        {text("dob", "Date of Birth", { required: true, type: "date", auto: "bday", wide: true })}
        {text("street", "Street Address", { auto: "address-line1", wide: true })}
        {text("address2", "Apartment, suite, etc", { auto: "address-line2", wide: true })}
        {text("city", "City", { auto: "address-level2" })}
        {text("state", "State / Province", { auto: "address-level1" })}
        {text("zip", "ZIP / Postal Code", { auto: "postal-code" })}
        {text("country", "Country", { auto: "country-name" })}
      </Group>

      <Group title="Educational Qualification">
        {text("qualification", "Highest Educational Qualification", { required: true })}
        {text("course", "Degree / Course Name", { required: true })}
        {text("specialization", "Specialization / Major")}
        {text("institution", "University / Institution", { required: true })}
        {text("graduationYear", "Year of Graduation / PG", { required: true })}
        {text("grade", "Percentage / CGPA")}
      </Group>

      <Group title="Position & Professional Details">
        <Field id="app-experience" label="Experience *" error={errors.experience?.message} className="sm:col-span-2">
          <Controller
            control={control}
            name="experience"
            render={({ field }) => (
              <div role="radiogroup" aria-labelledby="app-experience-label" className="flex flex-wrap gap-2.5">
                {EXPERIENCE_LEVELS.map((level) => {
                  const on = field.value === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => field.onChange(level)}
                      className={cn(
                        "inline-flex min-h-11 items-center rounded-full px-5 text-[0.9375rem] font-medium transition-[background-color,color,box-shadow] duration-200",
                        on ? "bg-brand text-on-brand shadow-[0_8px_20px_-8px_rgb(45_80_210/0.8)]" : "bg-raised ring-1 ring-border hover:ring-brand",
                      )}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </Field>
        {area("keySkills", "Key Skills / Technologies", { required: true })}
        {text("designation", "Current / Last Designation")}
        {text("notice", "Notice Period / Availability to Join", { required: true })}
      </Group>

      <Group title="Skills & Technical Information">
        {area("primarySkills", "Primary Skills", { rows: 2 })}
        {area("secondarySkills", "Secondary Skills", { rows: 2 })}
        {area("frameworks", "Frameworks / Technologies", { rows: 2 })}
        {area("tools", "Tools & Platforms", { rows: 2 })}
        {area("databases", "Database Technologies", { rows: 2 })}
      </Group>

      <Group title="Projects & Portfolio">
        {area("projectExperience", "Relevant Project Experience")}
        {area("projectDescription", "Project Description")}
        {text("portfolioUrl", "Portfolio URL", { type: "url", placeholder: "https://" })}
        {text("githubUrl", "GitHub Profile", { type: "url", placeholder: "https://github.com/" })}
        {area("otherLinks", "Other Relevant Links", { rows: 2 })}
      </Group>

      <Group title="Resume & Supporting Documents">
        <Field id="app-resume" label="Upload Resume / CV (PDF) *" error={resumeError} className="sm:col-span-2">
          <FileDrop id="app-resume" file={resume} error={resumeError} empty="Choose a PDF or drop it here" onPick={pick("resume")} />
        </Field>
        <Field id="app-certificates" label="Additional Certifications" error={certificatesError} className="sm:col-span-2">
          <FileDrop id="app-certificates" file={certificates} error={certificatesError} empty="Add a PDF of your certificates (optional)" onPick={pick("certificates")} />
        </Field>
        {text("relocate", "Willingness to Relocate", { wide: true })}
      </Group>

      <div className="flex flex-col gap-3">
        {(
          [
            ["consentAccurate", "I confirm that the information provided above is accurate and complete"],
            ["consentData", "I agree that D4DX Innovations LLP may use the information provided for recruitment and employment purposes"],
          ] as const
        ).map(([name, label]) => (
          <div key={name}>
            <div className="flex items-start gap-3">
              <Controller
                control={control}
                name={name}
                render={({ field }) => (
                  <Checkbox id={`app-${name}`} checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} aria-invalid={Boolean(errors[name])} className="mt-0.5 size-5 rounded-md" />
                )}
              />
              <label htmlFor={`app-${name}`} className="text-[0.9375rem] leading-snug">
                {label} *
              </label>
            </div>
            {errors[name] ? (
              <p role="alert" className="mt-1 pl-8 text-sm text-destructive">
                {errors[name]?.message}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="app-website">Website</label>
        <input id="app-website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting} className="btn btn-brand disabled:opacity-70">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
          {isSubmitting ? "Sending…" : "Submit"}
        </button>
      </div>
    </form>
  );
}
