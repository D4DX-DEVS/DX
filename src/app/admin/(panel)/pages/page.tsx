import { FileText, Pencil, Plus } from "@/components/icons";
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
import { deletePage } from "@/lib/actions/admin/pages";
import { listPages } from "@/lib/data/admin/pages";
import { shortDate } from "@/lib/format";
import { PAGE_SECTION_LABEL } from "@/lib/schemas/admin";

export const metadata: Metadata = { title: "Pages" };

type Search = PageProps<"/admin/pages">["searchParams"];

function Toolbar() {
  return (
    <ListToolbar
      searchPlaceholder="Search title or slug"
      defaultSort="title"
      defaultOrder="asc"
      sorts={[
        { value: "title", label: "Title" },
        { value: "updated", label: "Last edited" },
      ]}
    />
  );
}

async function PagesTable({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const result = await listPages(params);
  const filtered = Boolean(params.search);

  if (result.data.length === 0) {
    return filtered ? (
      <EmptyState title="No pages match" description="Try another search or clear the filters." action={{ href: "/admin/pages", label: "Clear filters" }} />
    ) : (
      <EmptyState icon={FileText} title="No pages yet" description="Add a privacy policy, terms, or text for the Join Our Team page." action={{ href: "/admin/pages/new", label: "New page" }} />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-border bg-raised shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="md:min-w-56">Page</TableHead>
              <TableHead className="hidden md:table-cell">Shows on</TableHead>
              <TableHead className="hidden sm:table-cell">Edited</TableHead>
              <TableHead className="hidden w-24 text-right sm:table-cell">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link href={`/admin/pages/${p.id}`} className="block truncate rounded-lg font-medium text-ink focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    {p.title}
                  </Link>
                </TableCell>
                <TableCell className="hidden text-soft md:table-cell">{p.section === "legal" ? `/legal/${p.slug}` : PAGE_SECTION_LABEL[p.section as keyof typeof PAGE_SECTION_LABEL] ?? p.section}</TableCell>
                <TableCell className="hidden text-soft sm:table-cell">{shortDate(p.updated_at)}</TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" aria-label={`Edit ${p.title}`}>
                      <Link href={`/admin/pages/${p.id}`}>
                        <Pencil className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                    <DeleteButton compact name={p.title} consequence="Its address stops working and links to it break." action={deletePage.bind(null, p.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataPagination page={result.page} pageSize={result.pageSize} total={result.total} totalPages={result.totalPages} noun="pages" />
    </div>
  );
}

export default function LegalPagesPage({ searchParams }: PageProps<"/admin/pages">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Pages"
        description="Legal pages under /legal, and the text blocks of the Join Our Team page."
        actions={
          <Button asChild className="bg-brand text-on-brand hover:bg-[var(--brand-strong)]">
            <Link href="/admin/pages/new">
              <Plus className="size-4" aria-hidden="true" />
              New page
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<ToolbarSkeleton filters={0} />}>
        <Toolbar />
      </Suspense>
      <Suspense fallback={<TableSkeleton columns={3} />}>
        <PagesTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
