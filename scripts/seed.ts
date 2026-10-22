/**
 * Seeds the D1 database with the content of the current d4dx.co site (run `npm run db:setup` first).
 *   npm run seed            add whatever is missing (safe to re-run)
 *   npm run seed -- --reset wipe content tables and uploaded media first
 * Run with the react-server condition (see package.json) so server-only modules load.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { all, batch, first, newId, nowIso, run, type Statement } from "@/lib/db";
import { processImage } from "@/lib/media";
import { deletePrefix } from "@/lib/storage";
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

/** Re-hosts every <img> in WordPress HTML in R2 and cleans the markup. */
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

async function exists(table: string, slug: string): Promise<boolean> {
  return (await first(`SELECT 1 AS x FROM ${table} WHERE slug = ?`, [slug])) !== null;
}

async function count(table: string): Promise<number> {
  return (await first<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))?.n ?? 0;
}

async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    out("skip admin: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set");
    return;
  }
  if (await first("SELECT 1 AS x FROM admin_users WHERE email = ?", [email])) {
    out(`admin ${email} already exists`);
    return;
  }
  const now = nowIso();
  await run(
    "INSERT INTO admin_users (id, name, email, password_hash, role, token_version, created_at, updated_at) VALUES (?, ?, ?, ?, 'owner', 0, ?, ?)",
    [newId(), process.env.SEED_ADMIN_NAME || "Admin", email, await bcrypt.hash(password, 12), now, now],
  );
  out(`admin created: ${email} (password from SEED_ADMIN_PASSWORD)`);
}

async function seedCategories(): Promise<Map<string, string>> {
  const now = nowIso();
  await batch(
    CATEGORIES.map((c) => ({
      sql: `INSERT INTO categories (id, name, slug, description, sort_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (slug) DO NOTHING`,
      params: [newId(), c.name, c.slug, c.description, c.order, now, now],
    })),
  );
  const rows = await all<{ id: string; slug: string }>("SELECT id, slug FROM categories");
  out(`categories: ${rows.length}`);
  return new Map(rows.map((r) => [r.slug, r.id]));
}

async function seedProjects(categories: Map<string, string>): Promise<void> {
  let added = 0;
  for (const [index, p] of PROJECTS.entries()) {
    if (await exists("projects", p.slug)) continue;
    const media = [];
    for (const [i, file] of p.images.entries()) {
      media.push(await image("projects", file, i === 0 ? `${p.title}, app screens` : `${p.title}, screen ${i + 1}`));
    }
    const now = nowIso();
    await run(
      `INSERT INTO projects (id, title, slug, category_id, client, date, summary, body, features, platforms, links,
                             cover, gallery, featured, status, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'published', ?, ?, ?)`,
      [
        newId(),
        p.title,
        p.slug,
        categories.get(p.category),
        p.client,
        p.date ? new Date(p.date) : null,
        p.summary,
        sanitizeRichText(p.body),
        p.features,
        p.platforms,
        { playStore: p.links.playStore ?? "", appStore: p.links.appStore ?? "", website: p.links.website ?? "" },
        media[0],
        media,
        index + 1,
        now,
        now,
      ],
    );
    added++;
  }
  out(`projects: ${added} added`);
}

async function seedTeam(): Promise<void> {
  if ((await count("team_members")) > 0) return out("team: already seeded");
  for (const [index, m] of TEAM.entries()) {
    const now = nowIso();
    await run(
      "INSERT INTO team_members (id, name, role, photo, linkedin, published, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, '', 1, ?, ?, ?)",
      [newId(), m.name, m.role, await image("team", m.photo, `Portrait of ${m.name}`), index + 1, now, now],
    );
  }
  out(`team: ${TEAM.length} added`);
}

async function seedSimple(): Promise<void> {
  const now = nowIso();
  const statements: Statement[] = [];
  if ((await count("testimonials")) === 0) {
    for (const [i, t] of TESTIMONIALS.entries()) {
      statements.push({
        sql: `INSERT INTO testimonials (id, quote, name, role, context, project_slug, published, sort_order, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        params: [newId(), t.quote, t.name, t.role, t.context, t.projectSlug, i + 1, now, now],
      });
    }
  }
  for (const [i, job] of JOBS.entries()) {
    statements.push({
      sql: `INSERT INTO jobs (id, title, slug, level, experience, location, summary, requirements, open, sort_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?) ON CONFLICT (slug) DO NOTHING`,
      params: [newId(), job.title, job.slug, job.level, job.experience, job.location, job.summary, job.requirements, i + 1, now, now],
    });
  }
  for (const [i, s] of SERVICES.entries()) {
    statements.push({
      sql: `INSERT INTO services (id, title, slug, summary, proof, points, proof_project_slug, published, sort_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?) ON CONFLICT (slug) DO NOTHING`,
      params: [newId(), s.title, s.slug, s.summary, s.proof, s.points, s.proofProjectSlug, i + 1, now, now],
    });
  }
  statements.push({ sql: "INSERT INTO settings (key, data, updated_at) VALUES ('site', ?, ?) ON CONFLICT (key) DO NOTHING", params: [SETTINGS, now] });
  await batch(statements);
  out("testimonials, services, jobs and settings ready");
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
    if (await exists("posts", p.slug)) continue;
    const title = decode(p.title.rendered);
    const coverFile = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url?.split("/").pop();
    const cover = coverFile ? await image("posts", coverFile, title).catch(() => null) : null;
    const content = await migrateHtml(p.content.rendered);
    const now = nowIso();
    await run(
      `INSERT INTO posts (id, title, slug, excerpt, content, cover, tags, status, published_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?)`,
      [
        newId(),
        title,
        p.slug,
        excerptFrom(p.excerpt.rendered || content, 220),
        content,
        cover,
        (p._embedded?.["wp:term"]?.[0] ?? []).map((t) => decode(t.name)),
        new Date(p.date),
        now,
        now,
      ],
    );
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
  const now = nowIso();
  await batch(
    pages.map((p) => ({
      sql: "INSERT INTO pages (id, slug, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (slug) DO NOTHING",
      params: [newId(), p.slug, decode(p.title.rendered), sanitizeRichText(p.content.rendered), now, now],
    })),
  );
  out(`pages: ${pages.length} ready`);
}

// Children before parents (projects reference categories).
const CONTENT_TABLES = ["projects", "categories", "services", "team_members", "testimonials", "posts", "jobs", "pages", "settings"];

async function main(): Promise<void> {
  if (reset) {
    await batch(CONTENT_TABLES.map((t) => ({ sql: `DELETE FROM ${t}` })));
    await deletePrefix("public", "media/");
    out("reset: content and media removed");
  }
  await seedAdmin();
  const categories = await seedCategories();
  await seedProjects(categories);
  await seedTeam();
  await seedSimple();
  await seedPosts();
  await seedPages();
  out("seed complete");
}

main().catch((error: unknown) => {
  process.stderr.write(`seed failed: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
