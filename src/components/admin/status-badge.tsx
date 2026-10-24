import { Badge } from "@/components/ui/badge";

const POSITIVE = "bg-[var(--positive-tint)] text-positive";
const BRAND = "bg-[var(--brand-tint)] text-brand-ink";
const NEUTRAL = "bg-[var(--chip)] text-[var(--chip-ink)]";

const STYLES = {
  published: { label: "Published", className: POSITIVE },
  draft: { label: "Draft", className: NEUTRAL },
  visible: { label: "Visible", className: POSITIVE },
  hidden: { label: "Hidden", className: NEUTRAL },
  open: { label: "Open", className: POSITIVE },
  closed: { label: "Closed", className: NEUTRAL },
  new: { label: "New", className: BRAND },
  read: { label: "Read", className: NEUTRAL },
  archived: { label: "Archived", className: NEUTRAL },
} as const;

export type StatusKind = keyof typeof STYLES;

/** Status in words with a dot, never colour alone. */
export function StatusBadge({ status }: { status: StatusKind }) {
  const s = STYLES[status];
  return (
    <Badge
      className={`h-6 gap-1.5 border-transparent px-2.5 font-semibold ${s.className}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {s.label}
    </Badge>
  );
}
