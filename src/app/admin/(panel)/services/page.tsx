import { Pencil, Plus, Sparkles } from "@/components/icons";
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
import { deleteService } from "@/lib/actions/admin/services";
import { listServices } from "@/lib/data/admin/services";
import { shortDate } from "@/lib/format";

export const metadata: Metadata = { title: "Services" };

type Search = PageProps<"/admin/services">["searchParams"];

function Toolbar() {
  return (
    <ListToolbar
      searchPlaceholder="Search title, slug or summary"
      defaultSort="order"
      defaultOrder="asc"
      sorts={[
        { value: "order", label: "Position" },
        { value: "title", label: "Title" },
        { value: "updated", label: "Last edited" },
      ]}
      filters={[{ name: "visibility", label: "Visibility", options: [{ value: "visible", label: "Visible" }, { value: "hidden", label: "Hidden" }] }]}
    />
  );
}

async function ServicesTable({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const result = await listServices(params);
  const filtered = Object.keys(params).some((k) => ["search", "visibility"].includes(k));

  if (result.data.length === 0) {
    return filtered ? (
      <EmptyState title="No services match" description="Try another search or clear the filters." action={{ href: "/admin/services", label: "Clear filters" }} />
    ) : (
      <EmptyState icon={Sparkles} title="No services yet" description="Add what the studio offers to show it on the services page." action={{ href: "/admin/services/new", label: "New service" }} />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-border bg-raised shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="md:min-w-56">Service</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="hidden md:table-cell">Proof project</TableHead>
              <TableHead className="hidden lg:table-cell">Position</TableHead>
              <TableHead className="hidden lg:table-cell">Edited</TableHead>
              <TableHead className="hidden w-24 text-right sm:table-cell">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <Link href={`/admin/services/${s.id}`} className="block rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    <span className="block truncate font-medium text-ink">{s.title}</span>
                    <span className="block truncate text-xs text-soft">{s.slug}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge status={s.published ? "visible" : "hidden"} />
                </TableCell>
                <TableCell className="hidden text-soft md:table-cell">{s.proof_project ?? "None"}</TableCell>
                <TableCell className="hidden text-soft lg:table-cell num">{s.sort_order}</TableCell>
                <TableCell className="hidden text-soft lg:table-cell">{shortDate(s.updated_at)}</TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" aria-label={`Edit ${s.title}`}>
                      <Link href={`/admin/services/${s.id}`}>
                        <Pencil className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                    <DeleteButton compact name={s.title} consequence="It disappears from the services page and the home page." action={deleteService.bind(null, s.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataPagination page={result.page} pageSize={result.pageSize} total={result.total} totalPages={result.totalPages} noun="services" />
    </div>
  );
}

export default function ServicesPage({ searchParams }: PageProps<"/admin/services">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Services"
        description="What the studio offers, each with a project that proves it."
        actions={
          <Button asChild className="bg-brand text-on-brand hover:bg-[var(--brand-strong)]">
            <Link href="/admin/services/new">
              <Plus className="size-4" aria-hidden="true" />
              New service
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<ToolbarSkeleton filters={1} />}>
        <Toolbar />
      </Suspense>
      <Suspense fallback={<TableSkeleton columns={5} />}>
        <ServicesTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
