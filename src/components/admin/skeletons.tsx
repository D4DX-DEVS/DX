import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

/** Shaped like the listing table: a header row, then rows with the same column count. */
export function TableSkeleton({ columns, rows = 10 }: TableSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className="overflow-hidden rounded-2xl border border-border bg-raised shadow-[var(--shadow-card)]"
    >
      <div
        className="grid gap-4 border-b border-border px-4 py-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div
          key={r}
          className="grid gap-4 border-b border-border px-4 py-4 last:border-b-0"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className={c === 0 ? "h-4 w-3/4" : "h-4 w-1/2"} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Same footprint as ListToolbar: search box, a filter or two, sort. */
export function ToolbarSkeleton({ filters = 1 }: { filters?: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 sm:flex-row">
      <Skeleton className="h-11 w-full sm:w-72 md:h-9" />
      {Array.from({ length: filters }, (_, i) => (
        <Skeleton key={i} className="h-11 w-full sm:w-44 md:h-9" />
      ))}
      <Skeleton className="h-11 w-full sm:w-52 md:h-9" />
    </div>
  );
}

/** Label-and-control pairs, like the edit forms. */
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className="space-y-6 rounded-2xl border border-border bg-raised shadow-[var(--shadow-card)] p-4 sm:p-6"
    >
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({
  count = 4,
  className = "lg:grid-cols-4",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className={`grid grid-cols-2 gap-3 sm:gap-4 ${className}`}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="space-y-3 rounded-2xl border border-border bg-raised shadow-[var(--shadow-card)] p-4 sm:p-6"
        >
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-12" />
        </div>
      ))}
    </div>
  );
}
