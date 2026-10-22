import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** A link back to the parent listing, shown above the title. */
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, back, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm text-soft hover:text-ink md:min-h-0">
            <ChevronLeft className="size-4" aria-hidden="true" />
            {back.label}
          </Link>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-[60ch] text-sm text-soft sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
