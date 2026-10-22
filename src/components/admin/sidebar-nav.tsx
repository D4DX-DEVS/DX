"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, activeHref } from "./nav";

interface SidebarNavProps {
  isOwner: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ isOwner, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const active = activeHref(pathname);
  return (
    <nav aria-label="Admin" className="flex flex-col gap-6">
      {ADMIN_NAV.map((group) => {
        const items = group.items.filter((i) => isOwner || !i.ownerOnly);
        if (items.length === 0) return null;
        return (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-[0.6875rem] font-semibold tracking-[0.12em] text-soft uppercase">{group.label}</p>
            {items.map((item) => {
              const current = item.href === active;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-soft transition-colors md:min-h-9",
                    "hover:bg-accent hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    current && "bg-[color-mix(in_oklab,var(--brand)_18%,transparent)] text-ink",
                  )}
                >
                  <item.icon className={cn("size-4", current ? "text-brand-ink" : "text-soft")} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
