import { Pencil, Plus, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DataPagination } from "@/components/admin/data-pagination";
import { DeleteButton } from "@/components/admin/delete-button";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton, ToolbarSkeleton } from "@/components/admin/skeletons";
import { EmptyState } from "@/components/admin/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteUser } from "@/lib/actions/admin/users";
import { listUsers } from "@/lib/data/admin/users";
import { dateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Admin users" };

type Search = PageProps<"/admin/users">["searchParams"];

async function UsersTable({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const result = await listUsers(params);
  const filtered = Object.keys(params).some((k) => ["search", "role"].includes(k));

  if (result.data.length === 0) {
    return filtered ? (
      <EmptyState title="No admins match" description="Try another search or clear the filters." action={{ href: "/admin/users", label: "Clear filters" }} />
    ) : (
      <EmptyState icon={ShieldCheck} title="No admins yet" description="Add someone who can sign in to the admin." action={{ href: "/admin/users/new", label: "New admin" }} />
    );
  }

  return (
    <div className="space-y-4">
      {/* Name and role first; email and last sign-in step aside on small screens. */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-raised">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="md:min-w-48">Name</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden sm:table-cell">Last sign-in</TableHead>
              <TableHead className="hidden w-24 text-right sm:table-cell">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((u) => {
              const self = u.id === result.selfId;
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <Link href={`/admin/users/${u.id}`} className="block min-w-0 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                      <span className="block truncate font-medium text-ink">
                        {u.name}
                        {self ? <span className="ml-2 text-xs font-normal text-soft">(you)</span> : null}
                      </span>
                      <span className="block truncate text-xs text-soft md:hidden">{u.email}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden text-soft md:table-cell">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "owner" ? "default" : "secondary"} className="gap-1 capitalize">
                      {u.role === "owner" ? <ShieldCheck aria-hidden="true" /> : null}
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-soft sm:table-cell">{u.last_login_at ? dateTime(u.last_login_at) : "Never"}</TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" aria-label={`Edit ${u.name}`}>
                        <Link href={`/admin/users/${u.id}`}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Link>
                      </Button>
                      {self ? null : (
                        <DeleteButton compact name={u.name} consequence="They can no longer sign in to the admin." action={deleteUser.bind(null, u.id)} />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <DataPagination page={result.page} pageSize={result.pageSize} total={result.total} totalPages={result.totalPages} noun="admins" />
    </div>
  );
}

export default function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Admin users"
        description="Who can sign in to the admin. Only owners see this page."
        actions={
          <Button asChild className="bg-brand text-on-brand hover:bg-[var(--brand-strong)]">
            <Link href="/admin/users/new">
              <Plus className="size-4" aria-hidden="true" />
              New admin
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<ToolbarSkeleton filters={1} />}>
        <ListToolbar
          searchPlaceholder="Search name or email"
          defaultSort="name"
          defaultOrder="asc"
          sorts={[
            { value: "name", label: "Name" },
            { value: "email", label: "Email" },
            { value: "lastLogin", label: "Last sign-in" },
          ]}
          filters={[
            {
              name: "role",
              label: "Roles",
              options: [
                { value: "owner", label: "Owner" },
                { value: "editor", label: "Editor" },
              ],
            },
          ]}
        />
      </Suspense>
      <Suspense fallback={<TableSkeleton columns={4} />}>
        <UsersTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
