// No "use client": EmptyState renders on the server (its icon prop is a component, which cannot
// cross into a client component). ErrorState is only rendered by the client error boundary.
import { CircleAlert, RotateCw, SearchX, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: { href: string; label: string };
}

/** What is empty, and the one thing to do about it. */
export function EmptyState({ title, description, icon: Icon = SearchX, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-raised-2 text-soft">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="mt-1 max-w-[44ch] text-sm text-soft">{description}</p>
      {action ? (
        <Button asChild variant="outline" className="mt-6">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({ message = "The data could not be loaded.", onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-2xl border border-destructive/40 bg-destructive/5 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <CircleAlert className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-base font-semibold">Something went wrong</h2>
      <p className="mt-1 max-w-[44ch] text-sm text-soft">{message}</p>
      <Button variant="outline" className="mt-6" onClick={onRetry}>
        <RotateCw className="size-4" aria-hidden="true" />
        Retry
      </Button>
    </div>
  );
}
