import { cn } from "@/lib/utils";
import { TitleFx } from "@/components/motion/title-fx";

interface SectionHeadProps {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  /** A sentence beside the title on wide screens, under it on a phone. */
  lead?: string;
  /** An action at the far end of the row, such as "View all". */
  action?: React.ReactNode;
  className?: string;
}

/** The eyebrow, title and lead that open each section below the hero. */
export function SectionHead({ id, eyebrow, title, lead, action, className }: SectionHeadProps) {
  return (
    <div className={cn("grid grid-cols-1 items-end gap-x-[var(--gutter)] gap-y-4 md:grid-cols-12", className)}>
      <div data-reveal className="md:col-span-5">
        <p className="eyebrow">{eyebrow}</p>
        <TitleFx as="h2" id={id} className="mt-3 text-[length:var(--step-head)] leading-tight font-semibold tracking-[-0.02em]">
          {title}
        </TitleFx>
      </div>
      {lead ? (
        <p data-reveal className={cn("max-w-[48ch] text-soft md:col-span-4", action ? "md:col-start-6" : "md:col-start-7 md:col-span-6")}>
          {lead}
        </p>
      ) : null}
      {action ? (
        <div data-reveal className="md:col-span-3 md:col-start-10 md:justify-self-end">
          {action}
        </div>
      ) : null}
    </div>
  );
}
