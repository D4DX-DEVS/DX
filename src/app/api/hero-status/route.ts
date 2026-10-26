import { heroSignature } from "@/app/(site)/_home/hero-captions";
import { FLIGHT } from "@/app/(site)/_home/flight";
import { getFeaturedProjects, getHeroVideo } from "@/lib/data/public";

/** Same sizing the home page uses for the banner's pictures, so the fingerprints can be compared. */
const optimised = (url: string, width = 828) =>
  `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=80`;

/**
 * Whether the recorded banner video still matches the projects on the site. `scripts/hero-video-watch.mjs` polls this
 * and records a new video when `fresh` turns false. Public, and says nothing that the home page does not.
 */
export async function GET(): Promise<Response> {
  const [featured, recorded] = await Promise.all([
    getFeaturedProjects(12),
    getHeroVideo(),
  ]);
  const now = heroSignature(
    featured
      .slice(0, FLIGHT)
      .map((p) => ({
        title: p.title,
        slug: p.slug,
        category: p.category.name,
        src: optimised(p.cover.url),
        icon: p.icon ? optimised(p.icon.url, 256) : null,
      })),
  );
  return Response.json(
    {
      recorded: recorded !== null,
      fresh: recorded !== null && recorded.signature === now,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
