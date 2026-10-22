import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connectDB } from "@/lib/db";
import { Category, Job, Page, Post, Project, Service, Settings, TeamMember, Testimonial } from "@/lib/models";
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
import { id, iso, toMedia, toMediaList, yearOf } from "./mappers";
import { TAGS } from "./tags";

export const WORK_PAGE_SIZE = 12;
export const BLOG_PAGE_SIZE = 6;

const PUBLISHED = { status: "published" } as const;
const CARD_FIELDS = { title: 1, slug: 1, client: 1, date: 1, category: 1, cover: 1 } as const;

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
  await connectDB();
  const doc = await Settings.findOne({ key: "site" }, { _id: 0, key: 0, createdAt: 0, updatedAt: 0, __v: 0 }).lean();
  if (!doc) return EMPTY_SETTINGS;
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
  await connectDB();
  const [categories, counts] = await Promise.all([
    Category.find({}, { name: 1, slug: 1, description: 1 }).sort({ order: 1, name: 1 }).lean(),
    Project.aggregate<{ _id: unknown; n: number }>([
      { $match: PUBLISHED },
      { $group: { _id: "$category", n: { $sum: 1 } } },
    ]),
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.n]));
  return categories.map((c) => ({
    id: id(c._id),
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    count: byId.get(String(c._id)) ?? 0,
  }));
}

interface RawCard {
  _id: unknown;
  title: string;
  slug: string;
  client?: string | null;
  date?: Date | null;
  category: unknown;
  cover: Parameters<typeof toMedia>[0];
}

function toCard(raw: RawCard, categories: Map<string, CategoryDTO>): ProjectCard | null {
  const cover = toMedia(raw.cover);
  if (!cover) return null;
  const category = categories.get(String(raw.category));
  return {
    id: String(raw._id),
    title: raw.title,
    slug: raw.slug,
    client: raw.client ?? "",
    year: yearOf(raw.date),
    category: category ? { name: category.name, slug: category.slug } : { name: "Work", slug: "" },
    cover,
  };
}

async function categoryMap(): Promise<Map<string, CategoryDTO>> {
  const categories = await getCategories();
  return new Map(categories.map((c) => [c.id, c]));
}

export async function getFeaturedProjects(limit = 12): Promise<ProjectCard[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.projects, TAGS.categories);
  await connectDB();
  const [cats, rows] = await Promise.all([
    categoryMap(),
    Project.find({ ...PUBLISHED, featured: true }, CARD_FIELDS).sort({ order: 1, date: -1 }).limit(limit).lean<RawCard[]>(),
  ]);
  return rows.map((r) => toCard(r, cats)).filter((c): c is ProjectCard => c !== null);
}

/** Featured projects with a few screens each, played as a reel on the home page. */
export async function getProjectReels(limit = 9): Promise<ProjectReel[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.projects, TAGS.categories);
  await connectDB();
  const [cats, rows] = await Promise.all([
    categoryMap(),
    Project.find({ ...PUBLISHED, featured: true }, { ...CARD_FIELDS, gallery: { $slice: 4 } })
      .sort({ order: 1, date: -1 })
      .limit(limit)
      .lean<(RawCard & { gallery?: Parameters<typeof toMediaList>[0] })[]>(),
  ]);
  return rows.flatMap((r) => {
    const card = toCard(r, cats);
    if (!card) return [];
    // The cover is often also the first gallery picture: each screen plays once.
    const frames = [card.cover, ...toMediaList(r.gallery)].filter((m, i, all) => all.findIndex((x) => x.url === m.url) === i);
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
  await connectDB();
  const categories = await getCategories();
  const category = categorySlug ? categories.find((c) => c.slug === categorySlug) ?? null : null;
  if (categorySlug && !category) return { ...toPaginated([], 0, 1, WORK_PAGE_SIZE), category: null };

  const filter = category ? { ...PUBLISHED, category: category.id } : PUBLISHED;
  const [rows, total] = await Promise.all([
    Project.find(filter, CARD_FIELDS)
      .sort({ order: 1, date: -1, _id: 1 })
      .skip((page - 1) * WORK_PAGE_SIZE)
      .limit(WORK_PAGE_SIZE)
      .lean<RawCard[]>(),
    Project.countDocuments(filter),
  ]);
  const cats = new Map(categories.map((c) => [c.id, c]));
  const data = rows.map((r) => toCard(r, cats)).filter((c): c is ProjectCard => c !== null);
  return { ...toPaginated(data, total, page, WORK_PAGE_SIZE), category };
}

/** Ordered list of every published project: feeds static params and next/previous links. */
export async function getProjectIndex(): Promise<ProjectIndexEntry[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.projects);
  await connectDB();
  // Only the last two gallery pictures: enough to tell a real screen from the cover's copy.
  const rows = await Project.find(PUBLISHED, { slug: 1, title: 1, cover: 1, gallery: 1, links: 1, platforms: 1, date: 1 })
    .slice("gallery", -2)
    .sort({ order: 1, date: -1, _id: 1 })
    .lean();
  return rows.flatMap((r) => {
    const cover = toMedia(r.cover);
    if (!cover) return [];
    const gallery = toMediaList(r.gallery);
    const links = r.links ?? {};
    return [
      {
        slug: r.slug,
        title: r.title,
        cover,
        shot: gallery.length > 1 ? gallery[gallery.length - 1] : null,
        website: links.website ?? "",
        onStores: Boolean(links.playStore || links.appStore),
        platforms: (r.platforms ?? []) as Platform[],
        year: yearOf(r.date),
      },
    ];
  });
}

export async function getProject(slug: string): Promise<ProjectDetail | null> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.project(slug), TAGS.projects);
  await connectDB();
  const [cats, raw] = await Promise.all([
    categoryMap(),
    Project.findOne({ ...PUBLISHED, slug }, { order: 0, featured: 0, status: 0, createdAt: 0, updatedAt: 0, __v: 0 }).lean(),
  ]);
  if (!raw) return null;
  const card = toCard(raw as unknown as RawCard, cats);
  if (!card) return null;
  return {
    ...card,
    summary: raw.summary ?? "",
    body: raw.body ?? "",
    features: raw.features ?? [],
    platforms: (raw.platforms ?? []) as Platform[],
    links: {
      playStore: raw.links?.playStore ?? "",
      appStore: raw.links?.appStore ?? "",
      website: raw.links?.website ?? "",
    },
    gallery: toMediaList(raw.gallery),
    date: iso(raw.date),
  };
}

/** Screens for the three windows of the mark in the hero, grouped by category order. */
export async function getHeroWindows(): Promise<HeroWindow[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.projects, TAGS.categories);
  await connectDB();
  const [categories, rows] = await Promise.all([
    getCategories(),
    Project.find(PUBLISHED, { title: 1, slug: 1, category: 1, cover: 1, gallery: { $slice: 1 } })
      .sort({ featured: -1, order: 1, date: -1 })
      .limit(24)
      .lean(),
  ]);
  const byId = new Map(categories.map((c) => [c.id, c]));
  type Slide = HeroWindow["slides"][number];
  const pools = new Map<string, Slide[]>();
  for (const r of rows) {
    const image: Media | null = toMedia(r.cover);
    if (!image) continue;
    const key = String(r.category);
    const cat = byId.get(key);
    const slide: Slide = { title: r.title, slug: r.slug, category: cat?.name ?? "Work", categorySlug: cat?.slug ?? "", image };
    pools.set(key, [...(pools.get(key) ?? []), slide]);
  }
  const ordered = categories.map((c) => pools.get(c.id) ?? []).filter((p) => p.length > 0);
  const all = ordered.flat();
  const pick = (pool: Slide[] | undefined, offset: number): Slide[] => {
    const source = pool && pool.length > 0 ? pool : all;
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
  await connectDB();
  const [rows, index] = await Promise.all([
    Service.find({ published: true }, { title: 1, slug: 1, summary: 1, proof: 1, points: 1, proofProjectSlug: 1 }).sort({ order: 1 }).lean(),
    getProjectIndex(),
  ]);
  const bySlug = new Map(index.map((p) => [p.slug, p]));
  return rows.map((r) => ({
    id: id(r._id),
    title: r.title,
    slug: r.slug,
    summary: r.summary,
    proof: r.proof ?? "",
    points: r.points ?? [],
    proofProject: bySlug.get(r.proofProjectSlug ?? "") ?? null,
  }));
}

export async function getTeam(): Promise<TeamMemberDTO[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.team);
  await connectDB();
  const rows = await TeamMember.find({ published: true }, { name: 1, role: 1, photo: 1, linkedin: 1 }).sort({ order: 1, createdAt: 1 }).lean();
  return rows.map((r) => ({ id: id(r._id), name: r.name, role: r.role, photo: toMedia(r.photo), linkedin: r.linkedin ?? "" }));
}

export async function getTestimonials(): Promise<TestimonialDTO[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.testimonials);
  await connectDB();
  const rows = await Testimonial.find({ published: true }, { quote: 1, name: 1, role: 1, context: 1, projectSlug: 1 }).sort({ order: 1 }).limit(6).lean();
  return rows.map((r) => ({
    id: id(r._id),
    quote: r.quote,
    name: r.name,
    role: r.role ?? "",
    context: r.context ?? "",
    projectSlug: r.projectSlug ?? "",
  }));
}

/** Distinct clients across published work (the studio itself excluded), newest first. */
export async function getClients(): Promise<{ client: string; project: string; slug: string }[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.projects);
  await connectDB();
  const rows = await Project.find({ ...PUBLISHED, client: { $nin: ["", "D4DX"] } }, { client: 1, title: 1, slug: 1 })
    .sort({ date: -1 })
    .lean();
  const seen = new Set<string>();
  return rows
    .filter((r) => (seen.has(r.client ?? "") ? false : (seen.add(r.client ?? ""), true)))
    .map((r) => ({ client: r.client ?? "", project: r.title, slug: r.slug }));
}

const POST_CARD_FIELDS = { title: 1, slug: 1, excerpt: 1, cover: 1, tags: 1, publishedAt: 1 } as const;

interface RawPost {
  _id: unknown;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover?: Parameters<typeof toMedia>[0];
  tags?: string[] | null;
  publishedAt?: Date | null;
  content?: string | null;
}

function toPostCard(r: RawPost): PostCard {
  return {
    id: String(r._id),
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt ?? "",
    cover: toMedia(r.cover),
    tags: r.tags ?? [],
    publishedAt: iso(r.publishedAt),
  };
}

export async function getPostsPage(page: number): Promise<Paginated<PostCard>> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.posts);
  await connectDB();
  const [rows, total] = await Promise.all([
    Post.find(PUBLISHED, POST_CARD_FIELDS)
      .sort({ publishedAt: -1, _id: -1 })
      .skip((page - 1) * BLOG_PAGE_SIZE)
      .limit(BLOG_PAGE_SIZE)
      .lean<RawPost[]>(),
    Post.countDocuments(PUBLISHED),
  ]);
  return toPaginated(rows.map(toPostCard), total, page, BLOG_PAGE_SIZE);
}

export async function getPostSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.posts);
  await connectDB();
  const rows = await Post.find(PUBLISHED, { slug: 1 }).sort({ publishedAt: -1 }).lean();
  return rows.map((r) => r.slug);
}

export async function getPost(slug: string): Promise<PostDetail | null> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.post(slug), TAGS.posts);
  await connectDB();
  const r = await Post.findOne({ ...PUBLISHED, slug }, { ...POST_CARD_FIELDS, content: 1 }).lean<RawPost>();
  return r ? { ...toPostCard(r), content: r.content ?? "" } : null;
}

export async function getOpenJobs(): Promise<JobDTO[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.jobs);
  await connectDB();
  const rows = await Job.find({ open: true }, { open: 0, order: 0, createdAt: 0, updatedAt: 0, __v: 0 }).sort({ order: 1 }).lean();
  return rows.map((r) => ({
    id: id(r._id),
    title: r.title,
    slug: r.slug,
    level: r.level ?? "",
    experience: r.experience ?? "",
    location: r.location ?? "",
    summary: r.summary ?? "",
    requirements: r.requirements ?? [],
  }));
}

export async function getLegalPage(slug: string): Promise<LegalPageDTO | null> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.page(slug), TAGS.pages);
  await connectDB();
  const r = await Page.findOne({ slug }, { slug: 1, title: 1, content: 1, updatedAt: 1 }).lean();
  return r ? { slug: r.slug, title: r.title, content: r.content ?? "", updatedAt: iso(r.updatedAt) ?? "" } : null;
}

export async function getLegalSlugs(): Promise<{ slug: string; title: string }[]> {
  "use cache";
  cacheLife("content");
  cacheTag(TAGS.pages);
  await connectDB();
  const rows = await Page.find({}, { slug: 1, title: 1 }).sort({ title: 1 }).lean();
  return rows.map((r) => ({ slug: r.slug, title: r.title }));
}
