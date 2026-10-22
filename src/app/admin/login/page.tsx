import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdmin } from "@/lib/auth/dal";
import { safeNextPath } from "@/lib/auth/token";
import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = { title: "Sign in" };

/** Signed-in admins (checked against the database, not just the cookie) skip the form. */
async function LoginGate({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : null;
  if (await getAdmin()) redirect(safeNextPath(next));
  return <LoginForm next={next} />;
}

function FormFallback() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-5">
      {[0, 1].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-ground px-4 py-10">
      {/* A soft wash of the brand blue behind the card. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--brand)_28%,transparent),transparent_70%)]"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="h-8 w-auto" />
          <h1 className="mt-6 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">Sign in to the admin</h1>
          <p className="mt-2 text-sm text-soft">Manage projects, posts, the team and the inbox.</p>
        </div>
        <div className="rounded-3xl border border-border bg-raised/90 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
          <Suspense fallback={<FormFallback />}>
            <LoginGate searchParams={searchParams} />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-soft">
          <Link href="/" className="link">
            Back to d4dx.co
          </Link>
        </p>
      </div>
    </main>
  );
}
