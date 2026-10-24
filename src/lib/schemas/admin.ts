import { z } from "zod";

/** Shared by the admin forms in the browser and the server actions that save them. */

const slug = z
  .string()
  .trim()
  .min(1, "Enter a slug.")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens.");

// http(s) only: these links are rendered on the public site.
const optionalUrl = z.union([z.literal(""), z.url({ protocol: /^https?$/, message: "Enter a full link starting with https://" }).max(300)]);

/** A preview video: one this app stored (/media/videos/...) or an https link to an mp4 or webm. */
const videoUrl = z.union([
  z.literal(""),
  z.string().max(500).regex(/^(\/media\/videos\/[0-9]{4}\/[0-9]{2}\/[a-z0-9-]+\.(mp4|webm)|https:\/\/\S+)$/, "Upload a video, or enter a full https:// link."),
]);

export const mediaSchema = z.object({
  // Only images this app stored: the /media proxy path or the public R2 domain.
  url: z.string().regex(/^(\/media\/|https:\/\/)/, "Upload the image again."),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  blur: z.string().max(4000),
  alt: z.string().trim().max(200),
});
export type MediaInput = z.infer<typeof mediaSchema>;

const lines = (max: number, each = 200) => z.array(z.string().trim().min(1).max(each)).max(max);
const order = z.number().int().min(0).max(9999);

export const PLATFORM_OPTIONS = ["android", "ios", "web", "desktop"] as const;
export const STATUS_OPTIONS = ["published", "draft"] as const;
export const INBOX_OPTIONS = ["new", "read", "archived"] as const;

export const projectSchema = z
  .object({
  title: z.string().trim().min(1, "Enter a title.").max(120),
  slug,
  categoryId: z.string().min(1, "Choose a category."),
  client: z.string().trim().max(120),
  date: z.union([z.literal(""), z.iso.date("Use a valid date.")]),
  summary: z.string().trim().max(320),
  body: z.string().max(100_000),
  features: lines(30),
  platforms: z.array(z.enum(PLATFORM_OPTIONS)),
  links: z.object({ playStore: optionalUrl, appStore: optionalUrl, website: optionalUrl }),
  cover: mediaSchema.nullable(),
  gallery: z.array(mediaSchema).max(30),
  video: videoUrl,
  featured: z.boolean(),
  status: z.enum(STATUS_OPTIONS),
  order,
  })
  // Checked on the object so the field type stays nullable for the form's empty state.
  .refine((p) => p.cover !== null, { path: ["cover"], message: "Upload a cover image." });
export type ProjectInput = z.infer<typeof projectSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(60),
  slug,
  description: z.string().trim().max(300),
  order,
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const serviceSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(80),
  slug,
  summary: z.string().trim().min(1, "Enter a summary.").max(400),
  proof: z.string().trim().max(300),
  points: lines(12),
  proofProjectSlug: z.string().max(80),
  published: z.boolean(),
  order,
});
export type ServiceInput = z.infer<typeof serviceSchema>;

export const teamMemberSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(80),
  role: z.string().trim().min(1, "Enter a role.").max(80),
  photo: mediaSchema.nullable(),
  linkedin: optionalUrl,
  published: z.boolean(),
  order,
});
export type TeamMemberInput = z.infer<typeof teamMemberSchema>;

export const testimonialSchema = z.object({
  quote: z.string().trim().min(1, "Enter the quote.").max(400),
  name: z.string().trim().min(1, "Enter a name.").max(80),
  role: z.string().trim().max(120),
  context: z.string().trim().max(160),
  projectSlug: z.string().max(80),
  published: z.boolean(),
  order,
});
export type TestimonialInput = z.infer<typeof testimonialSchema>;

export const postSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(160),
  slug,
  excerpt: z.string().trim().max(320),
  content: z.string().max(200_000),
  cover: mediaSchema.nullable(),
  tags: lines(12, 40),
  /** Optional: where to see or get what the post is about. */
  website: optionalUrl,
  playStore: optionalUrl,
  appStore: optionalUrl,
  status: z.enum(STATUS_OPTIONS),
  publishedAt: z.union([z.literal(""), z.iso.date("Use a valid date.")]),
});
export type PostInput = z.infer<typeof postSchema>;

export const jobSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(100),
  slug,
  level: z.string().trim().max(60),
  experience: z.string().trim().max(60),
  location: z.string().trim().max(80),
  summary: z.string().trim().max(600),
  requirements: lines(20, 300),
  open: z.boolean(),
  order,
});
export type JobInput = z.infer<typeof jobSchema>;

/** Where a page shows: the legal pages (footer and /legal), or the Join Our Team page above or below its positions table. */
export const PAGE_SECTIONS = ["legal", "careers-top", "careers-bottom"] as const;
export const PAGE_SECTION_LABEL: Record<(typeof PAGE_SECTIONS)[number], string> = {
  legal: "Legal pages (footer and /legal)",
  "careers-top": "Join Our Team: above the positions",
  "careers-bottom": "Join Our Team: below the positions",
};

export const pageSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(120),
  slug,
  section: z.enum(PAGE_SECTIONS),
  content: z.string().max(200_000),
});
export type PageInput = z.infer<typeof pageSchema>;

export const settingsSchema = z.object({
  tagline: z.string().trim().max(220),
  email: z.union([z.literal(""), z.email("Enter a valid email.")]),
  careersEmail: z.union([z.literal(""), z.email("Enter a valid email.")]),
  phone: z.string().trim().max(30),
  careersPhone: z.string().trim().max(30),
  whatsapp: z.string().trim().regex(/^\d*$/, "Digits only, with the country code (e.g. 919895804006).").max(20),
  addressLines: lines(6, 120),
  mapUrl: optionalUrl,
  socials: z.object({ linkedin: optionalUrl, instagram: optionalUrl, facebook: optionalUrl }),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

export const inboxStatusSchema = z.enum(INBOX_OPTIONS);

const password = z.string().min(10, "Use at least 10 characters.").max(200);

export const adminUserSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(80),
  email: z.email("Enter a valid email.").trim().toLowerCase().max(160),
  role: z.enum(["owner", "editor"]),
  /** Required when creating; leave empty on edit to keep the current password. */
  password: z.union([z.literal(""), password]),
});
export type AdminUserInput = z.infer<typeof adminUserSchema>;

export const accountSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name.").max(80),
    currentPassword: z.string().max(200),
    newPassword: z.union([z.literal(""), password]),
    confirmPassword: z.string().max(200),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "The passwords do not match." })
  .refine((v) => !v.newPassword || v.currentPassword.length > 0, { path: ["currentPassword"], message: "Enter your current password." });
export type AccountInput = z.infer<typeof accountSchema>;

export const loginSchema = z.object({
  email: z.email("Enter a valid email.").trim().toLowerCase().max(160),
  password: z.string().min(1, "Enter your password.").max(200),
  remember: z.boolean(),
});
export type LoginInput = z.infer<typeof loginSchema>;
