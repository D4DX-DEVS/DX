import { Eye, Inbox } from "@/components/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DataPagination } from "@/components/admin/data-pagination";
import { DeleteButton } from "@/components/admin/delete-button";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton, ToolbarSkeleton } from "@/components/admin/skeletons";
import { EmptyState } from "@/components/admin/states";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatusTabs } from "@/components/admin/status-tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteInquiry } from "@/lib/actions/admin/inquiries";
import { listInquiries } from "@/lib/data/admin/inquiries";
import { getStatusCounts } from "@/lib/data/admin/inbox";
import { dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Inquiries" };

type Search = PageProps<"/admin/inquiries">["searchParams"];

async function Tabs({ searchParams }: { searchParams: Search }) {
  const [params, counts] = await Promise.all([searchParams, getStatusCounts("inquiries")]);
  return <StatusTabs counts={counts} params={params} basePath="/admin/inquiries" />;
}

async function InquiriesTable({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const result = await listInquiries(params);
  const filtered = Object.keys(params).some((k) => ["search", "status"].includes(k));

  if (result.data.length === 0) {
    return filtered ? (
      <EmptyState title="No inquiries match" description="Try another search or clear the filters." action={{ href: "/admin/inquiries", label: "Clear filters" }} />
    ) : (
      <EmptyState icon={Inbox} title="No inquiries yet" description="Messages sent from the contact form will appear here." />
    );
  }

  return (
    <div className="space-y-4">
      {/* Sender and status first; the service and date step aside on small screens. */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-raised shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="md:min-w-56">From</TableHead>
              <TableHead className="hidden xl:table-cell">Message</TableHead>
              <TableHead className="hidden md:table-cell">Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Received</TableHead>
              <TableHead className="hidden w-24 text-right sm:table-cell">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((i) => (
              <TableRow key={i.id}>
                <TableCell>
                  <Link href={`/admin/inquiries/${i.id}`} className="block min-w-0 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    <span className={cn("block truncate text-ink", i.status === "new" ? "font-semibold" : "font-medium")}>{i.name}</span>
                    <span className="block truncate text-xs text-soft">{i.email}</span>
                  </Link>
                </TableCell>
                <TableCell className="hidden max-w-[26rem] truncate text-soft xl:table-cell">{i.message}</TableCell>
                <TableCell className="hidden text-soft md:table-cell">{i.service || "Not given"}</TableCell>
                <TableCell>
                  <StatusBadge status={i.status} />
                </TableCell>
                <TableCell className="hidden text-soft sm:table-cell">{dateTime(i.created_at)}</TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" aria-label={`Open the inquiry from ${i.name}`}>
                      <Link href={`/admin/inquiries/${i.id}`}>
                        <Eye className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                    <DeleteButton compact name={`the inquiry from ${i.name}`} consequence="The message is removed from the inbox." action={deleteInquiry.bind(null, i.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataPagination page={result.page} pageSize={result.pageSize} total={result.total} totalPages={result.totalPages} noun="inquiries" />
    </div>
  );
}

export default function InquiriesPage({ searchParams }: PageProps<"/admin/inquiries">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="Inquiries" description="Messages from the contact form. Opening a new one marks it read." />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Suspense fallback={<Skeleton className="h-11 w-80 rounded-xl md:h-10" />}>
          <Tabs searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<ToolbarSkeleton filters={0} />}>
          <ListToolbar
            searchPlaceholder="Search name, email or message"
            defaultSort="received"
            defaultOrder="desc"
            sorts={[
              { value: "received", label: "Received" },
              { value: "name", label: "Name" },
            ]}
          />
        </Suspense>
      </div>
      <Suspense fallback={<TableSkeleton columns={5} />}>
        <InquiriesTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
