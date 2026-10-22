import "server-only";
import { z } from "zod";

const schema = z.object({
  // Cloudflare D1, reached over the Cloudflare HTTP API (token needs D1 edit permission).
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1, "CLOUDFLARE_ACCOUNT_ID is required"),
  CLOUDFLARE_API_TOKEN: z.string().min(1, "CLOUDFLARE_API_TOKEN is required"),
  D1_DATABASE_ID: z.string().min(1, "D1_DATABASE_ID is required"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  SITE_URL: z.url().default("http://localhost:3233"),
  // Cloudflare R2 (S3 API). Images go to R2_BUCKET_NAME under media/, résumés under private/
  // in R2_PRIVATE_BUCKET_NAME (falls back to the media bucket; use a separate one if that bucket is public).
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
  R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME is required"),
  R2_PRIVATE_BUCKET_NAME: z.string().optional(),
  R2_ENDPOINT: z.url().optional(),
  // Public bucket domain (custom domain or r2.dev). When unset, images are proxied through /media.
  R2_PUBLIC_URL: z.url().optional(),
  DEBUG_DB: z.enum(["0", "1"]).default("0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

/** Validated server environment. Parsed on first use so a missing value fails loudly, once. */
export function env(): Env {
  if (!cached) cached = schema.parse(process.env);
  return cached;
}
