import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { all, batch, first, json } from "@/lib/db";
import type { JobRow, MediaDoc, PageRow, PostRow, ProjectLinks, ProjectRow, ServiceRow, SettingsData, TeamMemberRow, TestimonialRow } from "@/lib/models";
import { toPaginated, type Paginated } from "@/lib/listing";
import type {
  CategoryDTO,
  HeroWindow,
  JobDTO,
  LegalPageDTO,
  Media,
  PostCard,
  PostDetail,
  ProjectCard,
  ProjectDetail,
  ProjectIndexEntry,
  ProjectReel,
  ServiceDTO,
  SiteSettings,
  TeamMemberDTO,
  TestimonialDTO,
  Platform,
} from "@/lib/types";
import { iso, toMedia, toMediaList, yearOf } from "./mappers";
import { TAGS } from "./tags";

export const WORK_PAGE_SIZE = 12;
export const BLOG_PAGE_SIZE = 6;

const PUBLISHED = "status = 'published'";
const CARD_COLUMNS = "id, title, slug, client, date, category_id, cover";
// Nulls sort last on DESC in SQLite, matching the old Mongo order for undated projects.
const PROJECT_ORDER = "sort_order ASC, date DESC, id ASC";

const EMPTY_SETTINGS: SiteSettings = {
  tagline: "",
  email: "",
  careersEmail: "",
  phone: "",
  careersPhone: "",
  whatsapp: "",
  addressLines: [],
  mapUrl: "",
  socials: { linkedin: "", instagram: "", facebook: "" },
};

export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.settings);
  const row = await first<{ data: string }>("SELECT data FROM settings WHERE key = 'site'");
  if (!row) return EMPTY_SETTINGS;
  const doc = json<SettingsData>(row.data, {});
  return {
    tagline: doc.tagline ?? "",
    email: doc.email ?? "",
    careersEmail: doc.careersEmail ?? "",
    phone: doc.phone ?? "",
    careersPhone: doc.careersPhone ?? "",
    whatsapp: doc.whatsapp ?? "",
    addressLines: doc.addressLines ?? [],
    mapUrl: doc.mapUrl ?? "",
    socials: {
      linkedin: doc.socials?.linkedin ?? "",
      instagram: doc.socials?.instagram ?? "",
      facebook: doc.socials?.facebook ?? "",
    },
  };
}

/** Categories in admin order, each with its count of published projects. */
export async function getCategories(): Promise<CategoryDTO[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.categories, TAGS.projects);
  const rows = await all<{ id: string; name: string; slug: string; description: string; n: number }>(
    `SELECT c.id, c.name, c.slug, c.description, COUNT(p.id) AS n
       FROM categories c LEFT JOIN projects p ON p.category_id = c.id AND p.${PUBLISHED}
      GROUP BY c.id ORDER BY c.sort_order, c.name`,
  );
  return rows.map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description ?? "", count: c.n }));
}

type RawCard = Pick<ProjectRow, "id" | "title" | "slug" | "client" | "date" | "category_id" | "cover">;

function toCard(raw: RawCard, categories: Map<string, CategoryDTO>): ProjectCard | null {
  const cover = toMedia(json<MediaDoc | null>(raw.cover, null));
  if (!cover) return null;
  const category = categories.get(raw.category_id);
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    client: raw.client ?? "",
    year: yearOf(raw.date),
    category: category ? { name: category.name, slug: category.slug } : { name: "Work", slug: "" },
    cover,
  };
}

function gallery(text: string | null | undefined): Media[] {
  return toMediaList(json<MediaDoc[]>(text, []));
}

async function categoryMap(): Promise<Map<string, CategoryDTO>> {
  const categories = await getCategories();
  return new Map(categories.map((c) => [c.id, c]));
}

export async function getFeaturedProjects(limit = 12): Promise<ProjectCard[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.projects, TAGS.categories);
  const [cats, rows] = await Promise.all([
    categoryMap(),
    all<RawCard>(`SELECT ${CARD_COLUMNS} FROM projects WHERE ${PUBLISHED} AND featured = 1 ORDER BY ${PROJECT_ORDER} LIMIT ?`, [limit]),
  ]);
  return rows.map((r) => toCard(r, cats)).filter((c): c is ProjectCard => c !== null);
}

/** Featured projects with a few screens each, played as a reel on the home page. */
export async function getProjectReels(limit = 9): Promise<ProjectReel[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.projects, TAGS.categories);
  const [cats, rows] = await Promise.all([
    categoryMap(),
    all<RawCard & { gallery: string }>(
      `SELECT ${CARD_COLUMNS}, gallery FROM projects WHERE ${PUBLISHED} AND featured = 1 ORDER BY ${PROJECT_ORDER} LIMIT ?`,
      [limit],
    ),
  ]);
  return rows.flatMap((r) => {
    const card = toCard(r, cats);
    if (!card) return [];
    // The cover is often also the first gallery picture: each screen plays once.
    const frames = [card.cover, ...gallery(r.gallery).slice(0, 4)].filter((m, i, list) => list.findIndex((x) => x.url === m.url) === i);
    return [{ ...card, frames }];
  });
}

export interface WorkPage extends Paginated<ProjectCard> {
  category: CategoryDTO | null;
}

/** One page of the work index, optionally inside one category. Server-side paginated. */
export async function getWorkPage(categorySlug: string | null, page: number): Promise<WorkPage> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.projects, TAGS.categories);
  const categories = await getCategories();
  const category = categorySlug ? categories.find((c) => c.slug === categorySlug) ?? null : null;
  if (categorySlug && !category) return { ...toPaginated([], 0, 1, WORK_PAGE_SIZE), category: null };

  const where = category ? `${PUBLISHED} AND category_id = ?` : PUBLISHED;
  const params = category ? [category.id] : [];
  const [rows, count] = await batch([
    {
      sql: `SELECT ${CARD_COLUMNS} FROM projects WHERE ${where} ORDER BY ${PROJECT_ORDER} LIMIT ? OFFSET ?`,
      params: [...params, WORK_PAGE_SIZE, (page - 1) * WORK_PAGE_SIZE],
    },
    { sql: `SELECT COUNT(*) AS n FROM projects WHERE ${where}`, params },
  ]);
  const cats = new Map(categories.map((c) => [c.id, c]));
  const data = (rows as unknown as RawCard[]).map((r) => toCard(r, cats)).filter((c): c is ProjectCard => c !== null);
  const total = Number((count[0] as { n?: number } | undefined)?.n ?? 0);
  return { ...toPaginated(data, total, page, WORK_PAGE_SIZE), category };
}

/** Ordered list of every published project: feeds static params and next/previous links. */
export async function getProjectIndex(): Promise<ProjectIndexEntry[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.projects);
  const rows = await all<Pick<ProjectRow, "slug" | "title" | "cover" | "gallery" | "links" | "platforms" | "date">>(
    `SELECT slug, title, cover, gallery, links, platforms, date FROM projects WHERE ${PUBLISHED} ORDER BY ${PROJECT_ORDER}`,
  );
  return rows.flatMap((r) => {
    const cover = toMedia(json<MediaDoc | null>(r.cover, null));
    if (!cover) return [];
    // Only the last two gallery pictures: enough to tell a real screen from the cover's copy.
    const shots = gallery(r.gallery).slice(-2);
    const links = json<ProjectLinks>(r.links, {});
    return [
      {
        slug: r.slug,
        title: r.title,
        cover,
        shot: shots.length > 1 ? shots[shots.length - 1] : null,
        website: links.website ?? "",
        onStores: Boolean(links.playStore || links.appStore),
        platforms: json<Platform[]>(r.platforms, []),
        year: yearOf(r.date),
      },
    ];
  });
}

export async function getProject(slug: string): Promise<ProjectDetail | null> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.project(slug), TAGS.projects);
  const [cats, raw] = await Promise.all([
    categoryMap(),
    first<ProjectRow>(`SELECT * FROM projects WHERE ${PUBLISHED} AND slug = ?`, [slug]),
  ]);
  if (!raw) return null;
  const card = toCard(raw, cats);
  if (!card) return null;
  const links = json<ProjectLinks>(raw.links, {});
  return {
    ...card,
    summary: raw.summary ?? "",
    body: raw.body ?? "",
    features: json<string[]>(raw.features, []),
    platforms: json<Platform[]>(raw.platforms, []),
    links: {
      playStore: links.playStore ?? "",
      appStore: links.appStore ?? "",
      website: links.website ?? "",
    },
    gallery: gallery(raw.gallery),
    date: iso(raw.date),
  };
}

/** Screens for the three windows of the mark in the hero, grouped by category order. */
export async function getHeroWindows(): Promise<HeroWindow[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.projects, TAGS.categories);
  const [categories, rows] = await Promise.all([
    getCategories(),
    all<Pick<ProjectRow, "title" | "slug" | "category_id" | "cover">>(
      `SELECT title, slug, category_id, cover FROM projects WHERE ${PUBLISHED} ORDER BY featured DESC, sort_order ASC, date DESC LIMIT 24`,
    ),
  ]);
  const byId = new Map(categories.map((c) => [c.id, c]));
  type Slide = HeroWindow["slides"][number];
  const pools = new Map<string, Slide[]>();
  for (const r of rows) {
    const image: Media | null = toMedia(json<MediaDoc | null>(r.cover, null));
    if (!image) continue;
    const key = r.category_id;
    const cat = byId.get(key);
    const slide: Slide = { title: r.title, slug: r.slug, category: cat?.name ?? "Work", categorySlug: cat?.slug ?? "", image };
    pools.set(key, [...(pools.get(key) ?? []), slide]);
  }
  const ordered = categories.map((c) => pools.get(c.id) ?? []).filter((p) => p.length > 0);
  const everything = ordered.flat();
  const pick = (pool: Slide[] | undefined, offset: number): Slide[] => {
    const source = pool && pool.length > 0 ? pool : everything;
    const rotated = [...source.slice(offset % Math.max(source.length, 1)), ...source.slice(0, offset % Math.max(source.length, 1))];
    return rotated.slice(0, 4);
  };
  // The tall window takes the largest pool (phone screens), the two others the next pools.
  const bySize = [...ordered].sort((a, b) => b.length - a.length);
  return [
    { key: "tall", slides: pick(bySize[0], 0) },
    { key: "top", slides: pick(bySize[1], 1) },
    { key: "bottom", slides: pick(bySize[2] ?? bySize[0], 2) },
  ];
}

export async function getServices(): Promise<ServiceDTO[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.services, TAGS.projects);
  const [rows, index] = await Promise.all([
    all<Pick<ServiceRow, "id" | "title" | "slug" | "summary" | "proof" | "points" | "proof_project_slug">>(
      "SELECT id, title, slug, summary, proof, points, proof_project_slug FROM services WHERE published = 1 ORDER BY sort_order",
    ),
    getProjectIndex(),
  ]);
  const bySlug = new Map(index.map((p) => [p.slug, p]));
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    summary: r.summary,
    proof: r.proof ?? "",
    points: json<string[]>(r.points, []),
    proofProject: bySlug.get(r.proof_project_slug ?? "") ?? null,
  }));
}

export async function getTeam(): Promise<TeamMemberDTO[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.team);
  const rows = await all<Pick<TeamMemberRow, "id" | "name" | "role" | "photo" | "linkedin">>(
    "SELECT id, name, role, photo, linkedin FROM team_members WHERE published = 1 ORDER BY sort_order, created_at",
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    photo: toMedia(json<MediaDoc | null>(r.photo, null)),
    linkedin: r.linkedin ?? "",
  }));
}

export async function getTestimonials(): Promise<TestimonialDTO[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.testimonials);
  const rows = await all<Pick<TestimonialRow, "id" | "quote" | "name" | "role" | "context" | "project_slug">>(
    "SELECT id, quote, name, role, context, project_slug FROM testimonials WHERE published = 1 ORDER BY sort_order LIMIT 6",
  );
  return rows.map((r) => ({
    id: r.id,
    quote: r.quote,
    name: r.name,
    role: r.role ?? "",
    context: r.context ?? "",
    projectSlug: r.project_slug ?? "",
  }));
}

/** Distinct clients across published work (the studio itself excluded), newest first. */
export async function getClients(): Promise<{ client: string; project: string; slug: string }[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.projects);
  const rows = await all<Pick<ProjectRow, "client" | "title" | "slug">>(
    `SELECT client, title, slug FROM projects WHERE ${PUBLISHED} AND client NOT IN ('', 'D4DX') ORDER BY date DESC`,
  );
  const seen = new Set<string>();
  return rows
    .filter((r) => (seen.has(r.client) ? false : (seen.add(r.client), true)))
    .map((r) => ({ client: r.client, project: r.title, slug: r.slug }));
}

const POST_CARD_COLUMNS = "id, title, slug, excerpt, cover, tags, published_at";

type RawPost = Pick<PostRow, "id" | "title" | "slug" | "excerpt" | "cover" | "tags" | "published_at"> & { content?: string };

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
  return toPaginated((rows as unknown as RawPost[]).map(toPostCard), total, page, BLOG_PAGE_SIZE);
}

export async function getPostSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.posts);
  const rows = await all<{ slug: string }>(`SELECT slug FROM posts WHERE ${PUBLISHED} ORDER BY published_at DESC`);
  return rows.map((r) => r.slug);
}

export async function getPost(slug: string): Promise<PostDetail | null> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.post(slug), TAGS.posts);
  const r = await first<RawPost>(`SELECT ${POST_CARD_COLUMNS}, content FROM posts WHERE ${PUBLISHED} AND slug = ?`, [slug]);
  return r ? { ...toPostCard(r), content: r.content ?? "" } : null;
}

export async function getOpenJobs(): Promise<JobDTO[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.jobs);
  const rows = await all<JobRow>("SELECT * FROM jobs WHERE open = 1 ORDER BY sort_order");
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

export async function getLegalPage(slug: string): Promise<LegalPageDTO | null> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.page(slug), TAGS.pages);
  const r = await first<Pick<PageRow, "slug" | "title" | "content" | "updated_at">>(
    "SELECT slug, title, content, updated_at FROM pages WHERE slug = ?",
    [slug],
  );
  return r ? { slug: r.slug, title: r.title, content: r.content ?? "", updatedAt: iso(r.updated_at) ?? "" } : null;
}

export async function getLegalSlugs(): Promise<{ slug: string; title: string }[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.pages);
  return all<{ slug: string; title: string }>("SELECT slug, title FROM pages ORDER BY title");
}
