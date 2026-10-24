import Link from "next/link";
import type { StatusCounts } from "@/lib/data/admin/inbox";
import type { SearchParamsRecord } from "@/lib/listing";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "all", label: "All", status: null },
  { key: "new", label: "New", status: "new" },
  { key: "read", label: "Read", status: "read" },
  { key: "archived", label: "Archived", status: "archived" },
] as const;

interface StatusTabsProps {
  counts: StatusCounts;
  /** The page's search params; every other filter is kept when a tab is chosen. */
  params: SearchParamsRecord;
  basePath: string;
}

/** The inbox status filter as tabs with counts. The choice lives in `?status=`, like the other filters. */
export function StatusTabs({ counts, params, basePath }: StatusTabsProps) {
  const current =
    typeof params.status === "string" &&
    ["new", "read", "archived"].includes(params.status)
      ? params.status
      : null;

  function hrefFor(status: string | null): string {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "status" || key === "page" || typeof value !== "string")
        continue;
      next.set(key, value);
    }
    if (status) next.set("status", status);
    const query = next.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  return (
    <nav
      aria-label="Filter by status"
      className="inline-flex gap-0.5 rounded-xl bg-[var(--chip)] p-1"
    >
      {TABS.map((tab) => {
        const on = tab.status === current;
        return (
          <Link
            key={tab.key}
            href={hrefFor(tab.status)}
            aria-current={on ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-[0.5625rem] px-3.5 text-sm font-medium text-ink/80 transition-colors hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:min-h-[2.125rem]",
              on &&
                "bg-raised font-semibold text-ink shadow-[0_1px_2px_rgb(11_20_48/0.1)]",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "num text-xs font-semibold",
                on ? "text-brand-ink" : "text-soft",
              )}
            >
              {counts[tab.key]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
