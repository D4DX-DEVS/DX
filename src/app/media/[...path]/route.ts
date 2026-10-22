import { MEDIA_CACHE_CONTROL } from "@/lib/media";
import { contentTypeFor, isSafeMediaPath } from "@/lib/media-utils";
import { getObject } from "@/lib/storage";

/** Serves R2 media under /media for older URLs and for setups without a public R2 domain. */
export async function GET(_request: Request, ctx: RouteContext<"/media/[...path]">): Promise<Response> {
  const { path: segments } = await ctx.params;
  if (!isSafeMediaPath(segments)) return new Response("Not found", { status: 404 });

  const object = await getObject("public", `media/${segments.join("/")}`);
  if (!object) return new Response("Not found", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": contentTypeFor(segments[2]),
    "Cache-Control": MEDIA_CACHE_CONTROL,
    "X-Content-Type-Options": "nosniff",
  };
  if (object.size !== undefined) headers["Content-Length"] = String(object.size);
  return new Response(object.body, { headers });
}
