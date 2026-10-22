import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";

/** A plain bar on the page ground: wordmark, five links, one action. Scrolls with the page. */
export function Header() {
  return (
    <header className="frame relative z-30 flex h-20 items-center justify-between gap-6">
      <Link href="/" className="-my-2 inline-flex min-h-11 items-center py-2" aria-label="D4DX Innovations, home">
        <Logo className="h-7 w-auto md:h-8" />
      </Link>
      <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
        <NavLinks className="flex items-center gap-7 text-[0.9375rem] font-medium" />
        <Link href="/contact" className="btn btn-ink min-h-10 px-5 text-[0.9375rem]">
          Start a project
        </Link>
      </nav>
      <MobileMenu />
    </header>
  );
}
