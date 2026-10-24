import {
  ArrowRight,
  FileText,
  FolderKanban,
  Inbox,
  Mail,
  Newspaper,
  Settings,
  UserRound,
  Users,
  type LucideIcon,
} from "@/components/icons";
import Link from "next/link";
import { ActivityChart } from "@/components/admin/activity-chart";
import { StatusBadge, type StatusKind } from "@/components/admin/status-badge";
import type { DashboardData } from "@/lib/data/admin/dashboard";
import { dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Each tile's colour: the soft ground of its icon and wave, and the strong colour of the icon itself. */
const TONES = {
  blue: { tint: "#e6eeff", strong: "#2f6bff" },
  violet: { tint: "#eee8ff", strong: "#7c4ddb" },
  green: { tint: "#dff6ea", strong: "#16a35a" },
  orange: { tint: "#ffeadb", strong: "#ee7a2c" },
  pink: { tint: "#ffe6ee", strong: "#e0457b" },
} as const;
type Tone = keyof typeof TONES;

/** A soft hill in the corner of a stat card: decoration only. */
function Wave({ tone, shape }: { tone: Tone; shape: number }) {
  const paths = [
    "M0 60 C 30 58, 45 30, 80 38 S 130 10, 160 22 L160 70 L0 70 Z",
    "M0 62 C 25 40, 55 52, 85 30 S 135 36, 160 14 L160 70 L0 70 Z",
    "M0 58 C 35 62, 50 34, 90 36 S 125 18, 160 28 L160 70 L0 70 Z",
  ];
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 70"
      preserveAspectRatio="none"
      className="pointer-events-none absolute right-0 bottom-0 h-16 w-3/5 opacity-90"
    >
      <path d={paths[shape % paths.length]} fill={TONES[tone].tint} />
    </svg>
  );
}

interface StatCardProps {
  label: string;
  caption: string;
  value: number;
  icon: LucideIcon;
  href: string;
  tone: Tone;
  shape: number;
}

/** One headline number: a tinted icon, an arrow that lights on hover, the count, and what it counts. */
function StatCard({
  label,
  caption,
  value,
  icon: Icon,
  href,
  tone,
  shape,
}: StatCardProps) {
  const t = TONES[tone];
  return (
    <Link
      href={href}
      className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-raised p-4 shadow-[var(--shadow-card)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-[var(--brand-line)] hover:shadow-[0_14px_34px_-14px_rgb(45_80_210/0.28)] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:p-5"
    >
      <Wave tone={tone} shape={shape} />
      <span className="relative flex items-start justify-between">
        <span
          className="grid size-11 place-items-center rounded-xl sm:size-12"
          style={{ background: t.tint, color: t.strong }}
        >
          <Icon weight="duotone" className="size-6" aria-hidden="true" />
        </span>
        <span className="grid size-8 place-items-center rounded-full border border-border bg-white text-brand transition-colors group-hover:border-brand group-hover:bg-brand group-hover:text-on-brand">
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </span>
      <span className="relative mt-5 text-[0.9375rem] font-semibold">
        {label}
      </span>
      <span className="num relative mt-1 text-[2rem] leading-none font-semibold tracking-[-0.03em] sm:text-[2.25rem]">
        {value}
      </span>
      <span className="relative mt-2 max-w-[18ch] text-[0.8125rem] leading-snug text-soft">
        {caption}
      </span>
    </Link>
  );
}

/** The white card every dashboard block sits in, with its icon tile, title and subtitle. */
function Panel({
  title,
  subtitle,
  icon: Icon,
  tone,
  action,
  className,
  children,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: Tone;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const t = TONES[tone];
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-raised p-5 shadow-[var(--shadow-card)] sm:p-6",
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-xl"
          style={{ background: t.tint, color: t.strong }}
        >
          <Icon
            weight="duotone"
            className="size-[1.375rem]"
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base leading-tight font-semibold">{title}</h2>
          <p className="mt-1 text-[0.8125rem] text-soft">{subtitle}</p>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

interface QuickProps {
  label: string;
  href: string;
  icon: LucideIcon;
  tone: Tone;
  badge?: number;
}

function Quick({ label, href, icon: Icon, tone, badge }: QuickProps) {
  const t = TONES[tone];
  return (
    <Link
      href={href}
      className="group flex min-h-16 items-center gap-3 rounded-xl border border-border bg-white px-3.5 py-3 text-sm font-semibold transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-line)] hover:shadow-[0_10px_24px_-14px_rgb(45_80_210/0.4)] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span
        className="grid size-10 shrink-0 place-items-center rounded-lg"
        style={{ background: t.tint, color: t.strong }}
      >
        <Icon weight="duotone" className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
      {badge !== undefined ? (
        <span
          className={cn(
            "num grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-semibold",
            badge > 0
              ? "bg-[#ef4444] text-white"
              : "bg-[var(--chip)] text-soft",
          )}
        >
          {badge}
        </span>
      ) : null}
      <ArrowRight
        className="size-4 shrink-0 text-soft transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand"
        aria-hidden="true"
      />
    </Link>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

interface RecentListProps {
  title: string;
  subtitle: string;
  href: string;
  icon: LucideIcon;
  tone: Tone;
  emptyTitle: string;
  emptyText: string;
  items: {
    id: string;
    primary: string;
    secondary: string;
    status: string;
    at: string;
  }[];
}

function RecentList({
  title,
  subtitle,
  href,
  icon: Icon,
  tone,
  emptyTitle,
  emptyText,
  items,
}: RecentListProps) {
  return (
    <Panel
      title={title}
      subtitle={subtitle}
      icon={Icon}
      tone={tone}
      action={
        <Link
          href={href}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md text-sm font-semibold text-brand-ink hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          View all
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      }
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center border-t border-border px-4 pt-8 pb-4 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-[var(--ground)] text-soft ring-1 ring-border">
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-4 font-semibold">{emptyTitle}</p>
          <p className="mt-1 max-w-[38ch] text-[0.8125rem] leading-relaxed text-soft">
            {emptyText}
          </p>
        </div>
      ) : (
        <ul className="-mx-2 border-t border-border pt-2">
          {items.map((item) => {
            const fresh = item.status === "new";
            return (
              <li key={item.id}>
                <Link
                  href={`${href}/${item.id}`}
                  className="flex items-center gap-3.5 rounded-xl px-2 py-3 transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-full text-[0.8125rem] font-semibold",
                      fresh
                        ? "bg-[var(--brand-tint)] text-brand-ink"
                        : "bg-[var(--chip)] text-ink/80",
                    )}
                  >
                    {initials(item.primary)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm",
                        fresh ? "font-semibold" : "font-medium",
                      )}
                    >
                      {item.primary}
                    </span>
                    <span className="block truncate text-[0.8125rem] text-soft">
                      {item.secondary} · {dateTime(item.at)}
                    </span>
                  </span>
                  <StatusBadge status={item.status as StatusKind} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export function Overview({ data: d }: { data: DashboardData }) {
  const c = d.counts;
  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        <StatCard
          label="New inquiries"
          caption="From the contact form, awaiting a reply"
          value={c.newInquiries}
          icon={Inbox}
          href="/admin/inquiries?status=new"
          tone="blue"
          shape={0}
        />
        <StatCard
          label="New applications"
          caption="From the careers page, résumés attached"
          value={c.newApplications}
          icon={UserRound}
          href="/admin/applications?status=new"
          tone="violet"
          shape={1}
        />
        <StatCard
          label="Published projects"
          caption="On the work page"
          value={c.projects}
          icon={FolderKanban}
          href="/admin/projects?status=published"
          tone="green"
          shape={2}
        />
        <StatCard
          label="Published posts"
          caption="On the blog"
          value={c.posts}
          icon={Newspaper}
          href="/admin/posts?status=published"
          tone="orange"
          shape={0}
        />
        <StatCard
          label="Team members"
          caption="On the about page"
          value={c.team}
          icon={Users}
          href="/admin/team"
          tone="pink"
          shape={1}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
        <Panel
          title="Site activity"
          subtitle="Content created on the site, day by day."
          icon={Inbox}
          tone="blue"
          className="lg:col-span-7"
        >
          <ActivityChart data={d.activity} />
        </Panel>
        <Panel
          title="Quick actions"
          subtitle="Create new content or manage your site quickly."
          icon={Settings}
          tone="orange"
          className="lg:col-span-5"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
            <Quick
              label="Write a new blog post"
              href="/admin/posts/new"
              icon={FileText}
              tone="green"
            />
            <Quick
              label="Add new project"
              href="/admin/projects/new"
              icon={FolderKanban}
              tone="green"
            />
            <Quick
              label="Manage pages"
              href="/admin/pages"
              icon={FileText}
              tone="blue"
            />
            <Quick
              label="View inquiries"
              href="/admin/inquiries?status=new"
              icon={Mail}
              tone="violet"
              badge={c.newInquiries}
            />
            <Quick
              label="View applications"
              href="/admin/applications?status=new"
              icon={UserRound}
              tone="violet"
              badge={c.newApplications}
            />
            <Quick
              label="Site settings"
              href="/admin/settings"
              icon={Settings}
              tone="blue"
            />
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 lg:gap-6">
        <RecentList
          title="Latest inquiries"
          subtitle="Recent messages from the contact form."
          href="/admin/inquiries"
          icon={Mail}
          tone="orange"
          emptyTitle="No messages yet"
          emptyText="Messages from the contact form will appear here when visitors write to you."
          items={d.recentInquiries.map((i) => ({
            id: i.id,
            primary: i.name,
            secondary: i.service || i.email,
            status: i.status,
            at: i.created_at,
          }))}
        />
        <RecentList
          title="Latest applications"
          subtitle="Recent job applications from the careers page."
          href="/admin/applications"
          icon={UserRound}
          tone="violet"
          emptyTitle="No job applications yet"
          emptyText="Applications will appear here when someone applies through the careers page."
          items={d.recentApplications.map((a) => ({
            id: a.id,
            primary: a.name,
            secondary: a.position,
            status: a.status,
            at: a.created_at,
          }))}
        />
      </div>
    </div>
  );
}
