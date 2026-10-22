import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "d4dx_admin";
export const SESSION_TTL_SHORT = 60 * 60 * 12; // 12 hours
export const SESSION_TTL_LONG = 60 * 60 * 24 * 14; // 14 days, "keep me signed in"

export interface SessionPayload {
  sub: string;
  role: "owner" | "editor";
  v: number;
}

function key(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload, ttlSeconds: number): Promise<string> {
  return new SignJWT({ role: payload.role, v: payload.v })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setIssuer("d4dx-admin")
    .setAudience("d4dx-admin")
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(key());
}

/** Returns the payload for a valid, unexpired token, or null for anything else. */
export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), {
      algorithms: ["HS256"],
      issuer: "d4dx-admin",
      audience: "d4dx-admin",
    });
    if (typeof payload.sub !== "string") return null;
    const role = payload.role === "owner" ? "owner" : "editor";
    const v = typeof payload.v === "number" ? payload.v : -1;
    return { sub: payload.sub, role, v };
  } catch {
    return null;
  }
}

/** Only same-site admin paths are allowed as a post-login destination. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/admin") || next.startsWith("//") || next.includes("\\")) return "/admin";
  if (next.startsWith("/admin/login")) return "/admin";
  return next;
}
