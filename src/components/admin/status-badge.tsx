import { Circle, CircleCheck, CircleDashed, Archive, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STYLES = {
  published: { label: "Published", icon: CircleCheck, className: "bg-[color-mix(in_oklab,var(--positive)_18%,transparent)] text-positive" },
  draft: { label: "Draft", icon: CircleDashed, className: "bg-raised-2 text-soft" },
  visible: { label: "Visible", icon: Eye, className: "bg-[color-mix(in_oklab,var(--positive)_18%,transparent)] text-positive" },
  hidden: { label: "Hidden", icon: CircleDashed, className: "bg-raised-2 text-soft" },
  open: { label: "Open", icon: CircleCheck, className: "bg-[color-mix(in_oklab,var(--positive)_18%,transparent)] text-positive" },
  closed: { label: "Closed", icon: CircleDashed, className: "bg-raised-2 text-soft" },
  new: { label: "New", icon: Circle, className: "bg-[color-mix(in_oklab,var(--brand)_25%,transparent)] text-brand-ink" },
  read: { label: "Read", icon: CircleCheck, className: "bg-raised-2 text-soft" },
  archived: { label: "Archived", icon: Archive, className: "bg-raised-2 text-soft" },
} as const;

export type StatusKind = keyof typeof STYLES;

/** Status in words and an icon, never colour alone. */
export function StatusBadge({ status }: { status: StatusKind }) {
  const s = STYLES[status];
  return (
    <Badge className={`gap-1 border-transparent ${s.className}`}>
      <s.icon aria-hidden="true" />
      {s.label}
    </Badge>
  );
}
