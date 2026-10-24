import "server-only";
import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

const globalForR2 = globalThis as unknown as { __r2?: S3Client };

/** One S3 client per process, pointed at Cloudflare R2 (survives dev hot reloads). */
function client(): S3Client {
  if (globalForR2.__r2) return globalForR2.__r2;
  const { R2_ACCOUNT_ID, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = env();
  // Only the origin matters: a pasted endpoint sometimes carries the bucket as a path.
  const endpoint = R2_ENDPOINT ? new URL(R2_ENDPOINT).origin : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  globalForR2.__r2 = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
  return globalForR2.__r2;
}

export type BucketKind = "public" | "private";

function bucket(kind: BucketKind): string {
  const { R2_BUCKET_NAME, R2_PRIVATE_BUCKET_NAME } = env();
  return kind === "private" ? R2_PRIVATE_BUCKET_NAME || R2_BUCKET_NAME : R2_BUCKET_NAME;
}

export async function putObject(kind: BucketKind, key: string, body: Uint8Array, contentType: string, cacheControl?: string): Promise<void> {
  await client().send(new PutObjectCommand({ Bucket: bucket(kind), Key: key, Body: body, ContentType: contentType, CacheControl: cacheControl }));
}

export interface StoredObject {
  body: ReadableStream<Uint8Array>;
  /** Bytes in `body` (the requested range when there was one). */
  size: number | undefined;
  contentType: string | undefined;
  /** Set when a byte range was served, as "bytes 0-99/1000". */
  contentRange?: string;
}

/** Returns null when the key does not exist. */
export async function getObject(kind: BucketKind, key: string, range?: string): Promise<StoredObject | null> {
  try {
    const res = await client().send(new GetObjectCommand({ Bucket: bucket(kind), Key: key, Range: range }));
    if (!res.Body) return null;
    return { body: res.Body.transformToWebStream(), size: res.ContentLength, contentType: res.ContentType, contentRange: res.ContentRange };
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === "NoSuchKey" || error.name === "NotFound")) return null;
    throw error;
  }
}

export async function deleteObject(kind: BucketKind, key: string): Promise<void> {
  await client().send(new DeleteObjectCommand({ Bucket: bucket(kind), Key: key }));
}

export interface ListedObject {
  key: string;
  /** MD5 of the content for single-part uploads (everything this app writes), so equal ETags mean equal bytes. */
  etag: string;
  size: number;
}

export async function listObjects(kind: BucketKind, prefix: string): Promise<ListedObject[]> {
  const objects: ListedObject[] = [];
  let token: string | undefined;
  do {
    const res = await client().send(new ListObjectsV2Command({ Bucket: bucket(kind), Prefix: prefix, ContinuationToken: token }));
    for (const item of res.Contents ?? []) {
      if (item.Key) objects.push({ key: item.Key, etag: (item.ETag ?? "").replace(/"/g, ""), size: item.Size ?? 0 });
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return objects;
}

export async function listKeys(kind: BucketKind, prefix: string): Promise<string[]> {
  return (await listObjects(kind, prefix)).map((o) => o.key);
}

export async function deletePrefix(kind: BucketKind, prefix: string): Promise<number> {
  const keys = await listKeys(kind, prefix);
  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000).map((Key) => ({ Key }));
    await client().send(new DeleteObjectsCommand({ Bucket: bucket(kind), Delete: { Objects: chunk, Quiet: true } }));
  }
  return keys.length;
}

/** Public URL for a media key: the R2 CDN domain when configured, otherwise the /media proxy route. */
export function publicMediaUrl(key: string): string {
  const base = env().R2_PUBLIC_URL;
  const rel = key.replace(/^media\//, "");
  return base ? `${base.replace(/\/$/, "")}/media/${rel}` : `/media/${rel}`;
}

/** Inverse of publicMediaUrl. Accepts both URL styles; anything foreign returns null. */
export function mediaKeyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const base = env().R2_PUBLIC_URL?.replace(/\/$/, "");
  let rest: string | null = null;
  if (url.startsWith("/media/")) rest = url.slice("/media/".length);
  else if (base && url.startsWith(`${base}/media/`)) rest = url.slice(`${base}/media/`.length);
  if (!rest || !/^(videos\/)?[0-9]{4}\/[0-9]{2}\/[a-z0-9-]+\.(webp|avif|jpg|jpeg|png|mp4|webm)$/.test(rest)) return null;
  return `media/${rest}`;
}
