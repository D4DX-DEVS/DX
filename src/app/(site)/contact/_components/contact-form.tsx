"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, Loader2, Send } from "@/components/icons";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field, inputClass, textareaClass } from "@/components/site/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitInquiry } from "@/lib/actions/public";
import { inquirySchema, type InquiryInput } from "@/lib/schemas/forms";

export interface ServiceOption {
  value: string;
  label: string;
}

interface ContactFormProps {
  options: ServiceOption[];
  /** Pre-selected from ?type= when arriving from a "Start a project" link. */
  initialService: string;
}

export function ContactForm({ options, initialService }: ContactFormProps) {
  const [sent, setSent] = useState(false);
  const defaults: InquiryInput = { name: "", email: "", phone: "", service: initialService, message: "", website: "" };
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InquiryInput>({ resolver: zodResolver(inquirySchema), defaultValues: defaults });

  const onSubmit = handleSubmit(async (values) => {
    const result = await submitInquiry(values);
    if (result.ok) {
      toast.success("Thanks, your message is with us. We will call you back soon.");
      reset(defaults);
      setSent(true);
      return;
    }
    for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
      if (messages?.[0]) setError(key as keyof InquiryInput, { message: messages[0] });
    }
    toast.error(result.message ?? "Could not send your message.");
  });

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-start rounded-3xl border border-border bg-raised p-8 sm:p-10">
        <span className="grid size-14 place-items-center rounded-2xl bg-[var(--brand-tint)] text-brand-ink">
          <CircleCheck className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-6 text-2xl font-semibold tracking-[-0.02em]">Message sent</h2>
        <p className="mt-2 max-w-[44ch] text-soft">We read every message and reply within one working day, usually with a call.</p>
        <button type="button" onClick={() => setSent(false)} className="btn btn-outline mt-8">
          Send another message
        </button>
      </div>
    );
  }

  const describedBy = (name: keyof InquiryInput) => (errors[name] ? `${name}-error` : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-5 rounded-3xl border border-border bg-raised p-6 sm:grid-cols-2 sm:p-8 md:p-10">
      <Field id="name" label="Your name" error={errors.name?.message}>
        <Input id="name" autoComplete="name" className={inputClass} aria-invalid={Boolean(errors.name)} aria-describedby={describedBy("name")} {...register("name")} />
      </Field>
      <Field id="email" label="Email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          className={inputClass}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describedBy("email")}
          {...register("email")}
        />
      </Field>
      <Field id="phone" label="Phone or WhatsApp" optional error={errors.phone?.message}>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          className={inputClass}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={describedBy("phone")}
          {...register("phone")}
        />
      </Field>
      <Field id="service" label="What are you building?" optional error={errors.service?.message}>
        <Controller
          control={control}
          name="service"
          render={({ field }) => (
            <Select value={field.value || undefined} onValueChange={field.onChange}>
              <SelectTrigger id="service" className={`w-full ${inputClass}`} aria-invalid={Boolean(errors.service)}>
                <SelectValue placeholder="Choose one" />
              </SelectTrigger>
              <SelectContent className="theme-light">
                {options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field id="message" label="Tell us about it" error={errors.message?.message} hint="Who will use it, and what must it do on day one?" className="sm:col-span-2">
        <Textarea
          id="message"
          rows={6}
          className={textareaClass}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describedBy("message") ?? "message-hint"}
          {...register("message")}
        />
      </Field>
      {/* Honeypot: hidden from people and from assistive technology. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      <div className="flex flex-col-reverse gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-soft">We only use your details to reply to you.</p>
        <button type="submit" disabled={isSubmitting} className="btn btn-brand disabled:opacity-70">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
          {isSubmitting ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
