import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** A visible label, the control, then a hint or the error beneath it. */
export function Field({ id, label, error, hint, optional, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id} className="text-[0.9375rem] font-medium">
        {label}
        {optional ? <span className="font-normal text-soft">(optional)</span> : null}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Larger, rounder inputs for the public forms on the light pages. */
export const inputClass = "h-12 rounded-xl bg-raised px-4 text-base md:h-12";
export const textareaClass = "min-h-36 rounded-xl bg-raised px-4 py-3 text-base";
