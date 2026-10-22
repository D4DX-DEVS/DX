/**
 * One-time copy of the old MongoDB "d4dx" database into D1 (run `npm run db:setup` first).
 *   npm run migrate:mongo -- mongodb://127.0.0.1:27017/d4dx
 * Each D1 table is replaced by the Mongo collection with the same content: ids (ObjectId hex),
 * timestamps, password hashes and media links are kept as they are. Throttle counters are skipped.
 */
import { MongoClient, type Document } from "mongodb";
import { batch, type Statement } from "@/lib/db";

function out(message: string): void {
  process.stdout.write(`${message}\n`);
}

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : v == null ? fallback : String(v));
const num = (v: unknown, fallback = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === "boolean" ? v : fallback);
const date = (v: unknown): string | null => (v instanceof Date ? v.toISOString() : typeof v === "string" && v ? new Date(v).toISOString() : null);
const stamp = (v: unknown): string => date(v) ?? new Date().toISOString();
const id = (v: unknown): string => str(v);

function media(v: unknown): object | null {
  if (!v || typeof v !== "object" || !("url" in v)) return null;
  const m = v as Document;
  return { url: str(m.url), width: num(m.width, 1200), height: num(m.height, 900), blur: str(m.blur), alt: str(m.alt) };
}

const mediaList = (v: unknown): object[] => (Array.isArray(v) ? v.map(media).filter((m): m is object => m !== null) : []);
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => str(x)) : []);

interface TableMap {
  collection: string;
  table: string;
  columns: string[];
  row: (d: Document) => unknown[];
}

const TABLES: TableMap[] = [
  {
    collection: "categories",
    table: "categories",
    columns: ["id", "name", "slug", "description", "sort_order", "created_at", "updated_at"],
    row: (d) => [id(d._id), str(d.name), str(d.slug), str(d.description), num(d.order), stamp(d.createdAt), stamp(d.updatedAt)],
  },
  {
    collection: "projects",
    table: "projects",
    columns: ["id", "title", "slug", "category_id", "client", "date", "summary", "body", "features", "platforms", "links", "cover", "gallery", "featured", "status", "sort_order", "created_at", "updated_at"],
    row: (d) => [
      id(d._id), str(d.title), str(d.slug), id(d.category), str(d.client), date(d.date), str(d.summary), str(d.body),
      strings(d.features), strings(d.platforms),
      { playStore: str(d.links?.playStore), appStore: str(d.links?.appStore), website: str(d.links?.website) },
      media(d.cover), mediaList(d.gallery), bool(d.featured, false), d.status === "published" ? "published" : "draft",
      num(d.order), stamp(d.createdAt), stamp(d.updatedAt),
    ],
  },
  {
    collection: "services",
    table: "services",
    columns: ["id", "title", "slug", "summary", "proof", "points", "proof_project_slug", "published", "sort_order", "created_at", "updated_at"],
    row: (d) => [id(d._id), str(d.title), str(d.slug), str(d.summary), str(d.proof), strings(d.points), str(d.proofProjectSlug), bool(d.published, true), num(d.order), stamp(d.createdAt), stamp(d.updatedAt)],
  },
  {
    collection: "teammembers",
    table: "team_members",
    columns: ["id", "name", "role", "photo", "linkedin", "published", "sort_order", "created_at", "updated_at"],
    row: (d) => [id(d._id), str(d.name), str(d.role), media(d.photo), str(d.linkedin), bool(d.published, true), num(d.order), stamp(d.createdAt), stamp(d.updatedAt)],
  },
  {
    collection: "testimonials",
    table: "testimonials",
    columns: ["id", "quote", "name", "role", "context", "project_slug", "published", "sort_order", "created_at", "updated_at"],
    row: (d) => [id(d._id), str(d.quote), str(d.name), str(d.role), str(d.context), str(d.projectSlug), bool(d.published, true), num(d.order), stamp(d.createdAt), stamp(d.updatedAt)],
  },
  {
    collection: "posts",
    table: "posts",
    columns: ["id", "title", "slug", "excerpt", "content", "cover", "tags", "status", "published_at", "created_at", "updated_at"],
    row: (d) => [id(d._id), str(d.title), str(d.slug), str(d.excerpt), str(d.content), media(d.cover), strings(d.tags), d.status === "published" ? "published" : "draft", date(d.publishedAt), stamp(d.createdAt), stamp(d.updatedAt)],
  },
  {
    collection: "jobs",
    table: "jobs",
    columns: ["id", "title", "slug", "level", "experience", "location", "summary", "requirements", "open", "sort_order", "created_at", "updated_at"],
    row: (d) => [id(d._id), str(d.title), str(d.slug), str(d.level), str(d.experience), str(d.location, "Calicut, on site"), str(d.summary), strings(d.requirements), bool(d.open, true), num(d.order), stamp(d.createdAt), stamp(d.updatedAt)],
  },
  {
    collection: "inquiries",
    table: "inquiries",
    columns: ["id", "name", "email", "phone", "service", "message", "status", "created_at", "updated_at"],
    row: (d) => [id(d._id), str(d.name), str(d.email), str(d.phone), str(d.service), str(d.message), str(d.status, "new"), stamp(d.createdAt), stamp(d.updatedAt)],
  },
  {
    collection: "applications",
    table: "applications",
    columns: ["id", "position", "name", "email", "phone", "experience", "portfolio_url", "github_url", "message", "resume", "status", "created_at", "updated_at"],
    row: (d) => [
      id(d._id), str(d.position), str(d.name), str(d.email), str(d.phone), str(d.experience), str(d.portfolioUrl), str(d.githubUrl), str(d.message),
      { file: str(d.resume?.file), name: str(d.resume?.name), size: num(d.resume?.size) }, str(d.status, "new"), stamp(d.createdAt), stamp(d.updatedAt),
    ],
  },
  {
    collection: "pages",
    table: "pages",
    columns: ["id", "slug", "title", "content", "created_at", "updated_at"],
    row: (d) => [id(d._id), str(d.slug), str(d.title), str(d.content), stamp(d.createdAt), stamp(d.updatedAt)],
  },
  {
    collection: "settings",
    table: "settings",
    columns: ["key", "data", "updated_at"],
    row: (d) => {
      const data = Object.fromEntries(Object.entries(d).filter(([k]) => !["_id", "key", "createdAt", "updatedAt", "__v"].includes(k)));
      return [str(d.key, "site"), data, stamp(d.updatedAt)];
    },
  },
  {
    collection: "adminusers",
    table: "admin_users",
    columns: ["id", "name", "email", "password_hash", "role", "token_version", "last_login_at", "created_at", "updated_at"],
    row: (d) => [id(d._id), str(d.name), str(d.email).toLowerCase(), str(d.passwordHash), d.role === "owner" ? "owner" : "editor", num(d.tokenVersion), date(d.lastLoginAt), stamp(d.createdAt), stamp(d.updatedAt)],
  },
];

// Children are cleared before parents and filled after them (projects reference categories).
const DELETE_ORDER = ["projects", "categories", "services", "team_members", "testimonials", "posts", "jobs", "inquiries", "applications", "pages", "settings", "admin_users"];

async function main(): Promise<void> {
  const uri = process.argv[2];
  if (!uri) throw new Error("Usage: npm run migrate:mongo -- <mongodb uri with database>");
  const client = await MongoClient.connect(uri, { serverSelectionTimeoutMS: 10000 });
  try {
    const db = client.db();
    const inserts: Statement[] = [];
    const counts: string[] = [];
    for (const t of TABLES) {
      const docs = await db.collection(t.collection).find().toArray();
      counts.push(`${t.table}=${docs.length}`);
      const placeholders = t.columns.map(() => "?").join(", ");
      for (const d of docs) {
        inserts.push({ sql: `INSERT INTO ${t.table} (${t.columns.join(", ")}) VALUES (${placeholders})`, params: t.row(d) as Statement["params"] });
      }
    }
    // Clear and refill in one batch request so the tables are never left half-copied by a dropped connection.
    await batch([...DELETE_ORDER.map((table) => ({ sql: `DELETE FROM ${table}` })), ...inserts]);
    out(`migrated from ${db.databaseName}: ${counts.join(" ")}`);
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`mongo migration failed: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
