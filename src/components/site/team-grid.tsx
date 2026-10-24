import Image from "next/image";
import { ArrowRight, UserRound } from "@/components/icons";
import { ShimmerImage } from "@/components/media/shimmer-image";
import { Reveal } from "@/components/motion/reveal";
import type { TeamMemberDTO } from "@/lib/types";

const CARD = "team-card group relative block overflow-hidden rounded-[2.25rem] bg-raised-2 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ring)]";

/** Rows of up to six (three, then two, on smaller screens); a short last row sits in the middle. */
export const TEAM_ROW = "flex flex-wrap justify-center gap-3 sm:gap-4";
export const TEAM_CELL = "w-[calc((100%-0.75rem)/2)] sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-5rem)/6)]";

/**
 * The studio's people: pencil-sketch portraits (drawn automatically from each photo) that turn to the colour photo and lift on hover, with the
 * name and role sliding up over the photo (see .team-card in globals.css). Where a LinkedIn
 * profile is given the arrow links to it (on a mouse, the whole card does); every card takes focus, so the
 * same reveal works from the keyboard and by tapping on a touch screen.
 * Portraits load lazily, as they near the screen.
 */
export function TeamGrid({ team }: { team: TeamMemberDTO[] }) {
  if (!team.length) {
    return <p className="text-soft">The team will appear here once it is published from the admin.</p>;
  }
  return (
    <Reveal as="ul" stagger={0.05} className={TEAM_ROW}>
      {team.map((m) => {
        const body = (
          <>
            {m.photo ? (
              <ShimmerImage
                media={m.sketch ?? m.photo}
                alt=""
                fill
                sizes="(min-width: 1024px) 15vw, (min-width: 640px) 31vw, 48vw"
                className="aspect-[4/5] bg-white"
                imgClassName={m.sketch ? "team-sketch" : "team-photo"}
              />
                        ) : (
              <div className="grid aspect-[4/5] place-items-center bg-raised-2 text-soft">
                <UserRound className="size-10" aria-hidden="true" />
              </div>
            )}
            {m.sketch && m.photo ? (
              <Image
                src={m.photo.url}
                alt=""
                fill
                sizes="(min-width: 1024px) 15vw, (min-width: 640px) 31vw, 48vw"
                quality={80}
                loading="lazy"
                className="team-colour object-cover"
              />
            ) : null}
            <span aria-hidden="true" className="team-veil" />
            <span aria-hidden="true" className="team-sheen" />
            <span className="absolute inset-x-0 bottom-0 z-[4] p-5 text-center">
              <span className="team-name text-[1.0625rem] leading-tight font-semibold text-white">{m.name}</span>
              <span className="team-role mt-1 text-sm leading-snug text-white/75">{m.role}</span>
            </span>
            {m.linkedin ? (
              <a
                href={m.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${m.name}, ${m.role}, on LinkedIn`}
                className="team-arrow team-link absolute top-4 right-4 z-[4] grid size-10 place-items-center rounded-full bg-brand text-on-brand outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <ArrowRight className="size-[1.125rem]" aria-hidden="true" />
              </a>
            ) : null}
          </>
        );
        return (
          <li key={m.id} data-reveal className={`min-w-0 ${TEAM_CELL}`}>
            {/* Focusable so keyboard users (and a tap on touch screens) reveal the same details as hover. */}
            <div tabIndex={0} role="group" aria-label={`${m.name}, ${m.role}`} className={CARD}>
              {body}
            </div>
          </li>
        );
      })}
    </Reveal>
  );
}
