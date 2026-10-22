import { ArrowRight, BriefcaseBusiness, FilePen, FolderKanban, Inbox, Newspaper, Plus, UserRound, Users, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { CardsSkeleton, TableSkeleton } from "@/components/admin/skeletons";
import { StatusBadge, type StatusKind } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { getDashboard } from "@/lib/data/admin/dashboard";
import { dateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

interface StatProps {
  label: string;
  value: number;
  icon: LucideIcon;
  href: string;
  highlight?: boolean;
}

function Stat({ label, value, icon: Icon, href, highlight }: StatProps) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-raised p-4 transition-colors hover:border-[color-mix(in_oklab,var(--brand)_50%,var(--border))] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:p-6"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-soft sm:text-sm">{label}</span>
        <Icon className={`size-4 sm:size-5 ${highlight ? "text-brand-ink" : "text-soft"}`} aria-hidden="true" />
      </span>
      <span className="text-lg font-semibold num sm:text-2xl">{value}</span>
    </Link>
  );
}

interface RecentListProps {
  title: string;
  href: string;
  empty: string;
  items: { id: string; primary: string; secondary: string; status: string; at: string }[];
}

function RecentList({ title, href, empty, items }: RecentListProps) {
  return (
    <section className="flex flex-col rounded-2xl border border-border bg-raised">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <h2 className="text-base font-semibold">{title}</h2>
        <Link href={href} className="inline-flex min-h-11 items-center gap-1 text-sm text-brand-ink hover:underline md:min-h-0">
          View all
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-soft sm:px-6">{empty}</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`${href}/${item.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none sm:px-6">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{item.primary}</span>
                  <span className="block truncate text-xs text-soft">
                    {item.secondary} · {dateTime(item.at)}
                  </span>
                </span>
                <StatusBadge status={item.status as StatusKind} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

async function Overview() {
  const d = await getDashboard();
  const c = d.counts;
  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="New inquiries" value={c.newInquiries} icon={Inbox} href="/admin/inquiries?status=new" highlight={c.newInquiries > 0} />
        <Stat label="New applications" value={c.newApplications} icon={UserRound} href="/admin/applications?status=new" highlight={c.newApplications > 0} />
        <Stat label="Published projects" value={c.projects} icon={FolderKanban} href="/admin/projects?status=published" />
        <Stat label="Published posts" value={c.posts} icon={Newspaper} href="/admin/posts?status=published" />
        <Stat label="Drafts" value={c.drafts} icon={FilePen} href="/admin/projects?status=draft" />
        <Stat label="Team members" value={c.team} icon={Users} href="/admin/team" />
        <Stat label="Open jobs" value={c.openJobs} icon={BriefcaseBusiness} href="/admin/jobs" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentList
          title="Latest inquiries"
          href="/admin/inquiries"
          empty="No messages from the contact form yet."
          items={d.recentInquiries.map((i) => ({ id: i.id, primary: i.name, secondary: i.service || i.email, status: i.status, at: i.created_at }))}
        />
        <RecentList
          title="Latest applications"
          href="/admin/applications"
          empty="No job applications yet."
          items={d.recentApplications.map((a) => ({ id: a.id, primary: a.name, secondary: a.position, status: a.status, at: a.created_at }))}
        />
      </div>
    </div>
  );
}

function OverviewFallback() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <CardsSkeleton count={7} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TableSkeleton columns={2} rows={5} />
        <TableSkeleton columns={2} rows={5} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Dashboard"
        description="What is new in the inbox and what is live on the site."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/posts/new">
                <Plus className="size-4" aria-hidden="true" />
                New post
              </Link>
            </Button>
            <Button asChild className="bg-brand text-on-brand hover:bg-[var(--brand-strong)]">
              <Link href="/admin/projects/new">
                <Plus className="size-4" aria-hidden="true" />
                New project
              </Link>
            </Button>
          </>
        }
      />
      <Suspense fallback={<OverviewFallback />}>
        <Overview />
      </Suspense>
    </div>
  );
}
