import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { mediaRoot } from "@/lib/env";
import { contentTypeFor, isSafeMediaPath } from "@/lib/media-utils";

export async function GET(_request: Request, ctx: RouteContext<"/media/[...path]">): Promise<Response> {
  const { path: segments } = await ctx.params;
  if (!isSafeMediaPath(segments)) return new Response("Not found", { status: 404 });

  const file = path.join(mediaRoot(), ...segments);
  const info = await stat(file).catch(() => null);
  if (!info?.isFile()) return new Response("Not found", { status: 404 });

  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream<Uint8Array>;
  return new Response(stream, {
    headers: {
      "Content-Type": contentTypeFor(file),
      "Content-Length": String(info.size),
      // File names are random UUIDs and never rewritten, so they can be cached forever.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
