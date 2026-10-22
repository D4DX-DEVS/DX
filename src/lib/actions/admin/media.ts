"use server";

import { requireAdmin } from "@/lib/auth/dal";
import { logger } from "@/lib/logger";
import { MediaError, processImage } from "@/lib/media";
import { MAX_IMAGE_BYTES } from "@/lib/media-utils";
import type { MediaDoc } from "@/lib/models";

export type UploadResult = { ok: true; media: MediaDoc } | { ok: false; message: string };

/** Re-encodes an uploaded image to WebP and stores it in R2. The caller saves the returned media with its record. */
export async function uploadImage(form: FormData): Promise<UploadResult> {
  await requireAdmin();
  const file = form.get("file");
  const alt = form.get("alt");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose an image to upload." };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, message: "Images must be 8 MB or smaller." };
  try {
    const media = await processImage(Buffer.from(await file.arrayBuffer()), typeof alt === "string" ? alt : "");
    return { ok: true, media };
  } catch (error: unknown) {
    if (error instanceof MediaError) return { ok: false, message: error.message };
    logger.error("image upload failed", error);
    return { ok: false, message: "Could not upload the image. Please try again." };
  }
}
