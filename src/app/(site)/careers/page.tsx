import type { Metadata } from "next";
import { Suspense } from "react";
import { TitleFx } from "@/components/motion/title-fx";
import { Lines } from "@/components/site/skeletons";
import { getCareersContent, getOpenJobs } from "@/lib/data/public";
import { sanitizeRichText } from "@/lib/sanitize";
import { PositionsTable } from "./_components/positions-table";

export const metadata: Metadata = {
  title: "Join Our Team",
  description: "Open positions at D4DX Innovations, Mavoor Road, Calicut. Build apps, websites, ERP and SaaS used every day.",
};

/** The page title with its last word picked out in the brand gradient, underlined. */
function Title({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  const last = words.pop() ?? "";
  return (
    <TitleFx as="h1" id="careers-title" className="text-[clamp(2.5rem,5.6vw,4.75rem)] leading-[1.05] font-medium tracking-[-0.035em] text-balance">
      {words.length ? `${words.join(" ")} ` : ""}
      <span className="text-shine">{last}</span>
    </TitleFx>
  );
}

async function Content() {
  const [{ top, bottom }, jobs] = await Promise.all([getCareersContent(), getOpenJobs()]);
  const [intro, ...moreTop] = top;
  const rows = jobs.map((j) => ({ id: j.id, title: j.title, level: j.level, experience: j.experience }));
  const looking = jobs.filter((j) => j.summary || j.requirements.length);

  return (
    <>
      <section aria-labelledby="careers-title" className="relative -mt-20 overflow-hidden pt-20">
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_90%_at_50%_0%,rgb(45_80_210/0.3),transparent_70%)]" />
        <div className="frame-narrow relative py-[clamp(3.5rem,9vw,7rem)] text-center">
          <Title text={intro?.title ?? "Join Our Team"} />
          {intro?.content ? (
            <div className="prose-d4 mx-auto mt-8 max-w-[62ch] text-[length:var(--step-lead)] leading-relaxed text-white/80" dangerouslySetInnerHTML={{ __html: sanitizeRichText(intro.content) }} />
          ) : null}
        </div>
      </section>

      {moreTop.map((block) => (
        <section key={block.slug} aria-label={block.title} className="frame-narrow pb-[var(--section-gap)]">
          <h2 className="text-[length:var(--step-head)] leading-tight font-semibold tracking-[-0.02em]">{block.title}</h2>
          <div className="prose-d4 mt-4 max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeRichText(block.content) }} />
        </section>
      ))}

      <section id="positions" aria-labelledby="positions-title" className="frame-narrow scroll-mt-24 pb-[var(--section-gap)]">
        <TitleFx as="h2" id="positions-title" className="text-[clamp(1.875rem,3.4vw,2.75rem)] leading-tight font-semibold tracking-[-0.025em]">
          Open Positions
        </TitleFx>
        <p className="mt-3 text-white/75">We are currently hiring for the following roles:</p>
        <div className="mt-6">
          <PositionsTable jobs={rows} />
        </div>
      </section>

      {looking.length ? (
        <section aria-labelledby="looking-title" className="frame-narrow pb-[var(--section-gap)]">
          <h2 id="looking-title" className="text-[length:var(--step-head)] leading-tight font-semibold tracking-[-0.02em]">
            What We Are Looking For
          </h2>
          <ul className="mt-5 flex list-disc flex-col gap-4 pl-5 marker:text-brand-ink">
            {looking.map((j) => (
              <li key={j.id} className="leading-relaxed text-white/80">
                <strong className="font-semibold text-white">{j.title}:</strong> {j.summary}
                {j.requirements.length ? (
                  <ul className="mt-2 flex list-[circle] flex-col gap-1.5 pl-5">
                    {j.requirements.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {bottom.map((block) => (
        <section key={block.slug} aria-label={block.title} className="frame-narrow pb-[var(--section-gap)]">
          <h2 className="text-[length:var(--step-head)] leading-tight font-semibold tracking-[-0.02em]">{block.title}</h2>
          <div className="prose-d4 mt-4 max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeRichText(block.content) }} />
        </section>
      ))}
    </>
  );
}

export default function CareersPage() {
  return (
    <Suspense
      fallback={
        <div className="frame-narrow py-24" aria-busy="true" aria-label="Loading">
          <Lines count={8} />
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}
