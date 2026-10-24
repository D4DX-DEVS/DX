import { MessageSquareQuote, Pencil, Plus } from "@/components/icons";
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
import { deleteTestimonial } from "@/lib/actions/admin/testimonials";
import { listTestimonials } from "@/lib/data/admin/testimonials";
import { shortDate } from "@/lib/format";

export const metadata: Metadata = { title: "Testimonials" };

type Search = PageProps<"/admin/testimonials">["searchParams"];

function Toolbar() {
  return (
    <ListToolbar
      searchPlaceholder="Search quote, name or role"
      defaultSort="order"
      defaultOrder="asc"
      sorts={[
        { value: "order", label: "Position" },
        { value: "name", label: "Name" },
        { value: "updated", label: "Last edited" },
      ]}
      filters={[{ name: "visibility", label: "Visibility", options: [{ value: "visible", label: "Visible" }, { value: "hidden", label: "Hidden" }] }]}
    />
  );
}

async function TestimonialsTable({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const result = await listTestimonials(params);
  const filtered = Object.keys(params).some((k) => ["search", "visibility"].includes(k));

  if (result.data.length === 0) {
    return filtered ? (
      <EmptyState title="No testimonials match" description="Try another search or clear the filters." action={{ href: "/admin/testimonials", label: "Clear filters" }} />
    ) : (
      <EmptyState
        icon={MessageSquareQuote}
        title="No testimonials yet"
        description="Add what clients said to show it on the home page."
        action={{ href: "/admin/testimonials/new", label: "New testimonial" }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-border bg-raised shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="md:min-w-64">Quote</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="hidden md:table-cell">Project</TableHead>
              <TableHead className="hidden lg:table-cell">Position</TableHead>
              <TableHead className="hidden lg:table-cell">Edited</TableHead>
              <TableHead className="hidden w-24 text-right sm:table-cell">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="max-w-md whitespace-normal">
                  <Link href={`/admin/testimonials/${t.id}`} className="block rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    <span className="line-clamp-2 font-medium text-ink">“{t.quote}”</span>
                    <span className="block truncate text-xs text-soft">
                      {t.name}
                      {t.role ? `, ${t.role}` : ""}
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge status={t.published ? "visible" : "hidden"} />
                </TableCell>
                <TableCell className="hidden text-soft md:table-cell">{t.project ?? "None"}</TableCell>
                <TableCell className="hidden text-soft lg:table-cell num">{t.sort_order}</TableCell>
                <TableCell className="hidden text-soft lg:table-cell">{shortDate(t.updated_at)}</TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" aria-label={`Edit the quote from ${t.name}`}>
                      <Link href={`/admin/testimonials/${t.id}`}>
                        <Pencil className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                    <DeleteButton compact name={`the quote from ${t.name}`} consequence="It disappears from the site." action={deleteTestimonial.bind(null, t.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataPagination page={result.page} pageSize={result.pageSize} total={result.total} totalPages={result.totalPages} noun="testimonials" />
    </div>
  );
}

export default function TestimonialsPage({ searchParams }: PageProps<"/admin/testimonials">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Testimonials"
        description="What clients said about the work. The first six visible ones are shown on the site."
        actions={
          <Button asChild className="bg-brand text-on-brand hover:bg-[var(--brand-strong)]">
            <Link href="/admin/testimonials/new">
              <Plus className="size-4" aria-hidden="true" />
              New testimonial
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<ToolbarSkeleton filters={1} />}>
        <Toolbar />
      </Suspense>
      <Suspense fallback={<TableSkeleton columns={5} />}>
        <TestimonialsTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
