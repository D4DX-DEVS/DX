"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NAV } from "./nav";

const ITEMS = [...NAV, { href: "/contact", label: "Contact" }] as const;

/** Full-screen menu for phones: the pages as large touch rows, the one action at the foot. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex min-h-11 items-center gap-2 rounded-full bg-raised-2 px-4 text-[0.9375rem] font-medium transition-colors hover:bg-accent md:hidden">
        <Menu className="size-4" aria-hidden="true" />
        Menu
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 border-none bg-ground p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-none"
      >
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Pages of the D4DX site</SheetDescription>
        <div className="frame flex h-20 shrink-0 items-center justify-between">
          <Link href="/" onClick={close} aria-label="D4DX Innovations, home" className="inline-flex min-h-11 items-center">
            <Logo className="h-7 w-auto" />
          </Link>
          <SheetClose className="inline-flex size-11 items-center justify-center rounded-full bg-raised-2 transition-colors hover:bg-accent" aria-label="Close menu">
            <X className="size-5" aria-hidden="true" />
          </SheetClose>
        </div>
        <nav aria-label="Main" className="frame flex min-h-0 flex-1 flex-col overflow-y-auto pt-4 pb-8">
          <ul className="flex flex-col gap-1">
            {ITEMS.map((item, i) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href} className="menu-item" style={{ "--i": i } as React.CSSProperties}>
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className="group -mx-3 flex min-h-14 items-center justify-between rounded-xl px-3 text-[1.375rem] font-medium tracking-[-0.015em] transition-colors hover:bg-raised active:bg-raised"
                  >
                    <span className={cn(active && "text-brand-ink")}>{item.label}</span>
                    <ArrowUpRight
                      className="size-5 text-soft transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="menu-item mt-auto pt-10" style={{ "--i": ITEMS.length } as React.CSSProperties}>
            <Link href="/contact" onClick={close} className="btn btn-brand min-h-12 w-full">
              Start a project
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
