import { Eye, UserRound } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteApplication } from "@/lib/actions/admin/applications";
import { getApplicationPositions, listApplications } from "@/lib/data/admin/applications";
import { dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Applications" };

type Search = PageProps<"/admin/applications">["searchParams"];

async function Toolbar() {
  const positions = await getApplicationPositions();
  return (
    <ListToolbar
      searchPlaceholder="Search name, email, position or message"
      defaultSort="received"
      defaultOrder="desc"
      sorts={[
        { value: "received", label: "Received" },
        { value: "name", label: "Name" },
        { value: "position", label: "Position" },
      ]}
      filters={[
        {
          name: "status",
          label: "Statuses",
          options: [
            { value: "new", label: "New" },
            { value: "read", label: "Read" },
            { value: "archived", label: "Archived" },
          ],
        },
        { name: "position", label: "Positions", options: positions },
      ]}
    />
  );
}

async function ApplicationsTable({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const result = await listApplications(params);
  const filtered = Object.keys(params).some((k) => ["search", "status", "position"].includes(k));

  if (result.data.length === 0) {
    return filtered ? (
      <EmptyState title="No applications match" description="Try another search or clear the filters." action={{ href: "/admin/applications", label: "Clear filters" }} />
    ) : (
      <EmptyState icon={UserRound} title="No applications yet" description="Applications sent from the careers page will appear here." action={{ href: "/admin/jobs", label: "Manage jobs" }} />
    );
  }

  return (
    <div className="space-y-4">
      {/* Applicant and status first; position, experience and date step aside on small screens. */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-raised">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="md:min-w-56">Applicant</TableHead>
              <TableHead className="hidden md:table-cell">Position</TableHead>
              <TableHead className="hidden lg:table-cell">Experience</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Received</TableHead>
              <TableHead className="hidden w-24 text-right sm:table-cell">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <Link href={`/admin/applications/${a.id}`} className="block min-w-0 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    <span className={cn("block truncate text-ink", a.status === "new" ? "font-semibold" : "font-medium")}>{a.name}</span>
                    <span className="block truncate text-xs text-soft">{a.email}</span>
                  </Link>
                </TableCell>
                <TableCell className="hidden text-soft md:table-cell">{a.position}</TableCell>
                <TableCell className="hidden text-soft lg:table-cell">{a.experience || "Not given"}</TableCell>
                <TableCell>
                  <StatusBadge status={a.status} />
                </TableCell>
                <TableCell className="hidden text-soft sm:table-cell">{dateTime(a.created_at)}</TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" aria-label={`Open the application from ${a.name}`}>
                      <Link href={`/admin/applications/${a.id}`}>
                        <Eye className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                    <DeleteButton
                      compact
                      name={`the application from ${a.name}`}
                      consequence="The application and its résumé are removed."
                      action={deleteApplication.bind(null, a.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataPagination page={result.page} pageSize={result.pageSize} total={result.total} totalPages={result.totalPages} noun="applications" />
    </div>
  );
}

export default function ApplicationsPage({ searchParams }: PageProps<"/admin/applications">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="Applications" description="Job applications from the careers page, with their résumés. Opening a new one marks it read." />
      <Suspense fallback={<ToolbarSkeleton filters={2} />}>
        <Toolbar />
      </Suspense>
      <Suspense fallback={<TableSkeleton columns={5} />}>
        <ApplicationsTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
