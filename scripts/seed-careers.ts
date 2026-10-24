/**
 * Adds the default text of the Join Our Team page as editable pages (Admin > Pages), if they are not there yet.
 *   npm run seed:careers
 * Safe to re-run: a page that exists, however it was edited, is left alone.
 */
import { first, newId, run } from "@/lib/db";

function out(message: string): void {
  process.stdout.write(`${message}\n`);
}

const PAGES = [
  {
    slug: "join-our-team",
    section: "careers-top",
    title: "Join Our Team",
    content:
      "<p>At D4DX Innovations, we are constantly looking for passionate individuals who want to build the future of technology. Whether you are just starting your journey or have a year of experience, we provide an environment to grow and innovate.</p>",
  },
  {
    slug: "why-d4dx",
    section: "careers-bottom",
    title: "Why D4DX",
    content:
      "<ul><li><strong>Hands-on Experience:</strong> Work on live international and domestic projects.</li><li><strong>Skill Growth:</strong> Regular mentorship and learning sessions.</li><li><strong>Collaborative Culture:</strong> A young, vibrant team environment in the heart of Calicut.</li></ul>",
  },
  {
    slug: "how-to-apply",
    section: "careers-bottom",
    title: "How to Apply",
    content:
      "<p><strong>Are you ready to innovate with us?</strong></p><p>We want to see your work! Press Apply Now beside a position above, or send your detailed resume and portfolio (if any) to <a href=\"mailto:admin@d4dx.co\">admin@d4dx.co</a>.</p><p>Mob No: +91 99466 66139</p><p>Please mention the position name in the subject line (e.g. “Application for MERN Stack Developer – Trainee”).</p>",
  },
];

async function main(): Promise<void> {
  for (const [i, p] of PAGES.entries()) {
    if (await first("SELECT 1 AS x FROM pages WHERE slug = ?", [p.slug])) {
      out(`${p.slug}: already there`);
      continue;
    }
    // Staggered by a second so the blocks keep this order on the page.
    const at = new Date(Date.now() + i * 1000).toISOString();
    await run("INSERT INTO pages (id, slug, title, content, section, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [newId(), p.slug, p.title, p.content, p.section, at, at]);
    out(`${p.slug}: added`);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`seed failed: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
