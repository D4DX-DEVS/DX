"use client";

import { Loader2 } from "@/components/icons";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ActionResult } from "@/lib/types";

const OPTIONS = [
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "archived", label: "Archived" },
];

interface InboxStatusSelectProps {
  id: string;
  value: string;
  /** Bound server action that saves the status for this entry. */
  action: (status: string) => Promise<ActionResult>;
}

/** Saves as soon as a new status is picked; reverts if the save fails. */
export function InboxStatusSelect({ id, value, action }: InboxStatusSelectProps) {
  const router = useRouter();
  const [status, setStatus] = useState(value);
  const [pending, startTransition] = useTransition();

  function change(next: string) {
    const previous = status;
    setStatus(next);
    startTransition(async () => {
      const result = await action(next);
      if (!result.ok) {
        setStatus(previous);
        toast.error(result.message ?? "Could not change the status.");
        return;
      }
      toast.success(`Marked as ${next}.`);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={change} disabled={pending}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending ? <Loader2 className="size-4 animate-spin text-soft" aria-label="Saving" /> : null}
    </div>
  );
}
