import "server-only";
import mongoose, { Schema, type InferSchemaType, type Model, type Types } from "mongoose";
import { MediaSchema, PUBLISH_STATUSES } from "./shared";

export { PUBLISH_STATUSES } from "./shared";
export type { MediaDoc, PublishStatus } from "./shared";

function model<T>(name: string, schema: Schema<T>): Model<T> {
  return (mongoose.models[name] as Model<T> | undefined) ?? mongoose.model<T>(name, schema);
}

/* ---------- Category ---------- */
const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "", maxlength: 300 },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true },
);
export type CategoryDoc = InferSchemaType<typeof CategorySchema> & { _id: Types.ObjectId };
export const Category = model("Category", CategorySchema);

/* ---------- Project ---------- */
export const PLATFORMS = ["android", "ios", "web", "desktop"] as const;
const ProjectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    client: { type: String, default: "", maxlength: 120 },
    date: { type: Date, default: null },
    summary: { type: String, default: "", maxlength: 320 },
    body: { type: String, default: "" },
    features: { type: [String], default: [] },
    platforms: { type: [String], enum: PLATFORMS, default: [] },
    links: {
      playStore: { type: String, default: "" },
      appStore: { type: String, default: "" },
      website: { type: String, default: "" },
    },
    cover: { type: MediaSchema, required: true },
    gallery: { type: [MediaSchema], default: [] },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: PUBLISH_STATUSES, default: "draft" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);
ProjectSchema.index({ status: 1, category: 1, order: 1, date: -1 });
ProjectSchema.index({ status: 1, featured: 1, order: 1 });
ProjectSchema.index({ title: "text", client: "text", summary: "text" });
export type ProjectDoc = InferSchemaType<typeof ProjectSchema> & { _id: Types.ObjectId };
export const Project = model("Project", ProjectSchema);

/* ---------- Service ---------- */
const ServiceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    summary: { type: String, required: true, maxlength: 400 },
    proof: { type: String, default: "", maxlength: 300 },
    points: { type: [String], default: [] },
    proofProjectSlug: { type: String, default: "" },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);
ServiceSchema.index({ published: 1, order: 1 });
export type ServiceDoc = InferSchemaType<typeof ServiceSchema> & { _id: Types.ObjectId };
export const Service = model("Service", ServiceSchema);

/* ---------- Team member ---------- */
const TeamMemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    role: { type: String, required: true, trim: true, maxlength: 80 },
    photo: { type: MediaSchema, default: null },
    linkedin: { type: String, default: "" },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);
TeamMemberSchema.index({ published: 1, order: 1 });
export type TeamMemberDoc = InferSchemaType<typeof TeamMemberSchema> & { _id: Types.ObjectId };
export const TeamMember = model("TeamMember", TeamMemberSchema);

/* ---------- Testimonial ---------- */
const TestimonialSchema = new Schema(
  {
    quote: { type: String, required: true, maxlength: 400 },
    name: { type: String, required: true, maxlength: 80 },
    role: { type: String, default: "", maxlength: 120 },
    context: { type: String, default: "", maxlength: 160 },
    projectSlug: { type: String, default: "" },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);
TestimonialSchema.index({ published: 1, order: 1 });
export type TestimonialDoc = InferSchemaType<typeof TestimonialSchema> & { _id: Types.ObjectId };
export const Testimonial = model("Testimonial", TestimonialSchema);

/* ---------- Blog post ---------- */
const PostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, default: "", maxlength: 320 },
    content: { type: String, default: "" },
    cover: { type: MediaSchema, default: null },
    tags: { type: [String], default: [] },
    status: { type: String, enum: PUBLISH_STATUSES, default: "draft" },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
PostSchema.index({ status: 1, publishedAt: -1 });
export type PostDoc = InferSchemaType<typeof PostSchema> & { _id: Types.ObjectId };
export const Post = model("Post", PostSchema);

/* ---------- Job opening ---------- */
const JobSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    level: { type: String, default: "", maxlength: 60 },
    experience: { type: String, default: "", maxlength: 60 },
    location: { type: String, default: "Calicut, on site", maxlength: 80 },
    summary: { type: String, default: "", maxlength: 600 },
    requirements: { type: [String], default: [] },
    open: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);
JobSchema.index({ open: 1, order: 1 });
export type JobDoc = InferSchemaType<typeof JobSchema> & { _id: Types.ObjectId };
export const Job = model("Job", JobSchema);

/* ---------- Inbox: inquiries and applications ---------- */
export const INBOX_STATUSES = ["new", "read", "archived"] as const;
const InquirySchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, maxlength: 160 },
    phone: { type: String, default: "", maxlength: 30 },
    service: { type: String, default: "", maxlength: 40 },
    message: { type: String, required: true, maxlength: 4000 },
    status: { type: String, enum: INBOX_STATUSES, default: "new" },
  },
  { timestamps: true },
);
InquirySchema.index({ status: 1, createdAt: -1 });
export type InquiryDoc = InferSchemaType<typeof InquirySchema> & { _id: Types.ObjectId };
export const Inquiry = model("Inquiry", InquirySchema);

const ApplicationSchema = new Schema(
  {
    position: { type: String, required: true, maxlength: 100 },
    name: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, maxlength: 160 },
    phone: { type: String, required: true, maxlength: 30 },
    experience: { type: String, default: "", maxlength: 40 },
    portfolioUrl: { type: String, default: "", maxlength: 300 },
    githubUrl: { type: String, default: "", maxlength: 300 },
    message: { type: String, default: "", maxlength: 3000 },
    resume: {
      file: { type: String, required: true },
      name: { type: String, required: true },
      size: { type: Number, required: true },
    },
    status: { type: String, enum: INBOX_STATUSES, default: "new" },
  },
  { timestamps: true },
);
ApplicationSchema.index({ status: 1, createdAt: -1 });
export type ApplicationDoc = InferSchemaType<typeof ApplicationSchema> & { _id: Types.ObjectId };
export const Application = model("Application", ApplicationSchema);

/* ---------- Legal and other plain pages ---------- */
const PageSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, maxlength: 120 },
    content: { type: String, default: "" },
  },
  { timestamps: true },
);
export type PageDoc = InferSchemaType<typeof PageSchema> & { _id: Types.ObjectId };
export const Page = model("Page", PageSchema);

/* ---------- Site settings (single document) ---------- */
const SettingsSchema = new Schema(
  {
    key: { type: String, default: "site", unique: true },
    tagline: { type: String, default: "", maxlength: 220 },
    email: { type: String, default: "" },
    careersEmail: { type: String, default: "" },
    phone: { type: String, default: "" },
    careersPhone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    addressLines: { type: [String], default: [] },
    mapUrl: { type: String, default: "" },
    socials: {
      linkedin: { type: String, default: "" },
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
    },
  },
  { timestamps: true },
);
export type SettingsDoc = InferSchemaType<typeof SettingsSchema> & { _id: Types.ObjectId };
export const Settings = model("Settings", SettingsSchema);

/* ---------- Admin users and login throttling ---------- */
export const ADMIN_ROLES = ["owner", "editor"] as const;
const AdminUserSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ADMIN_ROLES, default: "editor" },
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);
export type AdminUserDoc = InferSchemaType<typeof AdminUserSchema> & { _id: Types.ObjectId };
export const AdminUser = model("AdminUser", AdminUserSchema);

const LoginAttemptSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});
LoginAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const LoginAttempt = model("LoginAttempt", LoginAttemptSchema);
