import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { all, batch, first, json } from "@/lib/db";
import type { JobRow, MediaDoc, PageRow, PostRow } from "@/lib/models";
import { toPaginated, type Paginated } from "@/lib/listing";
import type { JobDTO, LegalPageDTO, PostCard, PostDetail } from "@/lib/types";
import { iso, toMedia } from "./mappers";
import { TAGS } from "./tags";

const PUBLISHED = "status = 'published'";
export const BLOG_PAGE_SIZE = 6;

const POST_CARD_COLUMNS = "id, title, slug, excerpt, cover, tags, published_at";

type RawPost = Pick<
  PostRow,
  "id" | "title" | "slug" | "excerpt" | "cover" | "tags" | "published_at"
> & { content?: string };

function toPostCard(r: RawPost): PostCard {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt ?? "",
    cover: toMedia(json<MediaDoc | null>(r.cover, null)),
    tags: json<string[]>(r.tags, []),
    publishedAt: iso(r.published_at),
  };
}

export async function getPostsPage(page: number): Promise<Paginated<PostCard>> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.posts);
  const [rows, count] = await batch([
    {
      sql: `SELECT ${POST_CARD_COLUMNS} FROM posts WHERE ${PUBLISHED} ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?`,
      params: [BLOG_PAGE_SIZE, (page - 1) * BLOG_PAGE_SIZE],
    },
    { sql: `SELECT COUNT(*) AS n FROM posts WHERE ${PUBLISHED}` },
  ]);
  const total = Number((count[0] as { n?: number } | undefined)?.n ?? 0);
  return toPaginated(
    (rows as unknown as RawPost[]).map(toPostCard),
    total,
    page,
    BLOG_PAGE_SIZE,
  );
}

/** The latest posts other than this one, for the end of a post. */
export async function getRelatedPosts(
  slug: string,
  limit = 3,
): Promise<PostCard[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.posts);
  const rows = await all<RawPost>(
    `SELECT ${POST_CARD_COLUMNS} FROM posts WHERE ${PUBLISHED} AND slug <> ? ORDER BY published_at DESC, id DESC LIMIT ?`,
    [slug, limit],
  );
  return rows.map(toPostCard);
}

export async function getPostSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.posts);
  const rows = await all<{ slug: string }>(
    `SELECT slug FROM posts WHERE ${PUBLISHED} ORDER BY published_at DESC`,
  );
  return rows.map((r) => r.slug);
}

export async function getPost(slug: string): Promise<PostDetail | null> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.post(slug), TAGS.posts);
  const r = await first<
    RawPost & Pick<PostRow, "website" | "play_store" | "app_store">
  >(
    `SELECT ${POST_CARD_COLUMNS}, content, website, play_store, app_store FROM posts WHERE ${PUBLISHED} AND slug = ?`,
    [slug],
  );
  return r
    ? {
        ...toPostCard(r),
        content: r.content ?? "",
        website: r.website ?? "",
        playStore: r.play_store ?? "",
        appStore: r.app_store ?? "",
      }
    : null;
}

export async function getOpenJobs(): Promise<JobDTO[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.jobs);
  // Newest first by default (a new position takes the lowest sort_order); the admin can move any of them up or down.
  const rows = await all<JobRow>(
    "SELECT * FROM jobs WHERE open = 1 ORDER BY sort_order ASC, created_at DESC",
  );
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    level: r.level ?? "",
    experience: r.experience ?? "",
    location: r.location ?? "",
    summary: r.summary ?? "",
    requirements: json<string[]>(r.requirements, []),
  }));
}

/** The text blocks of the Join Our Team page, as the admin wrote them: those above the positions table, then those below. */
export async function getCareersContent(): Promise<{
  top: LegalPageDTO[];
  bottom: LegalPageDTO[];
}> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.pages);
  const rows = await all<
    Pick<PageRow, "slug" | "title" | "content" | "section" | "updated_at">
  >(
    "SELECT slug, title, content, section, updated_at FROM pages WHERE section IN ('careers-top', 'careers-bottom') ORDER BY created_at ASC, id ASC",
  );
  const dto = (r: (typeof rows)[number]): LegalPageDTO => ({
    slug: r.slug,
    title: r.title,
    content: r.content ?? "",
    updatedAt: iso(r.updated_at) ?? "",
  });
  return {
    top: rows.filter((r) => r.section === "careers-top").map(dto),
    bottom: rows.filter((r) => r.section === "careers-bottom").map(dto),
  };
}

export async function getLegalPage(slug: string): Promise<LegalPageDTO | null> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.page(slug), TAGS.pages);
  const r = await first<
    Pick<PageRow, "slug" | "title" | "content" | "updated_at">
  >(
    "SELECT slug, title, content, updated_at FROM pages WHERE slug = ? AND section = 'legal'",
    [slug],
  );
  return r
    ? {
        slug: r.slug,
        title: r.title,
        content: r.content ?? "",
        updatedAt: iso(r.updated_at) ?? "",
      }
    : null;
}

export async function getLegalSlugs(): Promise<
  { slug: string; title: string }[]
> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.pages);
  return all<{ slug: string; title: string }>(
    "SELECT slug, title FROM pages WHERE section = 'legal' ORDER BY title",
  );
}
