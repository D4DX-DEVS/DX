/**
 * Seeds MongoDB with the content of the current d4dx.co site.
 *   npm run seed            add whatever is missing (safe to re-run)
 *   npm run seed -- --reset wipe content collections and uploaded media first
 * Run with the react-server condition (see package.json) so server-only modules load.
 */
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { mediaRoot } from "@/lib/env";
import { processImage } from "@/lib/media";
import { AdminUser, Category, Job, Page, Post, Project, Service, Settings, TeamMember, Testimonial } from "@/lib/models";
import type { MediaDoc } from "@/lib/models/shared";
import { excerptFrom, sanitizeRichText } from "@/lib/sanitize";
import { CATEGORIES, JOBS, PROJECTS, SERVICES, SETTINGS, TEAM, TESTIMONIALS } from "./seed-data";

const ASSETS = path.resolve(process.cwd(), "seed/assets");
const reset = process.argv.includes("--reset");

function out(message: string): void {
  process.stdout.write(`${message}\n`);
}

function decode(text: string): string {
  return text
    .replace(/&#0?38;|&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8216;|&lsquo;/g, "‘")
    .replace(/&#8220;|&ldquo;/g, "“")
    .replace(/&#8221;|&rdquo;/g, "”")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&#8230;|&hellip;/g, "…")
    .replace(/&nbsp;|&#160;/g, " ")
    .trim();
}

async function image(folder: string, file: string, alt: string): Promise<MediaDoc> {
  const buffer = await readFile(path.join(ASSETS, folder, file));
  return processImage(buffer, alt);
}

async function remoteImage(url: string, alt: string): Promise<MediaDoc | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (D4DX migration)" } });
    if (!res.ok) return null;
    return await processImage(Buffer.from(await res.arrayBuffer()), alt);
  } catch {
    return null;
  }
}

/** Re-hosts every <img> in WordPress HTML under /media and cleans the markup. */
async function migrateHtml(html: string): Promise<string> {
  let result = html;
  const sources = [...new Set([...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]))];
  for (const src of sources) {
    const altMatch = html.match(new RegExp(`<img[^>]+src="${src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*alt="([^"]*)"`));
    const media = await remoteImage(src, decode(altMatch?.[1] ?? ""));
    result = media ? result.split(src).join(media.url) : result;
  }
  return sanitizeRichText(result.replace(/\s(srcset|sizes)="[^"]*"/g, ""));
}

async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    out("skip admin: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set");
    return;
  }
  if (await AdminUser.exists({ email })) {
    out(`admin ${email} already exists`);
    return;
  }
  await AdminUser.create({
    name: process.env.SEED_ADMIN_NAME || "Admin",
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: "owner",
  });
  out(`admin created: ${email} (password from SEED_ADMIN_PASSWORD in .env.local)`);
}

async function seedCategories(): Promise<Map<string, mongoose.Types.ObjectId>> {
  for (const c of CATEGORIES) {
    await Category.updateOne({ slug: c.slug }, { $setOnInsert: c }, { upsert: true });
  }
  const rows = await Category.find({}, { slug: 1 }).lean();
  out(`categories: ${rows.length}`);
  return new Map(rows.map((r) => [r.slug, r._id]));
}

async function seedProjects(categories: Map<string, mongoose.Types.ObjectId>): Promise<void> {
  let added = 0;
  for (const [index, p] of PROJECTS.entries()) {
    if (await Project.exists({ slug: p.slug })) continue;
    const media = [];
    for (const [i, file] of p.images.entries()) {
      media.push(await image("projects", file, i === 0 ? `${p.title}, app screens` : `${p.title}, screen ${i + 1}`));
    }
    await Project.create({
      title: p.title,
      slug: p.slug,
      category: categories.get(p.category),
      client: p.client,
      date: p.date ? new Date(p.date) : null,
      summary: p.summary,
      body: sanitizeRichText(p.body),
      features: p.features,
      platforms: p.platforms,
      links: { playStore: p.links.playStore ?? "", appStore: p.links.appStore ?? "", website: p.links.website ?? "" },
      cover: media[0],
      gallery: media,
      featured: true,
      status: "published",
      order: index + 1,
    });
    added++;
  }
  out(`projects: ${added} added`);
}

async function seedTeam(): Promise<void> {
  if ((await TeamMember.estimatedDocumentCount()) > 0) return out("team: already seeded");
  for (const [index, m] of TEAM.entries()) {
    await TeamMember.create({
      name: m.name,
      role: m.role,
      photo: await image("team", m.photo, `Portrait of ${m.name}`),
      order: index + 1,
      published: true,
    });
  }
  out(`team: ${TEAM.length} added`);
}

async function seedSimple(): Promise<void> {
  if ((await Testimonial.estimatedDocumentCount()) === 0) {
    await Testimonial.insertMany(TESTIMONIALS.map((t, i) => ({ ...t, order: i + 1, published: true })));
    out(`testimonials: ${TESTIMONIALS.length} added`);
  }
  for (const [i, job] of JOBS.entries()) {
    await Job.updateOne({ slug: job.slug }, { $setOnInsert: { ...job, open: true, order: i + 1 } }, { upsert: true });
  }
  for (const [i, service] of SERVICES.entries()) {
    await Service.updateOne({ slug: service.slug }, { $setOnInsert: { ...service, published: true, order: i + 1 } }, { upsert: true });
  }
  await Settings.updateOne({ key: "site" }, { $setOnInsert: { key: "site", ...SETTINGS } }, { upsert: true });
  out("services, jobs and settings ready");
}

interface WpPost {
  slug: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: { source_url?: string }[];
    "wp:term"?: { name: string }[][];
  };
}

async function seedPosts(): Promise<void> {
  const posts = JSON.parse(await readFile(path.resolve("seed/wp-posts.json"), "utf8")) as WpPost[];
  let added = 0;
  for (const p of posts) {
    if (await Post.exists({ slug: p.slug })) continue;
    const title = decode(p.title.rendered);
    const coverFile = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url?.split("/").pop();
    const cover = coverFile ? await image("posts", coverFile, title).catch(() => null) : null;
    const content = await migrateHtml(p.content.rendered);
    await Post.create({
      title,
      slug: p.slug,
      excerpt: excerptFrom(p.excerpt.rendered || content, 220),
      content,
      cover,
      tags: (p._embedded?.["wp:term"]?.[0] ?? []).map((t) => decode(t.name)),
      status: "published",
      publishedAt: new Date(p.date),
    });
    added++;
  }
  out(`posts: ${added} added`);
}

interface WpPage {
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
}

async function seedPages(): Promise<void> {
  const pages = JSON.parse(await readFile(path.resolve("seed/wp-pages.json"), "utf8")) as WpPage[];
  for (const p of pages) {
    if (await Page.exists({ slug: p.slug })) continue;
    await Page.create({ slug: p.slug, title: decode(p.title.rendered), content: sanitizeRichText(p.content.rendered) });
  }
  out(`pages: ${pages.length} ready`);
}

async function main(): Promise<void> {
  await connectDB();
  if (reset) {
    for (const m of [Category, Project, Service, TeamMember, Testimonial, Post, Job, Page, Settings]) await m.deleteMany({});
    await rm(mediaRoot(), { recursive: true, force: true });
    out("reset: content and media removed");
  }
  await Promise.all([AdminUser.init(), Category.init(), Project.init(), Service.init(), Post.init(), Page.init(), Job.init()]);
  await seedAdmin();
  const categories = await seedCategories();
  await seedProjects(categories);
  await seedTeam();
  await seedSimple();
  await seedPosts();
  await seedPages();
  out("seed complete");
}

main()
  .catch((error: unknown) => {
    process.stderr.write(`seed failed: ${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
