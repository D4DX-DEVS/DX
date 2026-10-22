import { CalendarDays, Package, Smartphone, Users, type LucideIcon } from "lucide-react";
import { cacheLife } from "next/cache";
import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { getProjectIndex, getTeam } from "@/lib/data/public";

interface Stat {
  icon: LucideIcon;
  value: number;
  label: string;
  suffix?: string;
}

/**
 * The record in four numbers, all counted from the CMS, on a band of the brand's tint.
 * Cached like the footer: "years" needs today's date, which is only allowed in a cached scope.
 */
export async function Proof() {
  "use cache";
  cacheLife("content");
  const [index, team] = await Promise.all([getProjectIndex(), getTeam()]);
  const years = index.map((p) => p.year).filter((y): y is number => y !== null);
  const since = years.length ? Math.min(...years) : null;
  const stats: Stat[] = [
    { icon: Package, value: index.length, label: "Products shipped" },
    { icon: Smartphone, value: index.filter((p) => p.onStores).length, label: "Apps on the stores" },
    { icon: Users, value: team.length, label: "People in the studio" },
    ...(since ? [{ icon: CalendarDays, value: new Date().getFullYear() - since, suffix: "+", label: `Years shipping, since ${since}` }] : []),
  ];

  return (
    <section aria-labelledby="proof-title" className="mt-[var(--section-gap)] bg-[var(--brand-tint)] bg-[radial-gradient(rgb(45_80_210/0.12)_1px,transparent_1px)] [background-size:22px_22px]">
      <Reveal stagger={0.08} className="frame grid grid-cols-1 items-center gap-y-10 py-[clamp(3rem,6vw,5rem)] lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
        <div className="lg:col-span-4">
          <p data-reveal className="eyebrow">
            Our impact
          </p>
          <h2 id="proof-title" data-reveal className="mt-3 max-w-[18ch] text-[length:var(--step-head)] leading-tight font-semibold tracking-[-0.02em]">
            Numbers that reflect our journey
          </h2>
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-8 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} data-reveal className="flex flex-col gap-3 rounded-2xl bg-raised p-5 shadow-[0_1px_2px_rgb(11_20_48/0.05)] sm:p-6">
                <Icon className="size-5 text-brand-ink sm:size-6" aria-hidden="true" />
                <dd className="text-[clamp(1.75rem,3vw,2.5rem)] leading-none font-semibold tracking-[-0.03em] num">
                  <CountUp value={s.value} suffix={s.suffix} />
                </dd>
                <dt className="text-sm leading-snug text-soft">{s.label}</dt>
              </div>
            );
          })}
        </dl>
      </Reveal>
    </section>
  );
}
