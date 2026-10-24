"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, activeHref } from "./nav";

interface SidebarNavProps {
  isOwner: boolean;
  /** Unread counts keyed by nav href, shown as a small red pill. */
  badges?: Record<string, number>;
  /** Icons only (the desktop sidebar folded away). */
  collapsed?: boolean;
  onNavigate?: () => void;
}

/** The admin's menu on the dark sidebar: the current section is a lit blue pill, unread counts are red pills. */
export function SidebarNav({
  isOwner,
  badges = {},
  collapsed = false,
  onNavigate,
}: SidebarNavProps) {
  const pathname = usePathname();
  const active = activeHref(pathname);
  return (
    <nav aria-label="Admin" className="flex flex-col gap-6">
      {ADMIN_NAV.map((group, g) => {
        const items = group.items.filter((i) => isOwner || !i.ownerOnly);
        if (items.length === 0) return null;
        return (
          <div key={group.label || g} className="flex flex-col gap-1">
            {group.label ? (
              <p
                className={cn(
                  "px-3 pb-1.5 text-[0.6875rem] font-semibold tracking-[0.14em] text-white/40 uppercase",
                  collapsed && "sr-only",
                )}
              >
                {group.label}
              </p>
            ) : null}
            {items.map((item) => {
              const current = item.href === active;
              const count = badges[item.href] ?? 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "admin-nav-link group relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-[0.9375rem] font-medium transition-[background-color,color,box-shadow] duration-200 md:min-h-10",
                    "focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none",
                    collapsed && "justify-center px-0",
                    current
                      ? "admin-nav-active text-white"
                      : "text-white/70 hover:bg-white/[0.07] hover:text-white",
                  )}
                >
                  <item.icon
                    weight={current ? "fill" : "regular"}
                    className={cn(
                      "size-5 shrink-0",
                      current
                        ? "text-white"
                        : "text-white/60 group-hover:text-white",
                    )}
                    aria-hidden="true"
                  />
                  <span className={cn(collapsed && "sr-only")}>
                    {item.label}
                  </span>
                  {count > 0 ? (
                    <span
                      className={cn(
                        "num grid h-5 min-w-5 place-items-center rounded-full bg-[#ef4444] px-1.5 text-xs font-semibold text-white",
                        collapsed
                          ? "absolute top-1 right-1.5 h-4 min-w-4 px-1 text-[0.625rem]"
                          : "ml-auto",
                      )}
                    >
                      <span aria-hidden="true">
                        {count > 99 ? "99+" : count}
                      </span>
                      <span className="sr-only">{count} new</span>
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
