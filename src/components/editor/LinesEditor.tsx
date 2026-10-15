"use client";

import { Plus, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { moveById, newBullet, removeById } from "@/lib/ops";
import { useCv } from "@/lib/store";
import type { Bullet, Resume } from "@/lib/types";
import { DragHandle, SortableItem, SortableList } from "../Sortable";
import { AutoTextarea, Button, IconButton } from "../ui";

/** Ctrl/Cmd+B toggles **bold** around the selection. Returns true when the key was handled. */
export function handleBoldShortcut(e: KeyboardEvent<HTMLTextAreaElement>, onChange: (v: string) => void): boolean {
  if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "b") return false;
  e.preventDefault();
  const el = e.currentTarget;
  const { selectionStart: s, selectionEnd: t, value: v } = el;
  const selected = v.slice(s, t);
  const isWrapped = v.slice(s - 2, s) === "**" && v.slice(t, t + 2) === "**";
  const next = isWrapped ? v.slice(0, s - 2) + selected + v.slice(t + 2) : `${v.slice(0, s)}**${selected}**${v.slice(t)}`;
  onChange(next);
  const shift = isWrapped ? -2 : 2;
  requestAnimationFrame(() => el.setSelectionRange(s + shift, t + shift));
  return true;
}

export function LinesEditor({
  items,
  select,
  group,
  placeholder,
  addLabel,
  marker = true,
}: {
  items: Bullet[];
  /** Locates this list inside a resume draft. */
  select: (r: Resume) => Bullet[] | undefined;
  group: string;
  placeholder: string;
  addLabel: string;
  marker?: boolean;
}) {
  const edit = useCv((s) => s.edit);
  const refs = useRef(new Map<string, HTMLTextAreaElement>());
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    if (!focusId) return;
    const el = refs.current.get(focusId);
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      setFocusId(null);
    }
  }, [focusId, items]);

  const update = (id: string, text: string) =>
    edit((r) => {
      const b = select(r)?.find((x) => x.id === id);
      if (b) b.text = text;
    }, `${group}:${id}`);

  const insertAfter = (id: string | null) => {
    const b = newBullet();
    edit((r) => {
      const list = select(r);
      if (!list) return;
      const i = id ? list.findIndex((x) => x.id === id) : list.length - 1;
      list.splice(i + 1, 0, b);
    });
    setFocusId(b.id);
  };

  const remove = (id: string, focusPrev: boolean) => {
    const i = items.findIndex((x) => x.id === id);
    edit((r) => {
      const list = select(r);
      if (list) removeById(list, id);
    });
    if (focusPrev && i > 0) setFocusId(items[i - 1].id);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>, b: Bullet) => {
    if (handleBoldShortcut(e, (v) => update(b.id, v))) return;
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      insertAfter(b.id);
    } else if (e.key === "Backspace" && b.text === "" && items.length > 0) {
      e.preventDefault();
      remove(b.id, true);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <SortableList
        ids={items.map((b) => b.id)}
        onMove={(a, o) =>
          edit((r) => {
            const list = select(r);
            if (list) moveById(list, a, o);
          })
        }
        className="flex flex-col gap-1"
      >
        {items.map((b) => (
          <SortableItem key={b.id} id={b.id}>
            <div className="group/line flex items-start gap-1">
              <DragHandle className="mt-[5px]" />
              {marker && <span className="mt-[13px] size-[4px] shrink-0 rounded-full bg-[#b5b4b0]" aria-hidden />}
              <AutoTextarea
                ref={(el) => {
                  if (el) refs.current.set(b.id, el);
                  else refs.current.delete(b.id);
                }}
                value={b.text}
                placeholder={placeholder}
                onChange={(e) => update(b.id, e.target.value)}
                onKeyDown={(e) => onKeyDown(e, b)}
                className="ml-1"
              />
              <IconButton
                label="Remove line"
                tone="danger"
                onClick={() => remove(b.id, false)}
                className="mt-[2px] opacity-0 focus-visible:opacity-100 group-hover/line:opacity-100"
              >
                <X size={13} weight="bold" />
              </IconButton>
            </div>
          </SortableItem>
        ))}
      </SortableList>
      <div>
        <Button variant="ghost" className="h-7 px-2 text-muted" onClick={() => insertAfter(null)}>
          <Plus size={13} weight="bold" />
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
