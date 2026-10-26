import {
  ArrowRight,
  Check,
  Cloud,
  Layers,
  Monitor,
  Smartphone,
  type LucideIcon,
} from "@/components/icons";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import erpArt from "@/assets/services/erp.webp";
import mobileArt from "@/assets/services/mobile-apps.webp";
import saasArt from "@/assets/services/saas.webp";
import websitesArt from "@/assets/services/websites.webp";
import { Reveal } from "@/components/motion/reveal";
import { TitleFx } from "@/components/motion/title-fx";
import { BandLights } from "@/components/site/band-lights";
import { getServices } from "@/lib/data/public";

export interface Look {
  icon: LucideIcon;
  /** Icon and link colour, readable on white. */
  ink: string;
  /** Tile behind the icon and the card's top edge. */
  tint: string;
}

const LOOKS: Record<string, Look> = {
  websites: { icon: Monitor, ink: "#2d50d2", tint: "#e7ecfd" },
  "mobile-apps": { icon: Smartphone, ink: "#0b7f58", tint: "#dcf5ea" },
  erp: { icon: Layers, ink: "#6d34d6", tint: "#eee6fd" },
  saas: { icon: Cloud, ink: "#0b6f8f", tint: "#dcf1f7" },
};

/** Each solution's icon and colour on a light page, shared with the solutions page. */
export function lookFor(slug: string): Look {
  return LOOKS[slug] ?? LOOKS.websites;
}

interface Dark {
  icon: LucideIcon;
  /** Accent: the badge, ticks, link and glow. */
  a: string;
  /** The card's gradient, corner to corner. */
  from: string;
  to: string;
  art: StaticImageData;
  /** Width of the picture as a share of the card. */
  artWidth: string;
}

const DARK: Record<string, Dark> = {
  "mobile-apps": {
    icon: Smartphone,
    a: "#2fd196",
    from: "#0b4a43",
    to: "#06191d",
    art: mobileArt,
    artWidth: "46%",
  },
  websites: {
    icon: Monitor,
    a: "#4f8dff",
    from: "#10358f",
    to: "#071236",
    art: websitesArt,
    artWidth: "52%",
  },
  erp: {
    icon: Layers,
    a: "#9b6dff",
    from: "#3c1d86",
    to: "#0e0a30",
    art: erpArt,
    artWidth: "46%",
  },
  saas: {
    icon: Cloud,
    a: "#ffab3d",
    from: "#6a3708",
    to: "#1d1006",
    art: saasArt,
    artWidth: "42%",
  },
};

function darkFor(slug: string): Dark {
  return DARK[slug] ?? DARK.websites;
}

/**
 * What the studio builds, on a dark band: one colour-washed card per solution with its picture
 * floating in the corner. On hover the card lifts into a glow of its colour, the ticks slide, the
 * link underlines and the arrow fills.
 */
export async function Services() {
  const services = await getServices();
  if (!services.length) return null;

  return (
    <section
      aria-labelledby="services-title"
      className="theme-dark dark-band py-[clamp(2.5rem,5vw,4rem)]"
    >
      <BandLights />
      <div className="frame">
        <Reveal>
          <div className="grid grid-cols-1 items-end gap-x-[var(--gutter)] gap-y-5 md:grid-cols-12">
            <div data-reveal className="md:col-span-5">
              <p className="eyebrow">Our solutions</p>
              <TitleFx
                as="h2"
                id="services-title"
                className="mt-3 text-[clamp(1.875rem,3.2vw,2.75rem)] leading-tight font-semibold tracking-[-0.02em]"
              >
                What <span className="text-shine">we do</span>
              </TitleFx>
            </div>
            <p data-reveal className="max-w-[48ch] text-white/75 md:col-span-4">
              End-to-end digital solutions to help you build, grow and stay
              ahead, each one already shipped and in daily use.
            </p>
            <div
              data-reveal
              aria-hidden="true"
              className="hidden justify-self-end md:col-span-3 md:block"
            >
              <p className="font-script text-[2rem] leading-none text-white/90 -rotate-3">
                Ideas into
                <br />
                <span className="ml-6 inline-block">Real Solutions</span>
              </p>
              <svg
                viewBox="0 0 220 12"
                className="mt-1 ml-6 h-3 w-48 text-brand-ink"
              >
                <path
                  className="sol-script-line"
                  d="M2 8 C 50 2, 120 2, 218 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </Reveal>

        <Reveal
          as="ul"
          stagger={0.1}
          className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5"
        >
          {services.map((s, i) => {
            const d = darkFor(s.slug);
            const Icon = d.icon;
            return (
              <li
                key={s.id}
                data-reveal
                className="sol-card group relative isolate flex min-h-[27rem] flex-col overflow-hidden rounded-3xl p-6 sm:p-7"
                style={
                  {
                    "--a": d.a,
                    "--from": d.from,
                    "--to": d.to,
                    "--i": i,
                  } as React.CSSProperties
                }
              >
                <Image
                  src={d.art}
                  alt=""
                  sizes="(min-width: 1280px) 14vw, 40vw"
                  className="sol-art pointer-events-none absolute top-3 right-3 -z-10 h-auto"
                  style={{ width: d.artWidth }}
                />

                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="sol-badge relative grid size-14 shrink-0 place-items-center rounded-2xl text-white"
                  >
                    <Icon weight="fill" className="size-7" />
                  </span>
                  <span
                    aria-hidden="true"
                    className="sol-num text-[3.25rem] leading-none font-semibold tracking-tight num"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="mt-12 text-xl leading-snug font-semibold tracking-[-0.01em] text-white">
                  {s.title}
                </h3>
                <p className="mt-2 line-clamp-4 leading-relaxed text-white/75">
                  {s.summary}
                </p>

                {s.points.length ? (
                  <ul
                    aria-label={`${s.title} includes`}
                    className="mt-5 flex flex-col gap-2.5"
                  >
                    {s.points.slice(0, 3).map((point, n) => (
                      <li
                        key={point}
                        className="sol-point flex items-center gap-2.5 text-[0.875rem] leading-snug text-white/90"
                        style={{ "--n": n } as React.CSSProperties}
                      >
                        <span
                          aria-hidden="true"
                          className="grid size-[1.125rem] shrink-0 place-items-center rounded-full text-[#07101f]"
                          style={{ background: d.a }}
                        >
                          <Check weight="bold" className="size-3" />
                        </span>
                        <span className="truncate">{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-auto pt-7">
                  <Link
                    href={`/services#${s.slug}`}
                    className="flex min-h-11 w-full items-center justify-between gap-3 text-[0.9375rem] font-semibold outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:outline-2 focus-visible:after:outline-[var(--a)]"
                    style={{ color: d.a }}
                  >
                    <span className="sol-more">
                      Learn more
                      <span className="sr-only"> about {s.title}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="sol-arrow grid size-11 place-items-center rounded-full"
                    >
                      <ArrowRight weight="bold" className="size-[1.125rem]" />
                    </span>
                  </Link>
                </div>
              </li>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
