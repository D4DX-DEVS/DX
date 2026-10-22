import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";

export default function NotFound() {
  return (
    <PageHero eyebrow="404" title="This page isn't here" lead="It may have moved, or the link may be wrong. Try the work, or start from the home page.">
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link href="/" className="btn btn-brand">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Home
        </Link>
        <Link href="/work" className="link inline-flex min-h-11 items-center font-medium">
          See the work
        </Link>
      </div>
    </PageHero>
  );
}
