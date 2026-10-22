import Link from "next/link";
import { getFeaturedProjects, getSettings } from "@/lib/data/public";
import { Hero3D, type HeroProject } from "./hero-3d";
import { FLIGHT } from "./flight";
import { HeroMark } from "./hero-mark";

/**
 * One optimised width for every hero picture: big enough for a panel filling a desktop screen,
 * small enough for a phone's GPU. Built directly because the URL feeds WebGL textures and SVG
 * images, not an <img srcset>. The default loader resizes it, never past the 2000px originals.
 */
function optimised(url: string): string {
  return `/_next/image?url=${encodeURIComponent(url)}&w=828&q=80`;
}

/**
 * A plain two-line title beside the logo's mark, drawn in the logo's blue.
 * Where WebGL is available the mark then lifts off the page in 3D and the scroll becomes a
 * flight past the shipped apps.
 */
export async function Hero() {
  // getFeaturedProjects(12) is the same cached call the work and process sections make.
  const [settings, featured] = await Promise.all([getSettings(), getFeaturedProjects(12)]);
  const sentence =
    settings.tagline || "We build mobile apps, websites, ERP and SaaS from our studio on Mavoor Road, Calicut.";

  const projects: HeroProject[] = featured.slice(0, FLIGHT).map((p) => ({
    title: p.title,
    slug: p.slug,
    category: p.category.name,
    src: optimised(p.cover.url),
  }));

  return (
    <Hero3D projects={projects} labelledBy="hero-title">
      <div className="frame relative z-10 grid min-h-svh grid-cols-1 content-center gap-y-10 pt-24 pb-[calc(var(--margin)*2)] md:grid-cols-12 md:gap-x-[var(--gutter)] md:pt-20">
        <div data-hero-copy className="order-2 md:order-1 md:col-span-6 lg:col-span-5">
          <h1 id="hero-title" className="lines text-[length:var(--step-xl)] leading-[1.02] font-medium tracking-[-0.035em]">
            <span className="line">
              <span data-line style={{ "--i": 0 } as React.CSSProperties}>
                Software people
              </span>
            </span>
            <span className="line">
              <span data-line style={{ "--i": 1 } as React.CSSProperties}>
                open every day
              </span>
            </span>
          </h1>
          <p className="mt-6 max-w-[38ch] text-[length:var(--step-lead)] leading-[1.5] text-soft" data-load style={{ "--d": "420ms" } as React.CSSProperties}>
            {sentence}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3" data-load style={{ "--d": "520ms" } as React.CSSProperties}>
            <Link href="/contact" className="btn btn-brand">
              Start a project
            </Link>
            <Link href="/work" className="link inline-flex min-h-11 items-center font-medium">
              See the work
            </Link>
          </div>
        </div>
        <div
          data-hero-mark
          className="order-1 h-[min(50vw,220px)] justify-self-center md:order-2 md:col-span-6 md:h-[clamp(280px,52svh,520px)] md:justify-self-end md:pr-[calc(var(--margin)*1.5)] lg:col-span-6 lg:col-start-7 lg:pr-[calc(var(--margin)*2.5)]"
        >
          <HeroMark />
        </div>
      </div>
    </Hero3D>
  );
}
