import "server-only";
import type { PublishStatus } from "./shared";

export { PUBLISH_STATUSES } from "./shared";
export type { MediaDoc, PublishStatus } from "./shared";

/**
 * Row shapes of the D1 tables in db/schema.sql, exactly as SQLite returns them:
 * snake_case columns, booleans as 0/1, JSON columns as text (parse with json() from @/lib/db).
 */

type Bool = 0 | 1;
type Json = string;

interface Timestamps {
  created_at: string;
  updated_at: string;
}

export interface CategoryRow extends Timestamps {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
}

export const PLATFORMS = ["android", "ios", "web", "desktop"] as const;

export interface ProjectRow extends Timestamps {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  client: string;
  date: string | null;
  summary: string;
  body: string;
  features: Json;
  platforms: Json;
  links: Json;
  cover: Json;
  gallery: Json;
  featured: Bool;
  status: PublishStatus;
  sort_order: number;
}

export interface ProjectLinks {
  playStore?: string;
  appStore?: string;
  website?: string;
}

export interface ServiceRow extends Timestamps {
  id: string;
  title: string;
  slug: string;
  summary: string;
  proof: string;
  points: Json;
  proof_project_slug: string;
  published: Bool;
  sort_order: number;
}

export interface TeamMemberRow extends Timestamps {
  id: string;
  name: string;
  role: string;
  photo: Json | null;
  linkedin: string;
  published: Bool;
  sort_order: number;
}

export interface TestimonialRow extends Timestamps {
  id: string;
  quote: string;
  name: string;
  role: string;
  context: string;
  project_slug: string;
  published: Bool;
  sort_order: number;
}

export interface PostRow extends Timestamps {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover: Json | null;
  tags: Json;
  status: PublishStatus;
  published_at: string | null;
}

export interface JobRow extends Timestamps {
  id: string;
  title: string;
  slug: string;
  level: string;
  experience: string;
  location: string;
  summary: string;
  requirements: Json;
  open: Bool;
  sort_order: number;
}

export const INBOX_STATUSES = ["new", "read", "archived"] as const;
export type InboxStatus = (typeof INBOX_STATUSES)[number];

export interface InquiryRow extends Timestamps {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status: InboxStatus;
}

export interface ResumeDoc {
  file: string;
  name: string;
  size: number;
}

export interface ApplicationRow extends Timestamps {
  id: string;
  position: string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  portfolio_url: string;
  github_url: string;
  message: string;
  resume: Json;
  status: InboxStatus;
}

export interface PageRow extends Timestamps {
  id: string;
  slug: string;
  title: string;
  content: string;
}

export interface SettingsData {
  tagline?: string;
  email?: string;
  careersEmail?: string;
  phone?: string;
  careersPhone?: string;
  whatsapp?: string;
  addressLines?: string[];
  mapUrl?: string;
  socials?: { linkedin?: string; instagram?: string; facebook?: string };
}

export interface SettingsRow {
  key: string;
  data: Json;
  updated_at: string;
}

export const ADMIN_ROLES = ["owner", "editor"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export interface AdminUserRow extends Timestamps {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: AdminRole;
  token_version: number;
  last_login_at: string | null;
}
