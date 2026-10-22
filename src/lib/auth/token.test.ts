import { beforeAll, describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { safeNextPath, signSession, verifySession } from "./token";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-that-is-definitely-longer-than-32-chars";
});

describe("session tokens", () => {
  it("round-trips a signed session", async () => {
    const token = await signSession({ sub: "abc123", role: "owner", v: 2 }, 60);
    await expect(verifySession(token)).resolves.toEqual({ sub: "abc123", role: "owner", v: 2 });
  });

  it("rejects tampered, foreign and missing tokens", async () => {
    const token = await signSession({ sub: "abc123", role: "editor", v: 0 }, 60);
    const tampered = token.slice(0, -2) + (token.endsWith("A") ? "BB" : "AA");
    await expect(verifySession(tampered)).resolves.toBeNull();
    await expect(verifySession(undefined)).resolves.toBeNull();

    const foreign = await new SignJWT({ role: "owner", v: 0 })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("abc123")
      .setExpirationTime("60s")
      .sign(new TextEncoder().encode("another-secret-another-secret-another-secret"));
    await expect(verifySession(foreign)).resolves.toBeNull();
  });

  it("rejects expired tokens", async () => {
    const token = await signSession({ sub: "abc123", role: "editor", v: 0 }, -10);
    await expect(verifySession(token)).resolves.toBeNull();
  });
});

describe("safeNextPath", () => {
  it("only allows admin paths", () => {
    expect(safeNextPath("/admin/projects?page=2")).toBe("/admin/projects?page=2");
    expect(safeNextPath("https://evil.example")).toBe("/admin");
    expect(safeNextPath("//evil.example")).toBe("/admin");
    expect(safeNextPath("/admin/login")).toBe("/admin");
    expect(safeNextPath("/\\evil")).toBe("/admin");
    expect(safeNextPath(undefined)).toBe("/admin");
  });
});
