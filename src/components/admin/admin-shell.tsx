"use client";

import { ExternalLink, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { logout } from "@/lib/auth/actions";
import type { AdminIdentity } from "@/lib/auth/dal";
import { SidebarNav } from "./sidebar-nav";

interface AdminShellProps {
  admin: AdminIdentity;
  children: React.ReactNode;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function UserMenu({ admin }: { admin: AdminIdentity }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-11 gap-2 rounded-full px-2 md:h-9" aria-label={`Account menu for ${admin.name}`}>
          <Avatar className="size-8">
            <AvatarFallback className="bg-[color-mix(in_oklab,var(--brand)_30%,transparent)] text-xs text-ink">{initials(admin.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[14ch] truncate text-sm sm:inline">{admin.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm text-ink">{admin.name}</span>
          <span className="truncate text-xs font-normal text-soft">{admin.email}</span>
          <span className="text-xs font-normal text-soft capitalize">{admin.role}</span>
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

/** Sidebar on desktop, a sheet on phones; the top bar carries the account menu. */
export function AdminShell({ admin, children }: AdminShellProps) {
  const [open, setOpen] = useState(false);
  const isOwner = admin.role === "owner";
  return (
    <div className="min-h-dvh bg-ground lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 overflow-y-auto border-r border-border bg-raised px-4 py-6 lg:flex">
        <Link href="/admin" className="flex items-center gap-2 px-3" aria-label="D4DX admin, dashboard">
          <Logo className="h-6 w-auto" />
          <span className="rounded-full bg-raised-2 px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide text-soft uppercase">Admin</span>
        </Link>
        <SidebarNav isOwner={isOwner} />
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-ground/85 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 overflow-y-auto bg-raised p-4">
                <SheetHeader className="px-3">
                  <SheetTitle className="flex items-center gap-2">
                    <Logo className="h-6 w-auto" />
                    <span className="sr-only">D4DX admin</span>
                  </SheetTitle>
                  <SheetDescription className="sr-only">Admin sections</SheetDescription>
                </SheetHeader>
                <SidebarNav isOwner={isOwner} onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <Link href="/admin" className="flex items-center gap-2 lg:hidden" aria-label="Dashboard">
              <Logo className="h-5 w-auto" />
            </Link>
          </div>
          <UserMenu admin={admin} />
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
