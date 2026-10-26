import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { getFeaturedProjects, getHeroVideo } from "@/lib/data/public";
import { Hero3D, type HeroProject } from "./hero-3d";
import { FLIGHT } from "./flight";
import { heroSignature } from "./hero-captions";
import { HeroMark } from "./hero-mark";
import { HeroChoice, HeroVideo } from "./hero-video";

/**
 * One optimised width for every hero picture: big enough for a panel filling a desktop screen,
 * small enough for a phone's GPU. Built directly because the URL feeds WebGL textures and SVG
 * images, not an <img srcset>. The default loader resizes it, never past the 2000px originals.
 */
function optimised(url: string, width = 828): string {
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=80`;
}

/**
 * A plain two-line title beside the logo's mark, drawn in the logo's blue.
 * Where WebGL is available the mark then lifts off the page in 3D and the scroll becomes a
 * flight past the shipped apps.
 */
export async function Hero() {
  // getFeaturedProjects(12) is the same cached call the work and process sections make.
  const [featured, recorded] = await Promise.all([
    getFeaturedProjects(12),
    getHeroVideo(),
  ]);

  const projects: HeroProject[] = featured.slice(0, FLIGHT).map((p) => ({
    title: p.title,
    slug: p.slug,
    category: p.category.name,
    src: optimised(p.cover.url),
    icon: p.icon ? optimised(p.icon.url, 256) : null,
  }));

  const copy = (
    <div className="frame relative z-10 grid min-h-svh grid-cols-1 content-center gap-y-10 pt-24 pb-[calc(var(--margin)*2)] md:grid-cols-12 md:gap-x-[var(--gutter)] md:pt-20">
      <div data-hero-copy className="order-2 md:order-1 md:col-span-7">
        <h1
          id="hero-title"
          className="lines text-[clamp(2.25rem,4.6vw,4.4rem)] leading-[1.06] font-bold tracking-[-0.035em] text-white"
        >
          <span className="line lg:whitespace-nowrap">
            <span data-line style={{ "--i": 0 } as React.CSSProperties}>
              Digital solutions.
            </span>
          </span>
          <span className="line lg:whitespace-nowrap">
            <span data-line style={{ "--i": 1 } as React.CSSProperties}>
              <span className="text-shine">Built for what&apos;s next.</span>
            </span>
          </span>
        </h1>
        <p
          className="mt-6 max-w-[440px] text-[length:var(--step-lead)] leading-[1.55] text-white/60"
          data-load
          style={{ "--d": "420ms" } as React.CSSProperties}
        >
          We build powerful websites, mobile apps, and ERP solutions that help
          businesses grow, work smarter, and move forward.
        </p>
        <div
          className="mt-8 flex flex-wrap items-center gap-3"
          data-load
          style={{ "--d": "520ms" } as React.CSSProperties}
        >
          <Link href="/contact" className="btn btn-brand">
            Start a project
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/work"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-6 font-medium text-white ring-1 ring-white/25 transition-[background-color,box-shadow] duration-300 hover:bg-white/10 hover:ring-white/50"
          >
            Explore our work
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div
        data-hero-mark
        className="order-1 h-[min(34vw,140px)] justify-self-center md:order-2 md:col-span-5 md:h-[clamp(170px,30svh,290px)] md:justify-self-end md:pr-[calc(var(--margin)*1.5)] lg:col-start-8 lg:pr-[calc(var(--margin)*2)]"
      >
        <HeroMark />
      </div>
    </div>
  );

  const live = (
    <Hero3D projects={projects} labelledBy="hero-title">
      {copy}
    </Hero3D>
  );
  // A recorded banner, when one has been published and still matches the projects, plays instead of the live 3D
  // flight: same picture, nothing to compute. When a project has been added or changed since it was recorded,
  // the live flight (which always follows the current projects) takes over until a new video is recorded
  // (scripts/hero-video-watch.mjs does that by itself).
  if (recorded && recorded.signature === heroSignature(projects)) {
    return (
      <HeroChoice
        live={live}
        recorded={
          <HeroVideo config={recorded} labelledBy="hero-title">
            {copy}
          </HeroVideo>
        }
      />
    );
  }
  return live;
}
