import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ShimmerImage } from "@/components/media/shimmer-image";
import { Reveal } from "@/components/motion/reveal";
import type { ProjectCard } from "@/lib/types";

interface WorkGridProps {
  projects: ProjectCard[];
  /** How many leading covers load eagerly (the ones above the fold). */
  priorityCount?: number;
}

/**
 * Compact project cards: the cover at 4:3 on a raised panel, title and kind beneath.
 * Two columns up to a tablet, four on a wide screen, so four or twelve cards always fill their rows.
 */
export function WorkGrid({ projects, priorityCount = 0 }: WorkGridProps) {
  return (
    <Reveal
      as="ul"
      stagger={0.05}
      className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-4"
    >
      {projects.map((p, i) => (
        <li key={p.id} data-reveal className="min-w-0">
          <Link href={`/work/${p.slug}`} className="group block rounded-xl">
            <div className="relative">
              <ShimmerImage
                media={p.cover}
                alt=""
                fill
                preload={i < priorityCount}
                sizes="(min-width: 1024px) 23vw, (min-width: 768px) 31vw, 48vw"
                className="aspect-[4/3] rounded-xl bg-raised"
                imgClassName="transition-transform duration-500 ease-[var(--ease-soft)] group-hover:scale-[1.04]"
              />
              <span
                aria-hidden="true"
                className="absolute right-3 bottom-3 grid size-10 translate-y-1 place-items-center rounded-full bg-ground/90 text-ink opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
              >
                <ArrowUpRight className="size-5" />
              </span>
            </div>
            <p className="mt-3 truncate text-[0.9375rem] leading-tight font-medium transition-colors group-hover:text-brand-ink">
              {p.title}
            </p>
            <p className="mt-1 text-sm text-soft num">
              {p.category.name}
              {p.year ? `, ${p.year}` : ""}
            </p>
          </Link>
        </li>
      ))}
    </Reveal>
  );
}
