import "server-only";
import { requireAdmin } from "@/lib/auth/dal";
import { batch } from "@/lib/db";

export interface DashboardData {
  counts: {
    projects: number;
    drafts: number;
    posts: number;
    team: number;
    openJobs: number;
    newInquiries: number;
    newApplications: number;
  };
  recentInquiries: { id: string; name: string; email: string; service: string; status: string; created_at: string }[];
  recentApplications: { id: string; name: string; position: string; status: string; created_at: string }[];
}

export async function getDashboard(): Promise<DashboardData> {
  await requireAdmin();
  const [counts, inquiries, applications] = await batch([
    {
      sql: `SELECT
              (SELECT COUNT(*) FROM projects WHERE status = 'published') AS projects,
              (SELECT COUNT(*) FROM projects WHERE status = 'draft') + (SELECT COUNT(*) FROM posts WHERE status = 'draft') AS drafts,
              (SELECT COUNT(*) FROM posts WHERE status = 'published') AS posts,
              (SELECT COUNT(*) FROM team_members WHERE published = 1) AS team,
              (SELECT COUNT(*) FROM jobs WHERE open = 1) AS openJobs,
              (SELECT COUNT(*) FROM inquiries WHERE status = 'new') AS newInquiries,
              (SELECT COUNT(*) FROM applications WHERE status = 'new') AS newApplications`,
    },
    { sql: "SELECT id, name, email, service, status, created_at FROM inquiries ORDER BY created_at DESC LIMIT 5" },
    { sql: "SELECT id, name, position, status, created_at FROM applications ORDER BY created_at DESC LIMIT 5" },
  ]);
  return {
    counts: counts[0] as unknown as DashboardData["counts"],
    recentInquiries: inquiries as unknown as DashboardData["recentInquiries"],
    recentApplications: applications as unknown as DashboardData["recentApplications"],
  };
}
