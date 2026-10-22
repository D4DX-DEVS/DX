import "server-only";
import path from "node:path";
import { z } from "zod";

const schema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  SITE_URL: z.url().default("http://localhost:3233"),
  MEDIA_DIR: z.string().default("storage/media"),
  PRIVATE_DIR: z.string().default("storage/private"),
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

export function mediaRoot(): string {
  return path.resolve(process.cwd(), env().MEDIA_DIR);
}

export function privateRoot(): string {
  return path.resolve(process.cwd(), env().PRIVATE_DIR);
}
