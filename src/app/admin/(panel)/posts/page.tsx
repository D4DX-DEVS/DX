import { Newspaper, Pencil, Plus } from "@/components/icons";
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
import { deletePost } from "@/lib/actions/admin/posts";
import { listPosts } from "@/lib/data/admin/posts";
import { json } from "@/lib/db";
import { shortDate } from "@/lib/format";

export const metadata: Metadata = { title: "Blog posts" };

type Search = PageProps<"/admin/posts">["searchParams"];

function Toolbar() {
  return (
    <ListToolbar
      searchPlaceholder="Search title, slug or excerpt"
      defaultSort="published"
      defaultOrder="desc"
      sorts={[
        { value: "published", label: "Published date" },
        { value: "title", label: "Title" },
        { value: "updated", label: "Last edited" },
      ]}
      filters={[{ name: "status", label: "Statuses", options: [{ value: "published", label: "Published" }, { value: "draft", label: "Draft" }] }]}
    />
  );
}

async function PostsTable({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const result = await listPosts(params);
  const filtered = Object.keys(params).some((k) => ["search", "status"].includes(k));

  if (result.data.length === 0) {
    return filtered ? (
      <EmptyState title="No posts match" description="Try another search or clear the filters." action={{ href: "/admin/posts", label: "Clear filters" }} />
    ) : (
      <EmptyState icon={Newspaper} title="No posts yet" description="Write the first post to show it on the blog." action={{ href: "/admin/posts/new", label: "New post" }} />
    );
  }

  return (
    <div className="space-y-4">
      {/* Key columns first; tags and dates step aside on small screens. */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-raised shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="md:min-w-64">Post</TableHead>
              <TableHead className="hidden md:table-cell">Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Published</TableHead>
              <TableHead className="hidden w-24 text-right sm:table-cell">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((p) => {
              const tags = json<string[]>(p.tags, []);
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/admin/posts/${p.id}`} className="flex items-center gap-3 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-raised-2">
                        {p.cover_url ? <Image src={p.cover_url} alt="" fill sizes="44px" className="object-cover" /> : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">{p.title}</span>
                        <span className="block truncate text-xs text-soft">{p.slug}</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden max-w-56 truncate text-soft md:table-cell">{tags.length ? tags.join(", ") : "None"}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="hidden text-soft lg:table-cell">{p.published_at ? shortDate(p.published_at) : "Not set"}</TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" aria-label={`Edit ${p.title}`}>
                        <Link href={`/admin/posts/${p.id}`}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Link>
                      </Button>
                      <DeleteButton compact name={p.title} consequence="It disappears from the blog." action={deletePost.bind(null, p.id)} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <DataPagination page={result.page} pageSize={result.pageSize} total={result.total} totalPages={result.totalPages} noun="posts" />
    </div>
  );
}

export default function PostsPage({ searchParams }: PageProps<"/admin/posts">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Blog posts"
        description="Articles on the blog. Drafts stay hidden until you publish them."
        actions={
          <Button asChild className="bg-brand text-on-brand hover:bg-[var(--brand-strong)]">
            <Link href="/admin/posts/new">
              <Plus className="size-4" aria-hidden="true" />
              New post
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<ToolbarSkeleton filters={1} />}>
        <Toolbar />
      </Suspense>
      <Suspense fallback={<TableSkeleton columns={4} />}>
        <PostsTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
