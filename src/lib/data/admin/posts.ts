import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/dal";
import { first, json } from "@/lib/db";
import { listQuerySchema, parseSearchParams, type Paginated, type SearchParamsRecord } from "@/lib/listing";
import type { MediaDoc, PostRow } from "@/lib/models";
import type { PostInput } from "@/lib/schemas/admin";
import { listPage } from "../admin-query";

export const postListQuery = listQuerySchema({
  sort: ["published", "title", "updated"],
  defaultSort: "published",
  defaultOrder: "desc",
  filters: {
    status: z.enum(["published", "draft"]).optional().catch(undefined),
  },
});

export interface PostListRow {
  id: string;
  title: string;
  slug: string;
  status: "published" | "draft";
  tags: string;
  published_at: string | null;
  updated_at: string;
  cover_url: string | null;
}

export async function listPosts(params: SearchParamsRecord): Promise<Paginated<PostListRow>> {
  await requireAdmin();
  const q = parseSearchParams(postListQuery, params);
  const where = [];
  if (q.status) where.push({ sql: "status = ?", params: [q.status] });
  return listPage<PostListRow>(
    {
      from: "posts",
      select: "id, title, slug, status, tags, published_at, updated_at, json_extract(cover, '$.url') AS cover_url",
      search: ["title", "slug", "excerpt"],
      sorts: { published: "published_at", title: "title COLLATE NOCASE", updated: "updated_at" },
      where,
      tiebreak: "id",
    },
    q,
  );
}

export interface PostEdit {
  id: string;
  slug: string;
  values: PostInput;
}

export async function getPostForEdit(id: string): Promise<PostEdit | null> {
  await requireAdmin();
  const r = await first<PostRow>("SELECT * FROM posts WHERE id = ?", [id]);
  if (!r) return null;
  return {
    id: r.id,
    slug: r.slug,
    values: {
      title: r.title,
      slug: r.slug,
      excerpt: r.excerpt,
      content: r.content,
      cover: json<MediaDoc | null>(r.cover, null),
      tags: json<string[]>(r.tags, []),
      website: r.website ?? "",
      playStore: r.play_store ?? "",
      appStore: r.app_store ?? "",
      status: r.status,
      publishedAt: r.published_at ? r.published_at.slice(0, 10) : "",
    },
  };
}
