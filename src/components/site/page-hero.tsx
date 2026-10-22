import { MarkIcon } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  /** Extra content under the lead: actions, meta, filters. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * The dark band that opens every inner page under the header, the same ground as the home hero,
 * before the light page below it.
 */
export function PageHero({ eyebrow, title, lead, children, className }: PageHeroProps) {
  return (
    <section className={cn("relative -mt-20 overflow-hidden pt-20", className)}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_10%,rgb(45_80_210/0.28),transparent_70%)]"
      />
      <MarkIcon className="pointer-events-none absolute -right-[4%] -bottom-[30%] w-[min(55vw,520px)] text-brand/[0.12]" />
      <div className="frame relative pt-[clamp(3rem,7vw,6rem)] pb-[clamp(3rem,6vw,5rem)]">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 max-w-[20ch] text-[length:var(--step-xl)] leading-[1.02] font-medium tracking-[-0.035em]">{title}</h1>
        {lead ? <p className="mt-6 max-w-[52ch] text-[length:var(--step-lead)] leading-[1.5] text-soft">{lead}</p> : null}
        {children}
      </div>
    </section>
  );
}
