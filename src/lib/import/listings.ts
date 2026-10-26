import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import sharp from "sharp";

/** What a project's public pages give us: its name, a line about it, the icon, and screenshots. */
export interface Listing {
  title: string;
  summary: string;
  icon: Buffer | null;
  /** Phone screens for an app, or one picture of a site. */
  shots: Buffer[];
  /** True when `shots` are phone-shaped. */
  phone: boolean;
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const MAX_SHOTS = 6;
const MAX_HTML = 1_500_000;

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

async function fetchBytes(
  url: string,
  timeoutMs = 15_000,
): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function fetchText(
  url: string,
  accept = "text/html",
): Promise<{ text: string; url: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "en", Accept: accept },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const text = (await res.text()).slice(0, MAX_HTML);
    return { text, url: res.url };
  } catch {
    return null;
  }
}

async function metaOf(
  buf: Buffer,
): Promise<{ width: number; height: number } | null> {
  try {
    const m = await sharp(buf).metadata();
    return m.width && m.height ? { width: m.width, height: m.height } : null;
  } catch {
    return null;
  }
}

/** Only phone-shaped, reasonably large pictures count as screens. */
async function keepPhoneShots(buffers: (Buffer | null)[]): Promise<Buffer[]> {
  const kept: Buffer[] = [];
  for (const buf of buffers) {
    if (!buf || kept.length >= MAX_SHOTS) continue;
    const m = await metaOf(buf);
    if (m && m.width >= 300 && m.height / m.width >= 1.5) kept.push(buf);
  }
  return kept;
}

/** The package name in a Google Play link (`...details?id=com.example.app`). */
export function playId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/(^|\.)play\.google\.com$/.test(u.hostname)) return null;
    const id = u.searchParams.get("id");
    return id && /^[A-Za-z0-9._]+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** The numeric id and store country in an App Store link (`apps.apple.com/in/app/name/id123`). */
export function appleId(url: string): { id: string; country: string } | null {
  try {
    const u = new URL(url);
    if (!/(^|\.)apps\.apple\.com$/.test(u.hostname)) return null;
    const id = u.pathname.match(/\/id(\d+)/)?.[1];
    const country = u.pathname.match(/^\/([a-z]{2})\//)?.[1] ?? "us";
    return id ? { id, country } : null;
  } catch {
    return null;
  }
}

/** Reads a Google Play listing: its title, short description, icon and phone screenshots (full size, as Play serves them). */
export async function fromPlay(url: string): Promise<Listing | null> {
  const id = playId(url);
  if (!id) return null;
  const page = await fetchText(
    `https://play.google.com/store/apps/details?id=${id}&hl=en&gl=in`,
  );
  if (!page) return null;
  const { text } = page;
  const title = decode(
    (text.match(/property="og:title" content="([^"]*)"/)?.[1] ?? "").replace(
      / - Apps on Google Play$/,
      "",
    ),
  );
  const summary = decode(
    text.match(/property="og:description" content="([^"]*)"/)?.[1] ?? "",
  );
  const iconBase =
    text.match(
      /property="og:image" content="(https:\/\/play-lh\.googleusercontent\.com\/[^"=]*)/,
    )?.[1] ?? "";
  const bases: string[] = [];
  for (const m of text.matchAll(
    /https:\/\/play-lh\.googleusercontent\.com\/([A-Za-z0-9_-]{20,})=w\d+-h\d+/g,
  )) {
    const base = `https://play-lh.googleusercontent.com/${m[1]}`;
    if (base !== iconBase && !bases.includes(base)) bases.push(base);
  }
  const [icon, ...downloaded] = await Promise.all([
    iconBase ? fetchBytes(`${iconBase}=s512`) : Promise.resolve(null),
    ...bases.slice(0, 14).map((b) => fetchBytes(`${b}=s0`)),
  ]);
  return {
    title,
    summary,
    icon,
    shots: await keepPhoneShots(downloaded),
    phone: true,
  };
}

/** Reads an App Store listing through Apple's public lookup API. */
export async function fromAppStore(url: string): Promise<Listing | null> {
  const ref = appleId(url);
  if (!ref) return null;
  const res = await fetchText(
    `https://itunes.apple.com/lookup?id=${ref.id}&country=${ref.country}`,
    "application/json",
  );
  if (!res) return null;
  let data:
    | {
        trackName?: string;
        description?: string;
        artworkUrl512?: string;
        screenshotUrls?: string[];
      }
    | undefined;
  try {
    data = (JSON.parse(res.text) as { results?: (typeof data)[] }).results?.[0];
  } catch {
    return null;
  }
  if (!data) return null;
  const urls = (data.screenshotUrls ?? []).map((u) =>
    u.replace(/\/[0-9]+x[0-9]+bb\.(jpg|png|webp)$/, "/1000x0w.png"),
  );
  const [icon, ...downloaded] = await Promise.all([
    data.artworkUrl512 ? fetchBytes(data.artworkUrl512) : Promise.resolve(null),
    ...urls.slice(0, 8).map((u) => fetchBytes(u)),
  ]);
  return {
    title: data.trackName ?? "",
    summary: (data.description ?? "").split("\n")[0]?.slice(0, 300) ?? "",
    icon,
    shots: await keepPhoneShots(downloaded),
    phone: true,
  };
}

/** A public web address only: no private networks, so the server cannot be pointed at its own insides. */
async function isPublicHost(host: string): Promise<boolean> {
  const bad = (ip: string) =>
    /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
      ip,
    ) ||
    ip === "::1" ||
    /^(fc|fd|fe80)/i.test(ip) ||
    ip === "::";
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  )
    return false;
  if (isIP(host)) return !bad(host);
  try {
    const addresses = await lookup(host, { all: true });
    return addresses.length > 0 && addresses.every((a) => !bad(a.address));
  } catch {
    return false;
  }
}

/** Reads a website: its title, description, icon, and its share picture (a site cannot be photographed from here). */
export async function fromWebsite(url: string): Promise<Listing | null> {
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return null;
  }
  if (
    !/^https?:$/.test(target.protocol) ||
    !(await isPublicHost(target.hostname))
  )
    return null;
  const page = await fetchText(target.toString());
  if (!page) return null;
  const { text } = page;
  const meta = (name: string) =>
    decode(
      text.match(
        new RegExp(
          `<meta[^>]+(?:property|name)="${name}"[^>]+content="([^"]*)"`,
          "i",
        ),
      )?.[1] ??
        text.match(
          new RegExp(
            `<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="${name}"`,
            "i",
          ),
        )?.[1] ??
        "",
    );
  const title =
    meta("og:title") ||
    decode(text.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "");
  const summary = meta("og:description") || meta("description");
  const abs = (href: string) => {
    try {
      return new URL(href, page.url).toString();
    } catch {
      return "";
    }
  };
  const iconLinks = [
    ...text.matchAll(/<link[^>]+rel="([^"]*icon[^"]*)"[^>]*>/gi),
  ]
    .map((m) => ({
      href: m[0].match(/href="([^"]+)"/)?.[1] ?? "",
      size: Number(m[0].match(/sizes="(\d+)x\d+"/)?.[1] ?? 0),
      apple: /apple/i.test(m[1] ?? ""),
    }))
    .filter((l) => l.href)
    .sort((a, b) => Number(b.apple) - Number(a.apple) || b.size - a.size);
  let icon: Buffer | null = null;
  for (const l of iconLinks.slice(0, 4)) {
    const buf = await fetchBytes(abs(l.href), 10_000);
    const m = buf ? await metaOf(buf) : null;
    if (buf && m && m.width >= 48) {
      icon = buf;
      break;
    }
  }
  const og = meta("og:image") || meta("twitter:image");
  const shot = og ? await fetchBytes(abs(og)) : null;
  const m = shot ? await metaOf(shot) : null;
  return {
    title,
    summary: summary.slice(0, 300),
    icon,
    shots: shot && m && m.width >= 400 ? [shot] : [],
    phone: false,
  };
}
