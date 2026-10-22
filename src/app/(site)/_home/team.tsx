import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { TeamGrid } from "@/components/site/team-grid";
import { getTeam } from "@/lib/data/public";
import { SectionHead } from "./section-head";

const SHOWN = 10;

/** The people who build the work: the first ten, with the rest on the about page. */
export async function Team() {
  const team = await getTeam();
  if (!team.length) return null;

  return (
    <section aria-labelledby="team-title" className="frame pt-[var(--section-gap)]">
      <Reveal>
        <SectionHead
          id="team-title"
          eyebrow="Our team"
          title="The people behind D4DX"
          lead={`Designers, developers and testers working together from our studio on Mavoor Road, ${team.length} of us in all.`}
          action={
            <Link href="/about#team" className="btn btn-outline min-h-11">
              Meet the team
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          }
        />
      </Reveal>
      <div className="mt-10">
        <TeamGrid team={team.slice(0, SHOWN)} />
      </div>
    </section>
  );
}
