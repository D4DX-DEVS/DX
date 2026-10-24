"use client";

import { ChevronLeft, ChevronRight } from "@/components/icons";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZES } from "@/lib/listing";

interface DataPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  noun: string;
}

/** Previous / next, where you are, how many results, and rows per page. Reads and writes the URL. */
export function DataPagination({
  page,
  pageSize,
  total,
  totalPages,
  noun,
}: DataPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function go(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    startTransition(() =>
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false }),
    );
  }

  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      aria-busy={pending}
    >
      <p className="text-sm text-soft num">
        {total} {total === 1 ? noun.replace(/s$/, "") : noun}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span id="rows-label" className="text-sm text-soft">
            Rows
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) =>
              go({ pageSize: v === "20" ? null : v, page: null })
            }
          >
            <SelectTrigger
              aria-labelledby="rows-label"
              className="h-11 w-20 md:h-9"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-soft num">
          Page {Math.min(page, totalPages)} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1 || pending}
            onClick={() =>
              go({ page: page - 1 <= 1 ? null : String(page - 1) })
            }
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages || pending}
            onClick={() => go({ page: String(page + 1) })}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
