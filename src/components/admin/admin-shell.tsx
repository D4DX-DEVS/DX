"use client";

import {
  Bell,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Globe,
  LogOut,
  Menu,
} from "@/components/icons";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Logo, MarkIcon } from "@/components/brand/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { logout } from "@/lib/auth/actions";
import type { AdminIdentity } from "@/lib/auth/dal";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "./breadcrumb";
import { JumpSearch } from "./jump-search";
import { SidebarNav } from "./sidebar-nav";

interface AdminShellProps {
  admin: AdminIdentity;
  /** Unread counts keyed by nav href. */
  badges: Record<string, number>;
  children: React.ReactNode;
}

const FOLDED_KEY = "d4dx-admin-sidebar-folded";
const FOLDED_EVENT = "d4dx-admin-sidebar";

/** The folded sidebar is remembered between visits in this browser (a convenience; it works without storage). */
function subscribeFolded(notify: () => void): () => void {
  window.addEventListener(FOLDED_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(FOLDED_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}
function readFolded(): boolean {
  try {
    return window.localStorage.getItem(FOLDED_KEY) === "1";
  } catch {
    return false;
  }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** The wordmark lockup on the dark sidebar. */
function Brand({ folded }: { folded?: boolean }) {
  return (
    <Link
      href="/admin"
      className={cn(
        "flex h-10 items-center gap-2.5 rounded-lg px-2",
        folded && "justify-center px-0",
      )}
      aria-label="D4DX admin, dashboard"
    >
      {folded ? (
        <MarkIcon className="h-7 w-auto text-[#5b86ff]" />
      ) : (
        <>
          <Logo className="h-8 w-auto" sizes="140px" />
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.625rem] font-semibold tracking-[0.12em] text-[#9db6ff] uppercase ring-1 ring-white/15">
            Admin
          </span>
        </>
      )}
    </Link>
  );
}

/** A card on the sidebar's foot that opens the public site in a new tab. */
function ViewSite({ folded }: { folded?: boolean }) {
  return (
    <a
      href="/"
      target="_blank"
      rel="noreferrer"
      title={folded ? "View live site" : undefined}
      className={cn(
        "group flex min-h-12 items-center gap-3 rounded-xl border border-white/12 bg-white/[0.06] px-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/[0.12] focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none",
        folded && "justify-center px-0",
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#2f5bea]/35 text-[#a9c0ff] ring-1 ring-[#5b86ff]/40">
        <Globe weight="bold" className="size-[1.125rem]" aria-hidden="true" />
      </span>
      <span className={cn(folded && "sr-only")}>View live site</span>
      <ExternalLink
        className={cn(
          "ml-auto size-4 text-white/50 transition-colors group-hover:text-white",
          folded && "hidden",
        )}
        aria-hidden="true"
      />
    </a>
  );
}

function UserMenu({ admin }: { admin: AdminIdentity }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-11 items-center gap-2.5 rounded-full pr-2.5 pl-1.5 text-sm font-semibold text-ink transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-expanded:bg-accent md:h-11"
          aria-label={`Account menu for ${admin.name}`}
        >
          <Avatar className="size-9">
            <AvatarFallback className="bg-[var(--brand-tint)] text-xs font-semibold text-brand-ink">
              {initials(admin.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[14ch] truncate sm:inline">
            {admin.name}
          </span>
          <ChevronDown
            className="hidden size-4 text-soft sm:block"
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm text-ink">{admin.name}</span>
          <span className="truncate text-xs font-normal text-soft">
            {admin.email}
          </span>
          <span className="text-xs font-normal text-soft capitalize">
            {admin.role}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/account">Your account</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/" target="_blank" rel="noreferrer">
            View site
            <ExternalLink className="ml-auto size-4" aria-hidden="true" />
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logout}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * A dark sidebar that folds to icons on desktop and a sheet on phones; a light top bar with search, the inbox bell and
 * the account menu; the page itself on a pale ground in white cards.
 */
export function AdminShell({ admin, badges, children }: AdminShellProps) {
  const [open, setOpen] = useState(false);
  const folded = useSyncExternalStore(subscribeFolded, readFolded, () => false);
  const isOwner = admin.role === "owner";
  const unread = Object.values(badges).reduce((a, b) => a + b, 0);
  const bellHref =
    (badges["/admin/inquiries"] ?? 0) > 0 ||
    (badges["/admin/applications"] ?? 0) === 0
      ? "/admin/inquiries?status=new"
      : "/admin/applications?status=new";

  function toggleFold() {
    try {
      window.localStorage.setItem(FOLDED_KEY, folded ? "0" : "1");
    } catch {
      // storage can be blocked: the sidebar then simply does not remember
    }
    window.dispatchEvent(new Event(FOLDED_EVENT));
  }

  return (
    <div
      className={cn(
        "min-h-dvh bg-ground transition-[grid-template-columns] duration-300 lg:grid",
        folded
          ? "lg:grid-cols-[4.75rem_minmax(0,1fr)]"
          : "lg:grid-cols-[17rem_minmax(0,1fr)]",
      )}
    >
      <aside
        className={cn(
          "admin-side sticky top-0 hidden h-dvh flex-col gap-6 overflow-x-hidden overflow-y-auto pt-5 pb-4 lg:flex",
          folded ? "px-3" : "px-4",
        )}
      >
        <Brand folded={folded} />
        <SidebarNav isOwner={isOwner} badges={badges} collapsed={folded} />
        <div className="mt-auto flex flex-col gap-3">
          <ViewSite folded={folded} />
          <button
            type="button"
            onClick={toggleFold}
            aria-label={folded ? "Expand the sidebar" : "Collapse the sidebar"}
            aria-pressed={folded}
            className={cn(
              "grid size-9 place-items-center rounded-lg text-white/55 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none",
              folded ? "mx-auto" : "ml-auto",
            )}
          >
            {folded ? (
              <ChevronsRight className="size-[1.125rem]" aria-hidden="true" />
            ) : (
              <ChevronsLeft className="size-[1.125rem]" aria-hidden="true" />
            )}
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-[4.25rem] items-center gap-3 border-b border-border bg-raised/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="-ml-2 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-6" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="admin-side w-72 overflow-y-auto border-0 p-4 text-white"
            >
              <SheetHeader className="px-1">
                <SheetTitle className="flex items-center gap-2 text-white">
                  <Brand />
                  <span className="sr-only">D4DX admin</span>
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Admin sections
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 flex flex-col gap-6">
                <SidebarNav
                  isOwner={isOwner}
                  badges={badges}
                  onNavigate={() => setOpen(false)}
                />
                <ViewSite />
              </div>
            </SheetContent>
          </Sheet>
          <JumpSearch isOwner={isOwner} />
          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href={bellHref}
              aria-label={unread > 0 ? `${unread} new in the inbox` : "Inbox"}
              className="relative grid size-11 place-items-center rounded-full text-ink/80 transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Bell className="size-[1.375rem]" aria-hidden="true" />
              {unread > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute top-2.5 right-3 size-2.5 rounded-full bg-[#ef4444] ring-2 ring-white"
                />
              ) : null}
            </Link>
            <UserMenu admin={admin} />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Breadcrumb />
          {children}
        </main>
      </div>
    </div>
  );
}
