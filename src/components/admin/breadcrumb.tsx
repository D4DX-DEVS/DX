"use client";

import { ChevronRight } from "@/components/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV, activeHref } from "./nav";

const SUB_PAGE: Record<string, string> = { new: "New", order: "Order" };

interface Crumb {
  label: string;
  href?: string;
}

/** Where you are: the sidebar group, the section, and "New", "Order" or "Edit" below a section. */
export function Breadcrumb() {
  const pathname = usePathname();
  const href = activeHref(pathname);
  const crumbs: Crumb[] = [];
  if (href) {
    const group = ADMIN_NAV.find((g) => g.items.some((i) => i.href === href));
    const item = group?.items.find((i) => i.href === href);
    const rest = pathname.slice(href.length).split("/").filter(Boolean);
    if (group && item) {
      if (group.label) crumbs.push({ label: group.label });
      crumbs.push({
        label: item.label,
        href: rest.length ? item.href : undefined,
      });
      if (rest.length) crumbs.push({ label: SUB_PAGE[rest[0]] ?? "Edit" });
    }
  } else if (pathname.startsWith("/admin/account")) {
    crumbs.push({ label: "Your account" });
  }
  if (pathname === "/admin" || crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 hidden min-w-0 sm:block">
      <ol className="flex items-center gap-1.5 text-sm text-soft">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li
              key={`${crumb.label}-${i}`}
              className="flex min-w-0 items-center gap-1.5"
            >
              {i > 0 ? (
                <ChevronRight
                  className="size-3.5 shrink-0"
                  aria-hidden="true"
                />
              ) : null}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="truncate rounded hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={
                    last ? "truncate font-semibold text-ink" : "truncate"
                  }
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
