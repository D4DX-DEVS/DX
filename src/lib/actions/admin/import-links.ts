"use server";

import sharp from "sharp";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/dal";
import { buildCover } from "@/lib/import/cover";
import {
  fromAppStore,
  fromPlay,
  fromWebsite,
  type Listing,
} from "@/lib/import/listings";
import { logger } from "@/lib/logger";
import { processImage } from "@/lib/media";
import type { MediaDoc } from "@/lib/models";

const input = z.object({
  playStore: z.string().max(500),
  appStore: z.string().max(500),
  website: z.string().max(500),
});

export interface ImportedAssets {
  title: string;
  summary: string;
  platforms: ("android" | "ios" | "web")[];
  icon: MediaDoc | null;
  cover: MediaDoc | null;
  gallery: MediaDoc[];
  /** What was found, for the message to the editor. */
  found: { icon: boolean; screens: number; cover: boolean };
}

export type ImportResult =
  { ok: true; assets: ImportedAssets } | { ok: false; message: string };

/**
 * Reads a project's Google Play, App Store and website links and brings back its icon, its screenshots and a
 * designed cover made from them, stored and ready to be placed in the form. The editor reviews and saves; nothing
 * on the project changes until then.
 */
export async function importFromLinks(
  raw: z.infer<typeof input>,
): Promise<ImportResult> {
  await requireAdmin();
  const parsed = input.safeParse(raw);
  if (!parsed.success)
    return { ok: false, message: "Those links could not be read." };
  const { playStore, appStore, website } = parsed.data;
  if (!playStore.trim() && !appStore.trim() && !website.trim())
    return {
      ok: false,
      message: "Add a Google Play, App Store or website link first.",
    };

  try {
    const read = (
      url: string,
      reader: (u: string) => Promise<Listing | null>,
    ) => (url.trim() ? reader(url.trim()) : Promise.resolve(null));
    const [play, apple, web] = await Promise.all([
      read(playStore, fromPlay),
      read(appStore, fromAppStore),
      read(website, fromWebsite),
    ]);
    const listings = [play, apple, web].filter((l): l is Listing => l !== null);
    if (listings.length === 0)
      return {
        ok: false,
        message:
          "Nothing could be read from those links. Check them and try again.",
      };

    // Phone screens from Google Play when there are any (its colours are the store's own), else the App Store; a site gives one picture.
    const phoneSource =
      [play, apple].find((l) => l && l.shots.length > 0) ?? null;
    const shots = phoneSource ? phoneSource.shots : (web?.shots ?? []);
    const isPhone = Boolean(phoneSource);
    const iconBuf =
      [play, apple, web].map((l) => l?.icon ?? null).find((b) => b !== null) ??
      null;
    const title = listings.find((l) => l.title)?.title ?? "";
    const summary = listings.find((l) => l.summary)?.summary ?? "";
    const platforms: ImportedAssets["platforms"] = [];
    if (playStore.trim()) platforms.push("android");
    if (appStore.trim()) platforms.push("ios");
    if (website.trim()) platforms.push("web");

    const name = title || "Project";
    const icon = iconBuf
      ? await processImage(
          await sharp(iconBuf)
            .resize(256, 256, {
              fit: "contain",
              background: { r: 255, g: 255, b: 255, alpha: 0 },
            })
            .png()
            .toBuffer(),
          `${name} icon`,
        )
      : null;
    const gallery: MediaDoc[] = [];
    for (const [i, shot] of shots.slice(0, 6).entries())
      gallery.push(await processImage(shot, `${name}, screen ${i + 1}`));
    let cover: MediaDoc | null = null;
    if (shots.length > 0) {
      const chips = [
        playStore.trim() ? "Android" : null,
        appStore.trim() ? "iOS" : null,
      ].filter((c): c is string => c !== null);
      cover = await processImage(
        await buildCover({ icon: iconBuf, shots, phone: isPhone, chips }),
        `${name}, portfolio image`,
      );
    }
    if (!icon && !cover && gallery.length === 0)
      return {
        ok: false,
        message: "The links were found, but they gave no images.",
      };
    return {
      ok: true,
      assets: {
        title,
        summary,
        platforms,
        icon,
        cover,
        gallery,
        found: {
          icon: icon !== null,
          screens: gallery.length,
          cover: cover !== null,
        },
      },
    };
  } catch (error: unknown) {
    logger.error("import from links failed", error);
    return {
      ok: false,
      message: "Could not read those links. Please try again.",
    };
  }
}
