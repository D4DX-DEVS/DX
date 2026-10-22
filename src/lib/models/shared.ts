/** A processed image stored in R2 under media/, served from R2_PUBLIC_URL or the /media proxy. */
export interface MediaDoc {
  url: string;
  width: number;
  height: number;
  blur: string;
  alt: string;
}

export const PUBLISH_STATUSES = ["published", "draft"] as const;
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];
