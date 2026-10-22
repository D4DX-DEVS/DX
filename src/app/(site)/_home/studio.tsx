import { ArrowUpRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import mavoor from "@/assets/mavoor-road.jpg";
import { ShimmerImage } from "@/components/media/shimmer-image";
import { Marquee } from "@/components/motion/marquee";
import { Reveal } from "@/components/motion/reveal";
import { getClients, getSettings, getTeam } from "@/lib/data/public";
import type { Media, TeamMemberDTO } from "@/lib/types";

const STACK = 5;
const PORTRAITS_WIDE = 12;

/** Portraits overlapping in a row, with how many more there are. */
function Faces({ team }: { team: TeamMemberDTO[] }) {
  const withPhoto = team.filter((m): m is TeamMemberDTO & { photo: Media } => m.photo !== null);
  const shown = withPhoto.slice(0, STACK);
  const more = team.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((m, i) => (
        <ShimmerImage
          key={m.id}
          media={m.photo}
          alt=""
          fill
          sizes="48px"
          className="size-11 rounded-full bg-raised-2 ring-[3px] ring-raised sm:size-12"
          style={{ marginLeft: i === 0 ? 0 : "-0.75rem", zIndex: STACK - i }}
        />
      ))}
      {more > 0 ? <span className="ml-3 text-[0.9375rem] text-soft">and {more} more</span> : null}
    </div>
  );
}

/** One portrait in the team strip. */
function Portrait({ member }: { member: TeamMemberDTO }) {
  return (
    <figure className="w-36 shrink-0 sm:w-44">
      {member.photo ? (
        <ShimmerImage media={member.photo} alt="" fill sizes="176px" className="aspect-[4/5] rounded-2xl bg-raised-2" />
      ) : (
        <div className="aspect-[4/5] rounded-2xl bg-raised-2" />
      )}
      <figcaption className="mt-3 leading-snug">
        <span className="block truncate text-[0.9375rem] font-medium">{member.name}</span>
        <span className="block truncate text-sm text-soft">{member.role}</span>
      </figcaption>
    </figure>
  );
}

/** Who the studio is and where: a word about it, the street, the people, the clients. */
export async function Studio() {
  const [team, clients, settings] = await Promise.all([getTeam(), getClients(), getSettings()]);
  // Enough portraits in each half of the strip to cover a wide screen without a gap.
  const repeat = Math.ceil(PORTRAITS_WIDE / Math.max(1, team.length));

  return (
    <section aria-labelledby="studio-title" className="pt-[var(--section-gap)]">
      <Reveal stagger={0.08} className="frame">
        <h2 id="studio-title" data-reveal className="text-[length:var(--step-head)] leading-tight font-semibold tracking-[-0.02em]">
          The studio
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
          <div data-reveal className="flex flex-col rounded-3xl bg-raised p-6 sm:p-8 md:p-10 lg:col-span-7">
            <p className="max-w-[44ch] text-[clamp(1.125rem,1.6vw,1.375rem)] leading-[1.5]">
              D4DX Innovations LLP is an IT services and consulting company on Mavoor Road in Calicut. We design and build
              applications and technology products for organisations across sectors, and we stay on after launch to keep them
              running.
            </p>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-4 pt-10">
              <Faces team={team} />
              <Link href="/about" className="btn btn-quiet">
                Meet the team
              </Link>
            </div>
          </div>

          <div data-reveal className="flex flex-col overflow-hidden rounded-3xl bg-raised lg:col-span-5">
            <div className="relative aspect-[16/10]">
              <Image
                src={mavoor}
                alt="Mavoor Road, Kozhikode, where the studio is"
                placeholder="blur"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover object-[50%_42%]"
              />
            </div>
            <div className="flex flex-1 flex-col gap-4 p-6 sm:p-8">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-brand-ink" aria-hidden="true" />
                <address className="leading-relaxed not-italic">
                  <span className="block font-semibold">Mavoor Road, Calicut</span>
                  <span className="block text-[0.9375rem] text-soft">{settings.addressLines.join(", ")}</span>
                </address>
              </div>
              {settings.mapUrl ? (
                <a
                  href={settings.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex min-h-11 items-center gap-1.5 self-start text-[0.9375rem] font-medium text-brand-ink"
                >
                  <span className="link">Get directions</span>
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </Reveal>

      {team.length ? (
        <div className="mt-3 sm:mt-4">
          <h3 className="sr-only">The team</h3>
          <Marquee
            label="The team"
            duration={team.length * repeat * 4}
            repeat={repeat}
            className="py-4 [--marquee-gap:1rem] sm:[--marquee-gap:1.25rem]"
          >
            {team.map((m) => (
              <Portrait key={m.id} member={m} />
            ))}
          </Marquee>
        </div>
      ) : null}

      {clients.length ? (
        <Reveal stagger={0.06} className="frame mt-3 sm:mt-4">
          <div data-reveal className="rounded-3xl bg-raised p-6 sm:p-8">
            <h3 className="text-[0.9375rem] font-semibold">Clients</h3>
            <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
              {clients.map((c) => (
                <li key={c.client} className="leading-snug">
                  <span className="block font-medium">{c.client}</span>
                  <Link href={`/work/${c.slug}`} className="link inline-flex min-h-11 items-center text-[0.9375rem] text-soft">
                    {c.project}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      ) : null}
    </section>
  );
}
