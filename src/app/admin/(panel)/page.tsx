import { CalendarDays, Plus } from "@/components/icons";
import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { CardsSkeleton, TableSkeleton } from "@/components/admin/skeletons";
import { Button } from "@/components/ui/button";
import { getDashboard } from "@/lib/data/admin/dashboard";
import { Overview } from "./_components/overview";

export const metadata: Metadata = { title: "Dashboard" };

async function LiveOverview() {
  return <Overview data={await getDashboard()} />;
}

function OverviewFallback() {
  return (
    <div className="space-y-5 lg:space-y-6">
      <CardsSkeleton count={5} className="lg:grid-cols-5" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <TableSkeleton columns={3} rows={4} />
        </div>
        <div className="lg:col-span-5">
          <TableSkeleton columns={2} rows={4} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TableSkeleton columns={2} rows={3} />
        <TableSkeleton columns={2} rows={3} />
      </div>
    </div>
  );
}

/** Today's date as a pill beside the actions. Read at request time, so it is never a stale prerendered day. */
async function Today() {
  await connection();
  const label = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const [weekday, ...rest] = label.replace(",", "").split(" ");
  return (
    <div className="hidden items-center gap-3 rounded-xl border border-border bg-raised px-4 py-2 shadow-[var(--shadow-card)] md:flex">
      <CalendarDays
        weight="duotone"
        className="size-5 text-brand"
        aria-hidden="true"
      />
      <p className="text-[0.8125rem] leading-tight text-soft">
        {weekday}
        <span className="block font-semibold text-ink">{rest.join(" ")}</span>
      </p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here’s what’s happening on your site."
        actions={
          <>
            <Suspense fallback={null}>
              <Today />
            </Suspense>
            <Button asChild variant="outline">
              <Link href="/admin/posts/new">
                <Plus className="size-4" aria-hidden="true" />
                New post
              </Link>
            </Button>
            <Button
              asChild
              className="bg-brand text-on-brand shadow-[0_1px_2px_rgb(45_80_210/0.3)] hover:bg-[var(--brand-strong)]"
            >
              <Link href="/admin/projects/new">
                <Plus className="size-4" aria-hidden="true" />
                New project
              </Link>
            </Button>
          </>
        }
      />
      <Suspense fallback={<OverviewFallback />}>
        <LiveOverview />
      </Suspense>
    </div>
  );
}
