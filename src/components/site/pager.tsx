import { ArrowLeft, ArrowRight } from "@/components/icons";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PagerProps {
  page: number;
  totalPages: number;
  total: number;
  /** Builds the URL for a page, keeping the listing's other query values. */
  href: (page: number) => string;
  noun: string;
}

/** Previous / next for the public listings, with where you are and how many there are. */
export function Pager({ page, totalPages, total, href, noun }: PagerProps) {
  if (totalPages <= 1) return null;
  const linkClass = "btn btn-outline min-h-11";
  const off = "pointer-events-none opacity-40";
  return (
    <nav aria-label="Pages" className="mt-12 flex flex-wrap items-center justify-between gap-4">
      <Link href={href(page - 1)} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} className={cn(linkClass, page <= 1 && off)}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Previous
      </Link>
      <p className="text-sm text-soft num">
        Page {page} of {totalPages} · {total} {noun}
      </p>
      <Link
        href={href(page + 1)}
        aria-disabled={page >= totalPages}
        tabIndex={page >= totalPages ? -1 : undefined}
        className={cn(linkClass, page >= totalPages && off)}
      >
        Next
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </nav>
  );
}
