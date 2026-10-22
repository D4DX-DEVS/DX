import "server-only";
import { headers } from "next/headers";

/** Best-effort client IP for throttling. Behind a proxy, set it to overwrite x-forwarded-for. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "local";
}
