import { ArrowRight } from "@/components/icons";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { BandLights } from "@/components/site/band-lights";
import { NeuralField } from "@/components/site/neural-field";
import { TeamGrid } from "@/components/site/team-grid";
import { getTeam } from "@/lib/data/public";
import { SectionHead } from "./section-head";

const TECH = [
  { label: "</>", className: "left-[3%] top-[18%]", delay: "0s" },
  { label: "AI", className: "right-[4%] top-[12%]", delay: "-2s" },
  { label: "{ }", className: "right-[2%] bottom-[18%]", delay: "-4s" },
  { label: "01", className: "left-[2%] bottom-[14%]", delay: "-6s" },
  { label: "API", className: "left-[48%] top-[3%]", delay: "-3s" },
];

/** The people who build the work, on a dark band: everyone, in rows of six. */
export async function Team() {
  const team = await getTeam();
  if (!team.length) return null;

  return (
    <section
      aria-labelledby="team-title"
      className="theme-dark dark-band py-[clamp(2.5rem,5vw,4rem)]"
    >
      <BandLights />
      <NeuralField className="absolute inset-0 -z-10 size-full opacity-80" />
      <div aria-hidden="true" className="tech-grid absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hidden md:block"
      >
        {TECH.map((c) => (
          <span
            key={c.label}
            className={`tech-chip absolute ${c.className}`}
            style={{ animationDelay: c.delay }}
          >
            {c.label}
          </span>
        ))}
      </div>
      <div className="frame">
        <Reveal>
          <SectionHead
            id="team-title"
            eyebrow="Our team"
            title={
              <>
                The people behind <span className="text-shine">D4DX</span>
              </>
            }
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
          <TeamGrid team={team} />
        </div>
      </div>
    </section>
  );
}
