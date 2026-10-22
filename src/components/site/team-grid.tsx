import { UserRound } from "lucide-react";
import { ShimmerImage } from "@/components/media/shimmer-image";
import { Reveal } from "@/components/motion/reveal";
import type { TeamMemberDTO } from "@/lib/types";

/** The studio's people: a portrait, a name and a role each, linking to LinkedIn where given. */
export function TeamGrid({ team }: { team: TeamMemberDTO[] }) {
  if (!team.length) {
    return <p className="text-soft">The team will appear here once it is published from the admin.</p>;
  }
  return (
    <Reveal as="ul" stagger={0.04} className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-5">
      {team.map((m) => {
        const body = (
          <>
            {m.photo ? (
              <ShimmerImage
                media={m.photo}
                alt=""
                fill
                sizes="(min-width: 1024px) 18vw, (min-width: 640px) 31vw, 48vw"
                className="aspect-[4/5] rounded-2xl bg-raised-2"
                imgClassName="transition-transform duration-500 ease-[var(--ease-soft)] group-hover:scale-[1.04]"
              />
            ) : (
              <div className="grid aspect-[4/5] place-items-center rounded-2xl bg-raised-2 text-soft">
                <UserRound className="size-10" aria-hidden="true" />
              </div>
            )}
            <p className="mt-3 truncate font-semibold leading-tight">{m.name}</p>
            <p className="mt-1 truncate text-sm text-soft">{m.role}</p>
          </>
        );
        return (
          <li key={m.id} data-reveal className="min-w-0">
            {m.linkedin ? (
              <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="group block" aria-label={`${m.name}, ${m.role}, on LinkedIn`}>
                {body}
              </a>
            ) : (
              <div className="group">{body}</div>
            )}
          </li>
        );
      })}
    </Reveal>
  );
}
