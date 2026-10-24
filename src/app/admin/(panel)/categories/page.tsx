import { Layers, Pencil, Plus } from "@/components/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DataPagination } from "@/components/admin/data-pagination";
import { DeleteButton } from "@/components/admin/delete-button";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton, ToolbarSkeleton } from "@/components/admin/skeletons";
import { EmptyState } from "@/components/admin/states";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteCategory } from "@/lib/actions/admin/categories";
import { listCategories } from "@/lib/data/admin/categories";
import { shortDate } from "@/lib/format";

export const metadata: Metadata = { title: "Categories" };

type Search = PageProps<"/admin/categories">["searchParams"];

function Toolbar() {
  return (
    <ListToolbar
      searchPlaceholder="Search name or slug"
      defaultSort="order"
      defaultOrder="asc"
      sorts={[
        { value: "order", label: "Position" },
        { value: "name", label: "Name" },
        { value: "updated", label: "Last edited" },
      ]}
    />
  );
}

async function CategoriesTable({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const result = await listCategories(params);
  const filtered = Boolean(params.search);

  if (result.data.length === 0) {
    return filtered ? (
      <EmptyState title="No categories match" description="Try another search or clear it." action={{ href: "/admin/categories", label: "Clear filters" }} />
    ) : (
      <EmptyState icon={Layers} title="No categories yet" description="Projects need a category before they can be saved." action={{ href: "/admin/categories/new", label: "New category" }} />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-border bg-raised shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="md:min-w-48">Category</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead className="hidden md:table-cell">Position</TableHead>
              <TableHead className="hidden lg:table-cell">Edited</TableHead>
              <TableHead className="hidden w-24 text-right sm:table-cell">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link href={`/admin/categories/${c.id}`} className="block rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    <span className="block truncate font-medium text-ink">{c.name}</span>
                    <span className="block truncate text-xs text-soft">{c.slug}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-soft num">{c.projects}</TableCell>
                <TableCell className="hidden text-soft md:table-cell num">{c.sort_order}</TableCell>
                <TableCell className="hidden text-soft lg:table-cell">{shortDate(c.updated_at)}</TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" aria-label={`Edit ${c.name}`}>
                      <Link href={`/admin/categories/${c.id}`}>
                        <Pencil className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                    <DeleteButton compact name={c.name} consequence="Its filter disappears from the work page." action={deleteCategory.bind(null, c.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataPagination page={result.page} pageSize={result.pageSize} total={result.total} totalPages={result.totalPages} noun="categories" />
    </div>
  );
}

export default function CategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Categories"
        description="The groups on the work page. Every project belongs to one."
        actions={
          <Button asChild className="bg-brand text-on-brand hover:bg-[var(--brand-strong)]">
            <Link href="/admin/categories/new">
              <Plus className="size-4" aria-hidden="true" />
              New category
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<ToolbarSkeleton filters={0} />}>
        <Toolbar />
      </Suspense>
      <Suspense fallback={<TableSkeleton columns={4} />}>
        <CategoriesTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
