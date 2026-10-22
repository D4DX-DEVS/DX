import { getAdmin } from "@/lib/auth/dal";
import { first, json } from "@/lib/db";
import { getPrivateFile } from "@/lib/media";
import { safeDownloadName } from "@/lib/media-utils";
import type { ResumeDoc } from "@/lib/models";

/** Streams an applicant's résumé from private R2 storage, for signed-in admins only. */
export async function GET(_request: Request, ctx: RouteContext<"/admin/applications/[id]/resume">): Promise<Response> {
  if (!(await getAdmin())) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const row = await first<{ resume: string }>("SELECT resume FROM applications WHERE id = ?", [id]);
  const resume = row ? json<ResumeDoc | null>(row.resume, null) : null;
  const object = resume?.file ? await getPrivateFile(resume.file) : null;
  if (!resume || !object) return new Response("Not found", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${safeDownloadName(resume.name)}"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (object.size !== undefined) headers["Content-Length"] = String(object.size);
  return new Response(object.body, { headers });
}
