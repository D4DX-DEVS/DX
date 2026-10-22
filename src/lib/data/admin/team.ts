import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/dal";
import { first, json } from "@/lib/db";
import { listQuerySchema, parseSearchParams, type Paginated, type SearchParamsRecord } from "@/lib/listing";
import type { MediaDoc, TeamMemberRow } from "@/lib/models";
import type { TeamMemberInput } from "@/lib/schemas/admin";
import { listPage } from "../admin-query";

export const teamListQuery = listQuerySchema({
  sort: ["order", "name", "updated"],
  defaultSort: "order",
  defaultOrder: "asc",
  filters: { visibility: z.enum(["visible", "hidden"]).optional().catch(undefined) },
});

export interface TeamListRow {
  id: string;
  name: string;
  role: string;
  published: 0 | 1;
  sort_order: number;
  updated_at: string;
  photo_url: string | null;
}

export async function listTeam(params: SearchParamsRecord): Promise<Paginated<TeamListRow>> {
  await requireAdmin();
  const q = parseSearchParams(teamListQuery, params);
  const where = q.visibility ? [{ sql: "published = ?", params: [q.visibility === "visible" ? 1 : 0] }] : [];
  return listPage<TeamListRow>(
    {
      from: "team_members",
      select: "id, name, role, published, sort_order, updated_at, json_extract(photo, '$.url') AS photo_url",
      search: ["name", "role"],
      sorts: { order: "sort_order", name: "name COLLATE NOCASE", updated: "updated_at" },
      where,
      tiebreak: "id",
    },
    q,
  );
}

export interface TeamMemberEdit {
  id: string;
  values: TeamMemberInput;
}

export async function getTeamMemberForEdit(id: string): Promise<TeamMemberEdit | null> {
  await requireAdmin();
  const r = await first<TeamMemberRow>("SELECT * FROM team_members WHERE id = ?", [id]);
  if (!r) return null;
  return {
    id: r.id,
    values: {
      name: r.name,
      role: r.role,
      photo: json<MediaDoc | null>(r.photo, null),
      linkedin: r.linkedin,
      published: r.published === 1,
      order: r.sort_order,
    },
  };
}
