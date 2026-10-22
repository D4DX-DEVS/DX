"use client";

import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/** One titled group of fields in an edit form. */
export function FormSection({ title, description, children, className }: SectionProps) {
  return (
    <section className={cn("rounded-2xl border border-border bg-raised p-4 sm:p-6", className)}>
      <h2 className="text-base font-semibold">{title}</h2>
      {description ? <p className="mt-1 text-sm text-soft">{description}</p> : null}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

interface SaveBarProps {
  pending: boolean;
  dirty: boolean;
  label?: string;
  /** Extra controls on the left (e.g. a delete button). */
  start?: React.ReactNode;
}

/** Sticks to the bottom of the screen so Save is always reachable on long forms. */
export function SaveBar({ pending, dirty, label = "Save changes", start }: SaveBarProps) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-3 border-t border-border bg-ground/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center gap-2">{start}</div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-soft sm:inline" aria-live="polite">
          {pending ? "Saving…" : dirty ? "Unsaved changes" : ""}
        </span>
        <Button type="submit" disabled={pending} className="bg-brand text-on-brand hover:bg-[var(--brand-strong)]">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
          {pending ? "Saving…" : label}
        </Button>
      </div>
    </div>
  );
}
