import { ArrowUpDown, BriefcaseBusiness, Pencil, Plus } from "@/components/icons";
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
import { deleteJob } from "@/lib/actions/admin/jobs";
import { listJobs } from "@/lib/data/admin/jobs";

export const metadata: Metadata = { title: "Positions" };

type Search = PageProps<"/admin/jobs">["searchParams"];

function Toolbar() {
  return (
    <ListToolbar
      searchPlaceholder="Search title, level or location"
      defaultSort="order"
      defaultOrder="asc"
      sorts={[
        { value: "order", label: "Position" },
        { value: "title", label: "Title" },
        { value: "updated", label: "Last edited" },
      ]}
      filters={[{ name: "open", label: "Openings", options: [{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }] }]}
    />
  );
}

async function JobsTable({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const result = await listJobs(params);
  const filtered = Object.keys(params).some((k) => ["search", "open"].includes(k));

  if (result.data.length === 0) {
    return filtered ? (
      <EmptyState title="No positions match" description="Try another search or clear the filters." action={{ href: "/admin/jobs", label: "Clear filters" }} />
    ) : (
      <EmptyState icon={BriefcaseBusiness} title="No positions yet" description="Add a position to list it in the table on the Join Our Team page." action={{ href: "/admin/jobs/new", label: "New position" }} />
    );
  }

  return (
    <div className="space-y-4">
      {/* Key columns first; level, location and position step aside on small screens. */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-raised shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="md:min-w-56">Job</TableHead>
              <TableHead className="hidden md:table-cell">Level</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Position</TableHead>
              <TableHead className="hidden w-24 text-right sm:table-cell">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((j) => (
              <TableRow key={j.id}>
                <TableCell>
                  <Link href={`/admin/jobs/${j.id}`} className="block rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    <span className="block truncate font-medium text-ink">{j.title}</span>
                    <span className="block truncate text-xs text-soft">{j.slug}</span>
                  </Link>
                </TableCell>
                <TableCell className="hidden text-soft md:table-cell">{j.level || "None"}</TableCell>
                <TableCell className="hidden text-soft md:table-cell">{j.location || "None"}</TableCell>
                <TableCell>
                  <StatusBadge status={j.open ? "open" : "closed"} />
                </TableCell>
                <TableCell className="hidden text-soft lg:table-cell num">{j.sort_order}</TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" aria-label={`Edit ${j.title}`}>
                      <Link href={`/admin/jobs/${j.id}`}>
                        <Pencil className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                    <DeleteButton compact name={j.title} consequence="It disappears from the careers page." action={deleteJob.bind(null, j.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataPagination page={result.page} pageSize={result.pageSize} total={result.total} totalPages={result.totalPages} noun="positions" />
    </div>
  );
}

export default function JobsPage({ searchParams }: PageProps<"/admin/jobs">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Positions"
        description="The open positions table on the Join Our Team page. Newest first; move any of them up or down. Closed positions stay here but are hidden from the site."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/pages">Page text</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/jobs/order">
                <ArrowUpDown className="size-4" aria-hidden="true" />
                Reorder
              </Link>
            </Button>
            <Button asChild className="bg-brand text-on-brand hover:bg-[var(--brand-strong)]">
              <Link href="/admin/jobs/new">
                <Plus className="size-4" aria-hidden="true" />
                New position
              </Link>
            </Button>
          </div>
        }
      />
      <Suspense fallback={<ToolbarSkeleton filters={1} />}>
        <Toolbar />
      </Suspense>
      <Suspense fallback={<TableSkeleton columns={5} />}>
        <JobsTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
