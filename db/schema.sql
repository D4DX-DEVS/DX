-- Cloudflare D1 (SQLite) schema. Applied by `npm run db:setup`; every statement is idempotent.
-- Conventions: ids are UUID text, timestamps ISO-8601 UTC text, booleans 0/1,
-- lists and nested objects (media, links, résumé) JSON text.

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) <= 60),
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 300),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS categories_order ON categories (sort_order, name);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) <= 120),
  slug TEXT NOT NULL UNIQUE,
  category_id TEXT NOT NULL REFERENCES categories (id),
  client TEXT NOT NULL DEFAULT '' CHECK (length(client) <= 120),
  date TEXT,
  summary TEXT NOT NULL DEFAULT '' CHECK (length(summary) <= 320),
  body TEXT NOT NULL DEFAULT '',
  features TEXT NOT NULL DEFAULT '[]',
  platforms TEXT NOT NULL DEFAULT '[]',
  links TEXT NOT NULL DEFAULT '{}',
  cover TEXT NOT NULL,
  gallery TEXT NOT NULL DEFAULT '[]',
  featured INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS projects_listing ON projects (status, category_id, sort_order, date DESC);
CREATE INDEX IF NOT EXISTS projects_featured ON projects (status, featured, sort_order);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) <= 80),
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL CHECK (length(summary) <= 400),
  proof TEXT NOT NULL DEFAULT '' CHECK (length(proof) <= 300),
  points TEXT NOT NULL DEFAULT '[]',
  proof_project_slug TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS services_listing ON services (published, sort_order);

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) <= 80),
  role TEXT NOT NULL CHECK (length(role) <= 80),
  photo TEXT,
  linkedin TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS team_listing ON team_members (published, sort_order);

CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY,
  quote TEXT NOT NULL CHECK (length(quote) <= 400),
  name TEXT NOT NULL CHECK (length(name) <= 80),
  role TEXT NOT NULL DEFAULT '' CHECK (length(role) <= 120),
  context TEXT NOT NULL DEFAULT '' CHECK (length(context) <= 160),
  project_slug TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS testimonials_listing ON testimonials (published, sort_order);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) <= 160),
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '' CHECK (length(excerpt) <= 320),
  content TEXT NOT NULL DEFAULT '',
  cover TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS posts_listing ON posts (status, published_at DESC);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) <= 100),
  slug TEXT NOT NULL UNIQUE,
  level TEXT NOT NULL DEFAULT '' CHECK (length(level) <= 60),
  experience TEXT NOT NULL DEFAULT '' CHECK (length(experience) <= 60),
  location TEXT NOT NULL DEFAULT 'Calicut, on site' CHECK (length(location) <= 80),
  summary TEXT NOT NULL DEFAULT '' CHECK (length(summary) <= 600),
  requirements TEXT NOT NULL DEFAULT '[]',
  open INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS jobs_listing ON jobs (open, sort_order);

CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) <= 100),
  email TEXT NOT NULL CHECK (length(email) <= 160),
  phone TEXT NOT NULL DEFAULT '' CHECK (length(phone) <= 30),
  service TEXT NOT NULL DEFAULT '' CHECK (length(service) <= 40),
  message TEXT NOT NULL CHECK (length(message) <= 4000),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS inquiries_inbox ON inquiries (status, created_at DESC);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  position TEXT NOT NULL CHECK (length(position) <= 100),
  name TEXT NOT NULL CHECK (length(name) <= 100),
  email TEXT NOT NULL CHECK (length(email) <= 160),
  phone TEXT NOT NULL CHECK (length(phone) <= 30),
  experience TEXT NOT NULL DEFAULT '' CHECK (length(experience) <= 40),
  portfolio_url TEXT NOT NULL DEFAULT '' CHECK (length(portfolio_url) <= 300),
  github_url TEXT NOT NULL DEFAULT '' CHECK (length(github_url) <= 300),
  message TEXT NOT NULL DEFAULT '' CHECK (length(message) <= 3000),
  resume TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS applications_inbox ON applications (status, created_at DESC);

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL CHECK (length(title) <= 120),
  content TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Site settings: one row per key ("site"), the settings object kept as JSON.
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  data TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) <= 80),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor')),
  token_version INTEGER NOT NULL DEFAULT 0,
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Fixed-window throttle counters. Keys are hashed; expires_at is epoch milliseconds.
CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS login_attempts_expiry ON login_attempts (expires_at);
