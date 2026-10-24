"use client";

import { Loader2, Trash2 } from "@/components/icons";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/types";

interface DeleteButtonProps {
  /** What is being deleted, e.g. "Hisaabi". */
  name: string;
  /** What else happens, e.g. "It disappears from the work page." */
  consequence: string;
  action: () => Promise<ActionResult>;
  /** Where to go afterwards; omit to stay and refresh. */
  redirectTo?: string;
  /** Icon-only trigger for table rows. */
  compact?: boolean;
}

export function DeleteButton({
  name,
  consequence,
  action,
  redirectTo,
  compact,
}: DeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.message ?? "Could not delete.");
        return;
      }
      toast.success(`Deleted ${name}.`);
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !pending && setOpen(v)}>
      <AlertDialogTrigger asChild>
        {compact ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${name}`}
            className="text-soft hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button variant="destructive">
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {consequence} This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="size-4" aria-hidden="true" />
            )}
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
