import {
  ArrowLeft,
  BriefcaseBusiness,
  FolderKanban,
  Inbox,
  ShieldCheck,
} from "@/components/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminLogo } from "@/components/admin/admin-logo";
import { Logo } from "@/components/brand/logo";
import { NeuralField } from "@/components/site/neural-field";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdmin } from "@/lib/auth/dal";
import { safeNextPath } from "@/lib/auth/token";
import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = { title: "Sign in" };

/** Signed-in admins (checked against the database, not just the cookie) skip the form. */
async function LoginGate({
  searchParams,
}: {
  searchParams: PageProps<"/admin/login">["searchParams"];
}) {
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
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

const POINTS = [
  {
    icon: FolderKanban,
    title: "Projects and posts",
    text: "Publish work and write for the blog, with every store link and screenshot.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Team and careers",
    text: "Reorder the team, open positions and read every application.",
  },
  {
    icon: Inbox,
    title: "One inbox",
    text: "Contact messages and job applications, in one place and in order.",
  },
];

/** The brand side of the sign-in: the site's own dark, networked look, and what the admin is for. Hidden on phones. */
function Showcase() {
  return (
    <aside className="admin-side relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <NeuralField className="absolute inset-0 size-full opacity-70" />
      <div
        aria-hidden="true"
        className="tech-grid absolute inset-0 opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-32 size-[34rem] rounded-full bg-[#2f6bff]/30 blur-[110px]"
      />
      <div className="relative">
        <Logo className="h-10 w-auto" sizes="180px" />
      </div>
      <div className="relative max-w-lg">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-[0.14em] text-[#a9c0ff] uppercase ring-1 ring-white/15">
          <ShieldCheck weight="fill" className="size-4" aria-hidden="true" />
          Admin
        </p>
        <h2 className="mt-6 text-[clamp(2rem,3.2vw,3rem)] leading-[1.06] font-semibold tracking-[-0.03em] text-white">
          Run the whole site{" "}
          <span className="text-[#7fa2ff]">from one place.</span>
        </h2>
        <ul className="mt-10 flex flex-col gap-6">
          {POINTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-[#a9c0ff] ring-1 ring-white/15">
                <Icon weight="duotone" className="size-6" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-white">{title}</p>
                <p className="mt-0.5 text-[0.9375rem] leading-relaxed text-white/65">
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="relative text-sm text-white/45">
        D4DX Innovations LLP, Mavoor Road, Calicut
      </p>
    </aside>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="grid min-h-dvh bg-raised lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <Showcase />
      <section className="relative flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(#dfe5f3_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(70%_60%_at_50%_40%,#000,transparent)]"
        />
        <div className="relative mx-auto w-full max-w-[26rem]">
          <AdminLogo className="h-8 lg:hidden" />
          <h1 className="mt-10 text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.03em] sm:text-[2rem] lg:mt-0">
            Welcome back
          </h1>
          <p className="mt-2 text-[0.9375rem] text-soft">
            Sign in to manage projects, posts, the team and the inbox.
          </p>
          <div className="mt-8">
            <Suspense fallback={<FormFallback />}>
              <LoginGate searchParams={searchParams} />
            </Suspense>
          </div>
          <p className="mt-6 flex">
            <Link
              href="/"
              className="link inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-soft hover:text-brand-ink"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to d4dx.co
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
