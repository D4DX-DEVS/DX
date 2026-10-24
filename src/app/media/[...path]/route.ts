import { MEDIA_CACHE_CONTROL } from "@/lib/media";
import { contentTypeFor, isSafeMediaPath, isSafeVideoPath } from "@/lib/media-utils";
import { getObject } from "@/lib/storage";

/** A single byte range ("bytes=0-", "bytes=100-199"); anything else is served whole. */
function parseRange(header: string | null): string | undefined {
  return header && /^bytes=\d*-\d*$/.test(header) && header !== "bytes=-" ? header : undefined;
}

/** Serves R2 media under /media for older URLs and for setups without a public R2 domain. Videos honour Range so they can seek and play on Safari. */
export async function GET(request: Request, ctx: RouteContext<"/media/[...path]">): Promise<Response> {
  const { path: segments } = await ctx.params;
  const video = isSafeVideoPath(segments);
  if (!video && !isSafeMediaPath(segments)) return new Response("Not found", { status: 404 });

  const range = video ? parseRange(request.headers.get("range")) : undefined;
  // A bad Range from a client is a 404 for video; image errors still surface as before.
  const object = await getObject("public", `media/${segments.join("/")}`, range).catch((error: unknown) => {
    if (video) return null;
    throw error;
  });
  if (!object) return new Response("Not found", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": contentTypeFor(segments[segments.length - 1]),
    "Cache-Control": MEDIA_CACHE_CONTROL,
    "X-Content-Type-Options": "nosniff",
  };
  if (video) headers["Accept-Ranges"] = "bytes";
  if (object.size !== undefined) headers["Content-Length"] = String(object.size);
  if (object.contentRange) headers["Content-Range"] = object.contentRange;
  return new Response(object.body, { status: object.contentRange ? 206 : 200, headers });
}
