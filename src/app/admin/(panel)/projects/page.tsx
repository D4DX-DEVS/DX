import { FolderKanban, Pencil, Plus, Star } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
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
import { deleteProject } from "@/lib/actions/admin/projects";
import { getCategoryOptions, listProjects } from "@/lib/data/admin/projects";
import { shortDate } from "@/lib/format";

export const metadata: Metadata = { title: "Projects" };

type Search = PageProps<"/admin/projects">["searchParams"];

async function Toolbar() {
  const categories = await getCategoryOptions();
  return (
    <ListToolbar
      searchPlaceholder="Search title, client or slug"
      defaultSort="order"
      defaultOrder="asc"
      sorts={[
        { value: "order", label: "Position" },
        { value: "title", label: "Title" },
        { value: "date", label: "Project date" },
        { value: "updated", label: "Last edited" },
      ]}
      filters={[
        { name: "status", label: "Statuses", options: [{ value: "published", label: "Published" }, { value: "draft", label: "Draft" }] },
        { name: "category", label: "Categories", options: categories },
      ]}
    />
  );
}

async function ProjectsTable({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const result = await listProjects(params);
  const filtered = Object.keys(params).some((k) => ["search", "status", "category"].includes(k));

  if (result.data.length === 0) {
    return filtered ? (
      <EmptyState title="No projects match" description="Try another search or clear the filters." action={{ href: "/admin/projects", label: "Clear filters" }} />
    ) : (
      <EmptyState icon={FolderKanban} title="No projects yet" description="Add the first project to show it on the work page." action={{ href: "/admin/projects/new", label: "New project" }} />
    );
  }

  return (
    <div className="space-y-4">
      {/* Key columns first; client, position and dates step aside on small screens. */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-raised">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="md:min-w-64">Project</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Position</TableHead>
              <TableHead className="hidden lg:table-cell">Edited</TableHead>
              <TableHead className="hidden w-24 text-right sm:table-cell">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link href={`/admin/projects/${p.id}`} className="flex items-center gap-3 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-raised-2">
                      {p.cover_url ? <Image src={p.cover_url} alt="" fill sizes="44px" className="object-cover" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 font-medium text-ink">
                        <span className="truncate">{p.title}</span>
                        {p.featured ? <Star className="size-3.5 shrink-0 fill-current text-brand-ink" aria-label="Featured" /> : null}
                      </span>
                      <span className="block truncate text-xs text-soft">{p.client || p.slug}</span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="hidden text-soft md:table-cell">{p.category ?? "None"}</TableCell>
                <TableCell>
                  <StatusBadge status={p.status} />
                </TableCell>
                <TableCell className="hidden text-soft lg:table-cell num">{p.sort_order}</TableCell>
                <TableCell className="hidden text-soft lg:table-cell">{shortDate(p.updated_at)}</TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" aria-label={`Edit ${p.title}`}>
                      <Link href={`/admin/projects/${p.id}`}>
                        <Pencil className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                    <DeleteButton compact name={p.title} consequence="It disappears from the work page and the home page." action={deleteProject.bind(null, p.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataPagination page={result.page} pageSize={result.pageSize} total={result.total} totalPages={result.totalPages} noun="projects" />
    </div>
  );
}

export default function ProjectsPage({ searchParams }: PageProps<"/admin/projects">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Projects"
        description="Case studies on the work page. Featured projects also appear on the home page."
        actions={
          <Button asChild className="bg-brand text-on-brand hover:bg-[var(--brand-strong)]">
            <Link href="/admin/projects/new">
              <Plus className="size-4" aria-hidden="true" />
              New project
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<ToolbarSkeleton filters={2} />}>
        <Toolbar />
      </Suspense>
      <Suspense fallback={<TableSkeleton columns={5} />}>
        <ProjectsTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
