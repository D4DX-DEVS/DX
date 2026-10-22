import { Schema } from "mongoose";

/** A processed image stored under MEDIA_DIR and served from /media. */
export interface MediaDoc {
  url: string;
  width: number;
  height: number;
  blur: string;
  alt: string;
}

export const MediaSchema = new Schema<MediaDoc>(
  {
    url: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    blur: { type: String, default: "" },
    alt: { type: String, default: "", maxlength: 200 },
  },
  { _id: false },
);

export const PUBLISH_STATUSES = ["published", "draft"] as const;
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];
