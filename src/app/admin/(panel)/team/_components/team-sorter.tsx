"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical, UserRound } from "@/components/icons";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { reorderTeam } from "@/lib/actions/admin/team";
import type { TeamListRow } from "@/lib/data/admin/team";
import { cn } from "@/lib/utils";

interface RowProps {
  member: TeamListRow;
  position: number;
  last: boolean;
  busy: boolean;
  onMove: (direction: -1 | 1) => void;
}

function Row({ member, position, last, busy, onMove }: RowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: member.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-raised shadow-[var(--shadow-card)] p-2.5 pr-3 sm:gap-4",
        isDragging && "relative z-10 border-brand-ink/60 shadow-[0_18px_40px_-16px_rgb(11_20_48/0.28)]",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Move ${member.name}. Press space, then the arrow keys.`}
        className="grid size-10 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-soft transition-colors hover:bg-raised-2 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing"
      >
        <GripVertical className="size-5" aria-hidden="true" />
      </button>
      <span className="num w-6 shrink-0 text-center text-sm text-soft">{position}</span>
      <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-raised-2 text-soft">
        {member.photo_url ? <Image src={member.photo_url} alt="" fill sizes="44px" className="object-cover" /> : <UserRound className="size-5" aria-hidden="true" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-ink">{member.name}</span>
        <span className="block truncate text-xs text-soft">{member.role}</span>
      </span>
      <span className="hidden sm:block">
        <StatusBadge status={member.published ? "visible" : "hidden"} />
      </span>
      <span className="flex shrink-0">
        <Button type="button" variant="ghost" size="icon" aria-label={`Move ${member.name} up`} disabled={position === 1 || busy} onClick={() => onMove(-1)}>
          <ChevronUp className="size-4" aria-hidden="true" />
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label={`Move ${member.name} down`} disabled={last || busy} onClick={() => onMove(1)}>
          <ChevronDown className="size-4" aria-hidden="true" />
        </Button>
      </span>
    </li>
  );
}

/**
 * The team in site order, as a list to drag. Each drop (or arrow press) saves at once: the list
 * moves first, and goes back with a message if the save fails.
 */
export function TeamSorter({ initial }: { initial: TeamListRow[] }) {
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function commit(next: TeamListRow[]) {
    const previous = items;
    setItems(next);
    startTransition(async () => {
      const result = await reorderTeam(next.map((m) => m.id));
      if (!result.ok) {
        setItems(previous);
        toast.error(result.message ?? "Could not save the order.");
        return;
      }
      toast.success("Order saved.");
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((m) => m.id === active.id);
    const to = items.findIndex((m) => m.id === over.id);
    if (from < 0 || to < 0) return;
    commit(arrayMove(items, from, to));
  }

  function move(index: number, direction: -1 | 1) {
    const to = index + direction;
    if (to < 0 || to >= items.length) return;
    commit(arrayMove(items, index, to));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((m) => m.id)} strategy={verticalListSortingStrategy}>
        <ol aria-label="Team members in site order" aria-busy={pending} className="space-y-2">
          {items.map((m, i) => (
            <Row key={m.id} member={m} position={i + 1} last={i === items.length - 1} busy={pending} onMove={(d) => move(i, d)} />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
