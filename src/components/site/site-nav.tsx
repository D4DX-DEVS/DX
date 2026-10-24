"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { Headset, House, Lightbulb, FolderOpen, Newspaper, UserPlus, UsersThree, type LucideIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface MainNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Short label for the phone tab bar. */
  short: string;
  /** The one that asks for the project: drawn as a button on the top bar. */
  action?: boolean;
  /** The little motion its icon makes on hover (see .nav-icon in globals.css). */
  motion: "hop" | "wiggle" | "glow" | "lift" | "tilt" | "pop" | "ring";
}

const MAIN_NAV: MainNavItem[] = [
  { href: "/", label: "Home", short: "Home", icon: House, motion: "hop" },
  { href: "/about", label: "About Us", short: "About", icon: UsersThree, motion: "wiggle" },
  { href: "/services", label: "Solutions", short: "Solutions", icon: Lightbulb, motion: "glow" },
  { href: "/work", label: "Projects", short: "Projects", icon: FolderOpen, motion: "lift" },
  { href: "/blog", label: "Blog", short: "Blog", icon: Newspaper, motion: "tilt" },
  { href: "/careers", label: "Join Our Team", short: "Join", icon: UserPlus, motion: "pop" },
  { href: "/contact", label: "Reach Us", short: "Reach", icon: Headset, action: true, motion: "ring" },
];

function useActive(): (href: string) => boolean {
  const pathname = usePathname();
  return (href) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
}

interface Slot {
  left: number;
  width: number;
}

/**
 * The top bar's links, icon and word each, from a laptop width up. Two soft pills glide between items:
 * a brighter one that rests on the current page, and a fainter one that follows the pointer. Each icon has
 * its own little motion on hover (see .nav-icon in globals.css), and the links drop in one after another.
 */
export function HeaderNav() {
  const isActive = useActive();
  const pathname = usePathname();
  const list = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState<Slot | null>(null);
  const [hover, setHover] = useState<Slot | null>(null);

  const slotOf = (li: HTMLElement | null): Slot | null => (li ? { left: li.offsetLeft, width: li.offsetWidth } : null);
  const items = () => Array.from(list.current?.querySelectorAll<HTMLElement>("li[data-nav]") ?? []);

  // Rest the current-page pill on its link, and keep it there as the window or the font settles.
  useLayoutEffect(() => {
    const place = () => {
      const current = items().find((li) => li.dataset.current === "true");
      setActive(slotOf(current ?? null));
    };
    place();
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [pathname]);

  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul ref={list} onPointerLeave={() => setHover(null)} className="relative flex items-center gap-1 text-[0.9375rem] font-medium">
        <span
          aria-hidden="true"
          className="nav-glide pointer-events-none absolute top-0 h-10 rounded-full bg-white/[0.12] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]"
          style={{ left: active?.left ?? 0, width: active?.width ?? 0, opacity: active ? 1 : 0 }}
        />
        <span
          aria-hidden="true"
          className="nav-glide pointer-events-none absolute top-0 h-10 rounded-full bg-white/[0.07]"
          style={{ left: hover?.left ?? 0, width: hover?.width ?? 0, opacity: hover ? 1 : 0 }}
        />
        {MAIN_NAV.map(({ href, label, icon: Icon, action, motion }, i) => {
          const current = isActive(href);
          return (
            <li
              key={href}
              data-nav
              data-current={current && !action}
              onPointerEnter={(e) => setHover(action ? null : slotOf(e.currentTarget))}
              className="nav-enter relative"
              style={{ "--i": i } as React.CSSProperties}
            >
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "nav-pill group relative inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 transition-[color,box-shadow,transform] duration-300 active:scale-95",
                  action
                    ? "ml-2 bg-brand text-on-brand hover:bg-[var(--brand-strong)] hover:shadow-[0_8px_26px_-8px_rgb(45_80_210/0.95)]"
                    : current
                      ? "text-ink"
                      : "text-ink/75 hover:text-ink",
                )}
              >
                <Icon
                  weight={current || action ? "fill" : "regular"}
                  aria-hidden="true"
                  data-motion={motion}
                  className={cn("nav-icon size-[1.125rem]", !action && (current ? "text-brand-ink" : "group-hover:text-brand-ink"))}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Below a laptop width the pages become an app's tab bar: icons only, pinned to the bottom. */
export function BottomNav() {
  const isActive = useActive();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#060a16]/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-around px-1">
        {MAIN_NAV.map(({ href, label, short, icon: Icon, action }) => {
          const active = isActive(href);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className="tab-item group relative flex h-[3.75rem] flex-col items-center justify-center gap-0.5 outline-none"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-0 h-0.5 rounded-full bg-brand-ink transition-all duration-300",
                    active ? "w-8 opacity-100 shadow-[0_0_12px_2px_rgb(120_150_255/0.8)]" : "w-0 opacity-0",
                  )}
                />
                <span
                  className={cn(
                    "grid h-8 w-11 place-items-center rounded-full transition-[background-color,transform,color] duration-300 group-active:scale-90 group-focus-visible:ring-2 group-focus-visible:ring-[var(--ring)]",
                    action && !active ? "bg-brand/90 text-on-brand" : "",
                    active ? "bg-brand/20 text-brand-ink" : !action && "text-ink/65",
                  )}
                >
                  <Icon weight={active || action ? "fill" : "regular"} aria-hidden="true" data-active={active} className="tab-icon size-[1.375rem]" />
                </span>
                <span aria-hidden="true" className={cn("text-[0.625rem] leading-none font-medium", active ? "text-brand-ink" : "text-ink/60")}>
                  {short}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
