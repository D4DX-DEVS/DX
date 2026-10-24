import { ArrowUpDown, Pencil, Plus, UserRound, Users } from "@/components/icons";
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
import { deleteTeamMember } from "@/lib/actions/admin/team";
import { listTeam } from "@/lib/data/admin/team";
import { shortDate } from "@/lib/format";

export const metadata: Metadata = { title: "Team" };

type Search = PageProps<"/admin/team">["searchParams"];

function Toolbar() {
  return (
    <ListToolbar
      searchPlaceholder="Search name or role"
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

async function TeamTable({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const result = await listTeam(params);
  const filtered = Object.keys(params).some((k) => ["search", "visibility"].includes(k));

  if (result.data.length === 0) {
    return filtered ? (
      <EmptyState title="No team members match" description="Try another search or clear the filters." action={{ href: "/admin/team", label: "Clear filters" }} />
    ) : (
      <EmptyState icon={Users} title="No team members yet" description="Add people to show them on the about page." action={{ href: "/admin/team/new", label: "New team member" }} />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-border bg-raised shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="md:min-w-56">Person</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="hidden md:table-cell">Position</TableHead>
              <TableHead className="hidden lg:table-cell">Edited</TableHead>
              <TableHead className="hidden w-24 text-right sm:table-cell">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <Link href={`/admin/team/${m.id}`} className="flex items-center gap-3 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-raised-2 text-soft">
                      {m.photo_url ? <Image src={m.photo_url} alt="" fill sizes="44px" className="object-cover" /> : <UserRound className="size-5" aria-hidden="true" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{m.name}</span>
                      <span className="block truncate text-xs text-soft">{m.role}</span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge status={m.published ? "visible" : "hidden"} />
                </TableCell>
                <TableCell className="hidden text-soft md:table-cell num">{m.sort_order}</TableCell>
                <TableCell className="hidden text-soft lg:table-cell">{shortDate(m.updated_at)}</TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" aria-label={`Edit ${m.name}`}>
                      <Link href={`/admin/team/${m.id}`}>
                        <Pencil className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                    <DeleteButton compact name={m.name} consequence="They disappear from the about page." action={deleteTeamMember.bind(null, m.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataPagination page={result.page} pageSize={result.pageSize} total={result.total} totalPages={result.totalPages} noun="team members" />
    </div>
  );
}

export default function TeamPage({ searchParams }: PageProps<"/admin/team">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Team"
        description="The people on the about page, in this order."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/team/order">
                <ArrowUpDown className="size-4" aria-hidden="true" />
                Reorder
              </Link>
            </Button>
            <Button asChild className="bg-brand text-on-brand hover:bg-[var(--brand-strong)]">
              <Link href="/admin/team/new">
                <Plus className="size-4" aria-hidden="true" />
                New team member
              </Link>
            </Button>
          </div>
        }
      />
      <Suspense fallback={<ToolbarSkeleton filters={1} />}>
        <Toolbar />
      </Suspense>
      <Suspense fallback={<TableSkeleton columns={4} />}>
        <TeamTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
