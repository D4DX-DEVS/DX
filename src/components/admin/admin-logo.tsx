import { MarkIcon, Wordmark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/** The D4DX logo for the admin's light surfaces: the mark in brand blue, the wordmark in ink. Size it by height (`h-5`). */
export function AdminLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <MarkIcon className="h-full w-auto text-brand" />
      <Wordmark className="h-full w-auto text-ink" title="D4DX" />
    </span>
  );
}
