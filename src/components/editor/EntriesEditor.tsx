"use client";

import { CaretRight, Copy, Eye, EyeSlash, Plus, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { duplicateById, findEntry, moveById, newEntry, removeById } from "@/lib/ops";
import { useCv } from "@/lib/store";
import { deleteWithUndo } from "@/lib/actions";
import type { EntriesSection, Entry, Resume } from "@/lib/types";
import { DragHandle, SortableItem, SortableList } from "../Sortable";
import { Button, cx, Field, IconButton, Input } from "../ui";
import { LinesEditor } from "./LinesEditor";

type EntryField = "title" | "subtitle" | "date" | "place" | "url";

function EntryCard({ sectionId, entry, open, onToggle }: { sectionId: string; entry: Entry; open: boolean; onToggle: () => void }) {
  const edit = useCv((s) => s.edit);

  const withEntry = (fn: (e: Entry) => void, group?: string) =>
    edit((r) => {
      const e = findEntry(r, sectionId, entry.id);
      if (e) fn(e);
    }, group);

  const set = (field: EntryField) => (ev: { target: { value: string } }) =>
    withEntry((e) => {
      e[field] = ev.target.value;
    }, `${entry.id}:${field}`);

  const sectionItems = (r: Resume) => {
    const s = r.sections.find((x) => x.id === sectionId);
    return s?.kind === "entries" ? s.items : undefined;
  };

  const meta = [entry.date, entry.place].filter((x) => x.trim()).join(" · ");

  return (
    <div className={cx("rounded-[8px] border border-line bg-surface transition-colors", entry.hidden && "bg-surface-2")}>
      <div className="group/entry flex items-center gap-1 py-1.5 pl-1.5 pr-1.5">
        <DragHandle label="Drag to reorder item" />
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-[4px] py-0.5 text-left"
        >
          <CaretRight size={11} weight="bold" className={cx("shrink-0 text-faint transition-transform", open && "rotate-90")} />
          <span className={cx("min-w-0 flex-1 truncate text-[13px] font-medium", entry.hidden ? "text-faint line-through" : "text-ink-strong")}>
            {entry.title.trim() || <span className="font-normal italic text-faint">Untitled item</span>}
          </span>
          {meta && <span className="max-w-[35%] shrink-0 truncate text-[11px] text-faint">{meta}</span>}
        </button>
        <div className="flex items-center opacity-60 transition-opacity group-hover/entry:opacity-100">
          <IconButton
            label={entry.hidden ? "Show on CV" : "Hide from CV"}
            onClick={() =>
              withEntry((e) => {
                e.hidden = !e.hidden || undefined;
              })
            }
          >
            {entry.hidden ? <EyeSlash size={14} weight="bold" /> : <Eye size={14} weight="bold" />}
          </IconButton>
          <IconButton
            label="Duplicate item"
            onClick={() =>
              edit((r) => {
                const list = sectionItems(r);
                if (list) duplicateById(list, entry.id);
              })
            }
          >
            <Copy size={14} weight="bold" />
          </IconButton>
          <IconButton
            label="Delete item"
            tone="danger"
            onClick={() =>
              deleteWithUndo(`Deleted “${entry.title.trim() || "Untitled item"}”`, (r) => {
                const list = sectionItems(r);
                if (list) removeById(list, entry.id);
              })
            }
          >
            <Trash size={14} weight="bold" />
          </IconButton>
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-3 border-t border-line px-3 pb-3 pt-3">
          <Field label="Title">
            <Input value={entry.title} onChange={set("title")} placeholder="Software Engineer Intern, Company" />
          </Field>
          <Field label="Subtitle" hint="italic line under the title">
            <Input value={entry.subtitle} onChange={set("subtitle")} placeholder="Role · tech stack" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <Input value={entry.date} onChange={set("date")} placeholder="Jun 2025 - Present" />
            </Field>
            <Field label="Location / status">
              <Input value={entry.place} onChange={set("place")} placeholder="Ho Chi Minh City" />
            </Field>
          </div>
          <Field label="Link" hint="makes the title clickable">
            <Input value={entry.url} onChange={set("url")} placeholder="https://github.com/…" inputMode="url" />
          </Field>
          <div className="flex flex-col gap-1">
            <span className="flex items-baseline justify-between text-[11px] font-medium uppercase tracking-[0.05em] text-muted">
              Bullets
              <span className="normal-case tracking-normal text-faint">Enter for new line · Ctrl+B bold</span>
            </span>
            <LinesEditor
              items={entry.bullets}
              select={(r) => findEntry(r, sectionId, entry.id)?.bullets}
              group={`bullets:${entry.id}`}
              placeholder="Describe an achievement, with numbers where you can"
              addLabel="Add bullet"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function EntriesEditor({ section }: { section: EntriesSection }) {
  const edit = useCv((s) => s.edit);
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const add = () => {
    const e = newEntry();
    edit((r) => {
      const s = r.sections.find((x) => x.id === section.id);
      if (s?.kind === "entries") s.items.push(e);
    });
    setOpen((prev) => new Set(prev).add(e.id));
  };

  return (
    <div className="flex flex-col gap-2">
      <SortableList
        ids={section.items.map((e) => e.id)}
        onMove={(a, o) =>
          edit((r) => {
            const s = r.sections.find((x) => x.id === section.id);
            if (s?.kind === "entries") moveById(s.items, a, o);
          })
        }
        className="flex flex-col gap-2"
      >
        {section.items.map((e) => (
          <SortableItem key={e.id} id={e.id}>
            <EntryCard sectionId={section.id} entry={e} open={open.has(e.id)} onToggle={() => toggle(e.id)} />
          </SortableItem>
        ))}
      </SortableList>
      <div>
        <Button onClick={add} className="h-7 px-2.5">
          <Plus size={13} weight="bold" />
          Add item
        </Button>
      </div>
    </div>
  );
}
