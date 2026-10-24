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
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical } from "@/components/icons";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface SortRow {
  id: string;
  title: string;
  subtitle?: string;
  /** A short label at the right, such as "Open" or "Closed". */
  tag?: string;
  /** Greys the row (a closed position, a hidden person). */
  muted?: boolean;
}

interface RowProps {
  row: SortRow;
  position: number;
  last: boolean;
  busy: boolean;
  onMove: (direction: -1 | 1) => void;
}

function Row({ row, position, last, busy, onMove }: RowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-raised shadow-[var(--shadow-card)] p-2.5 pr-3 sm:gap-4",
        isDragging &&
          "relative z-10 border-brand-ink/60 shadow-[0_18px_40px_-16px_rgb(11_20_48/0.28)]",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Move ${row.title}. Press space, then the arrow keys.`}
        className="grid size-10 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-soft transition-colors hover:bg-raised-2 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing"
      >
        <GripVertical className="size-5" aria-hidden="true" />
      </button>
      <span className="num w-6 shrink-0 text-center text-sm text-soft">
        {position}
      </span>
      <span className={cn("min-w-0 flex-1", row.muted && "opacity-60")}>
        <span className="block truncate font-medium text-ink">{row.title}</span>
        {row.subtitle ? (
          <span className="block truncate text-xs text-soft">
            {row.subtitle}
          </span>
        ) : null}
      </span>
      {row.tag ? (
        <Badge variant="secondary" className="hidden sm:inline-flex">
          {row.tag}
        </Badge>
      ) : null}
      <span className="flex shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Move ${row.title} up`}
          disabled={position === 1 || busy}
          onClick={() => onMove(-1)}
        >
          <ChevronUp className="size-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Move ${row.title} down`}
          disabled={last || busy}
          onClick={() => onMove(1)}
        >
          <ChevronDown className="size-4" aria-hidden="true" />
        </Button>
      </span>
    </li>
  );
}

interface SortableListProps {
  rows: SortRow[];
  /** Called with every id in the new order; each drop or arrow press saves at once. */
  onSave: (ids: string[]) => Promise<ActionResult>;
  label: string;
}

/** A list to drag (or nudge with arrows or the keyboard) into a new order. It saves on every move and goes back if that fails. */
export function SortableList({
  rows: initial,
  onSave,
  label,
}: SortableListProps) {
  const [rows, setRows] = useState(initial);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function commit(next: SortRow[]) {
    const previous = rows;
    setRows(next);
    startTransition(async () => {
      const result = await onSave(next.map((r) => r.id));
      if (!result.ok) {
        setRows(previous);
        toast.error(result.message ?? "Could not save the order.");
        return;
      }
      toast.success("Order saved.");
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = rows.findIndex((r) => r.id === active.id);
    const to = rows.findIndex((r) => r.id === over.id);
    if (from >= 0 && to >= 0) commit(arrayMove(rows, from, to));
  }

  function move(index: number, direction: -1 | 1) {
    const to = index + direction;
    if (to >= 0 && to < rows.length) commit(arrayMove(rows, index, to));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={rows.map((r) => r.id)}
        strategy={verticalListSortingStrategy}
      >
        <ol aria-label={label} aria-busy={pending} className="space-y-2">
          {rows.map((r, i) => (
            <Row
              key={r.id}
              row={r}
              position={i + 1}
              last={i === rows.length - 1}
              busy={pending}
              onMove={(d) => move(i, d)}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
