"use client";

import { ArrowDownWideNarrow, ArrowUpNarrowWide, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FilterConfig {
  /** URL query key. */
  name: string;
  label: string;
  options: { value: string; label: string }[];
}

interface ListToolbarProps {
  searchPlaceholder: string;
  sorts: { value: string; label: string }[];
  defaultSort: string;
  defaultOrder: "asc" | "desc";
  filters?: FilterConfig[];
}

const ALL = "__all";

/** Search (debounced), filters and sort. Everything lives in the URL; any change goes back to page 1. */
export function ListToolbar({ searchPlaceholder, sorts, defaultSort, defaultOrder, filters = [] }: ListToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const lastPushed = useRef(params.get("search") ?? "");

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    const query = next.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  useEffect(() => {
    if (search.trim() === lastPushed.current) return;
    const timer = setTimeout(() => {
      lastPushed.current = search.trim();
      update({ search: search.trim() });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the typed text should re-arm the debounce
  }, [search]);

  const sort = params.get("sort") ?? defaultSort;
  const order = params.get("order") === "asc" || params.get("order") === "desc" ? params.get("order")! : defaultOrder;
  const active = Boolean(params.get("search")) || filters.some((f) => params.get(f.name)) || sort !== defaultSort || order !== defaultOrder;

  function clear() {
    setSearch("");
    lastPushed.current = "";
    startTransition(() => router.replace(pathname, { scroll: false }));
  }

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center", pending && "opacity-80")}>
      <div className="relative sm:w-72">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-soft" aria-hidden="true" />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="h-11 pl-9 md:h-9"
        />
      </div>
      {filters.map((f) => (
        <Select key={f.name} value={params.get(f.name) ?? ALL} onValueChange={(v) => update({ [f.name]: v === ALL ? null : v })}>
          <SelectTrigger aria-label={f.label} className={cn("h-11 w-full sm:w-44 md:h-9", params.get(f.name) && "border-brand text-ink")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All {f.label.toLowerCase()}</SelectItem>
            {f.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      <div className="flex items-center gap-2">
        <Select value={sort} onValueChange={(v) => update({ sort: v === defaultSort ? null : v })}>
          <SelectTrigger aria-label="Sort by" className="h-11 w-full sm:w-44 md:h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sorts.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                Sort: {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => update({ order: order === "asc" ? (defaultOrder === "desc" ? null : "desc") : defaultOrder === "asc" ? null : "asc" })}
          aria-label={order === "asc" ? "Ascending, switch to descending" : "Descending, switch to ascending"}
        >
          {order === "asc" ? <ArrowUpNarrowWide className="size-4" aria-hidden="true" /> : <ArrowDownWideNarrow className="size-4" aria-hidden="true" />}
        </Button>
      </div>
      {active ? (
        <Button variant="ghost" onClick={clear} className="sm:ml-auto">
          <X className="size-4" aria-hidden="true" />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
