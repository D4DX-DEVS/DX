import { Suspense } from "react";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <span id="top" />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-ground">
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Suspense fallback={<div className="h-[60svh]" />}>
        <Footer />
      </Suspense>
      <SmoothScroll />
    </>
  );
}
