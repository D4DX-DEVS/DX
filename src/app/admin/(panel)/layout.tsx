import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/auth/dal";
import { getNavBadges } from "@/lib/data/admin/inbox";

/** The session is read inside the boundary, so the shell streams in after the database check. */
async function Panel({ children }: { children: React.ReactNode }) {
  const [admin, unread] = await Promise.all([requireAdmin(), getNavBadges()]);
  return (
    <AdminShell admin={admin} badges={{ "/admin/inquiries": unread.inquiries, "/admin/applications": unread.applications }}>
      {children}
    </AdminShell>
  );
}

function ShellFallback() {
  return (
    <div aria-busy="true" aria-label="Loading" className="min-h-dvh bg-ground lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <div className="hidden border-r border-border bg-raised p-6 lg:block">
        <Skeleton className="h-6 w-28" />
        <div className="mt-10 space-y-3">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
      <div>
        <div className="h-16 border-b border-border" />
        <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <Panel>{children}</Panel>
    </Suspense>
  );
}
