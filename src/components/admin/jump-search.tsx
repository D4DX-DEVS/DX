"use client";

import { Search } from "@/components/icons";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "./nav";

/** The top bar's search: type a section ("posts", "team", "settings") and jump straight to it. Press / to focus it. */
export function JumpSearch({ isOwner }: { isOwner: boolean }) {
  const router = useRouter();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);

  const all = useMemo(
    () =>
      ADMIN_NAV.flatMap((g) =>
        g.items
          .filter((i) => isOwner || !i.ownerOnly)
          .map((i) => ({ ...i, group: g.label || "Overview" })),
      ),
    [isOwner],
  );
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return all
      .filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          i.group.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [all, query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        input.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setQuery("");
    setOpen(false);
    input.current?.blur();
    router.push(href);
  }

  return (
    <div className="relative w-full max-w-md">
      <label htmlFor={id} className="sr-only">
        Search the admin
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-[1.125rem] -translate-y-1/2 text-soft"
        aria-hidden="true"
      />
      <input
        ref={input}
        id={id}
        type="search"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={`${id}-list`}
        autoComplete="off"
        placeholder="Search anything…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setAt(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setAt((v) => Math.min(results.length - 1, v + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setAt((v) => Math.max(0, v - 1));
          } else if (e.key === "Enter" && results[at]) {
            e.preventDefault();
            go(results[at].href);
          } else if (e.key === "Escape") {
            setQuery("");
            input.current?.blur();
          }
        }}
        className="h-10 w-full rounded-xl border border-transparent bg-[var(--ground)] pr-10 pl-11 text-sm text-ink transition-[border-color,box-shadow,background-color] outline-none placeholder:text-soft focus:border-[var(--brand-line)] focus:bg-white focus:shadow-[0_0_0_3px_rgb(45_80_210/0.12)] [&::-webkit-search-cancel-button]:hidden"
      />
      <kbd
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 hidden size-5 -translate-y-1/2 place-items-center rounded-md border border-border bg-white text-[0.6875rem] font-medium text-soft sm:grid"
      >
        /
      </kbd>
      {open && results.length > 0 ? (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute top-full left-0 z-40 mt-2 w-full overflow-hidden rounded-xl border border-border bg-white p-1.5 shadow-[0_16px_40px_rgb(11_20_48/0.14)]"
        >
          {results.map((r, i) => (
            <li key={r.href} role="option" aria-selected={i === at}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(r.href)}
                onMouseEnter={() => setAt(i)}
                className={cn(
                  "flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm",
                  i === at
                    ? "bg-[var(--brand-tint)] text-brand-ink"
                    : "text-ink",
                )}
              >
                <r.icon
                  className="size-[1.125rem] shrink-0"
                  aria-hidden="true"
                />
                <span className="font-medium">{r.label}</span>
                <span className="ml-auto text-xs text-soft">{r.group}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
