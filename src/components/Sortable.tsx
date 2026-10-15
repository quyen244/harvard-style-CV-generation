"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVertical } from "@phosphor-icons/react";
import { createContext, useContext, useId, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./ui";

/** A vertical list whose children can be reordered by dragging their handle (or with the keyboard). */
export function SortableList({
  ids,
  onMove,
  children,
  className,
}: {
  ids: string[];
  onMove: (activeId: string, overId: string) => void;
  children: ReactNode;
  className?: string;
}) {
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
  };
  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={className}>{children}</div>
      </SortableContext>
    </DndContext>
  );
}

type HandleCtx = { attributes: HTMLAttributes<HTMLElement>; listeners: object | undefined; setActivator: (el: HTMLElement | null) => void };
const Handle = createContext<HandleCtx | null>(null);

export function SortableItem({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cx("relative", isDragging && "z-20 opacity-90 [&>*]:shadow-[0_8px_24px_rgba(0,0,0,0.08)]", className)}
    >
      <Handle.Provider value={{ attributes: attributes as HTMLAttributes<HTMLElement>, listeners, setActivator: setActivatorNodeRef }}>
        {children}
      </Handle.Provider>
    </div>
  );
}

export function DragHandle({ label = "Drag to reorder", className }: { label?: string; className?: string }) {
  const ctx = useContext(Handle);
  if (!ctx) return null;
  const { attributes, listeners, setActivator } = ctx;
  return (
    <button
      type="button"
      ref={setActivator}
      {...attributes}
      {...listeners}
      aria-label={label}
      title={label}
      className={cx(
        "flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-[4px] text-faint transition-colors hover:bg-black/[0.05] hover:text-ink active:cursor-grabbing",
        className,
      )}
    >
      <DotsSixVertical size={14} weight="bold" />
    </button>
  );
}
