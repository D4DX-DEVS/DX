import "server-only";
import { requireAdmin } from "@/lib/auth/dal";
import { batch } from "@/lib/db";

export interface ActivityPoint {
  /** YYYY-MM-DD */
  date: string;
  posts: number;
  projects: number;
  pages: number;
}

export const ACTIVITY_DAYS = 90;

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
  /** Content created per day over the last 90 days (oldest first), for the activity chart. */
  activity: ActivityPoint[];
  recentInquiries: { id: string; name: string; email: string; service: string; status: string; created_at: string }[];
  recentApplications: { id: string; name: string; position: string; status: string; created_at: string }[];
}

export async function getDashboard(): Promise<DashboardData> {
  await requireAdmin();
  const since = new Date(Date.now() - (ACTIVITY_DAYS - 1) * 86_400_000).toISOString().slice(0, 10);
  const [counts, inquiries, applications, posts, projects, pages] = await batch([
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
    { sql: "SELECT substr(COALESCE(published_at, created_at), 1, 10) AS d, COUNT(*) AS n FROM posts WHERE status = 'published' AND d >= ? GROUP BY d", params: [since] },
    { sql: "SELECT substr(created_at, 1, 10) AS d, COUNT(*) AS n FROM projects WHERE d >= ? GROUP BY d", params: [since] },
    { sql: "SELECT substr(created_at, 1, 10) AS d, COUNT(*) AS n FROM pages WHERE d >= ? GROUP BY d", params: [since] },
  ]);
  const tally = (rows: unknown) => new Map((rows as { d: string; n: number }[]).map((r) => [r.d, Number(r.n)]));
  const byPosts = tally(posts);
  const byProjects = tally(projects);
  const byPages = tally(pages);
  const activity: ActivityPoint[] = Array.from({ length: ACTIVITY_DAYS }, (_, i) => {
    const date = new Date(Date.now() - (ACTIVITY_DAYS - 1 - i) * 86_400_000).toISOString().slice(0, 10);
    return { date, posts: byPosts.get(date) ?? 0, projects: byProjects.get(date) ?? 0, pages: byPages.get(date) ?? 0 };
  });
  return {
    counts: counts[0] as unknown as DashboardData["counts"],
    activity,
    recentInquiries: inquiries as unknown as DashboardData["recentInquiries"],
    recentApplications: applications as unknown as DashboardData["recentApplications"],
  };
}
