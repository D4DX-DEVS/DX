import { ChevronLeft } from "@/components/icons";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** A link back to the parent listing, shown above the title. */
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  back,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link
            href={back.href}
            className="mb-1 -ml-1 inline-flex min-h-11 items-center gap-0.5 rounded-md pr-2 text-sm font-medium text-soft transition-colors hover:text-brand-ink focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:min-h-8"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            {back.label}
          </Link>
        ) : null}
        <h1 className="text-2xl leading-[1.15] font-semibold tracking-[-0.025em] sm:text-[2rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-[64ch] text-sm text-soft sm:text-[0.9375rem]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
