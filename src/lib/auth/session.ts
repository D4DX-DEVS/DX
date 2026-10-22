import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, signSession, verifySession, type SessionPayload } from "./token";

export async function createSessionCookie(payload: SessionPayload, ttlSeconds: number): Promise<void> {
  const token = await signSession(payload, ttlSeconds);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ttlSeconds,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
