import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { HeaderNav } from "./site-nav";
import { StickyHeader } from "./sticky-header";

/** The wordmark and, from a laptop width up, the pages with their icons. Sticky; phones get the bottom tab bar instead. */
export function Header() {
  return (
    <StickyHeader>
      <Link
        href="/"
        className="-my-2 inline-flex min-h-11 items-center py-2 transition-transform duration-300 ease-[var(--ease-out)] hover:scale-[1.04] active:scale-95"
        aria-label="D4DX Innovations, home"
      >
        <Logo className="h-9 w-auto md:h-10" />
      </Link>
      <HeaderNav />
    </StickyHeader>
  );
}
