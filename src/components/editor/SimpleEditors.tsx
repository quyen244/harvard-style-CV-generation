"use client";

import { Plus, X } from "@phosphor-icons/react";
import { moveById, newSkill, removeById } from "@/lib/ops";
import { useCv } from "@/lib/store";
import type { ListSection, Resume, SkillsSection, TextSection } from "@/lib/types";
import { DragHandle, SortableItem, SortableList } from "../Sortable";
import { AutoTextarea, Button, IconButton, Input } from "../ui";
import { handleBoldShortcut, LinesEditor } from "./LinesEditor";

export function TextEditor({ section }: { section: TextSection }) {
  const edit = useCv((s) => s.edit);
  const set = (v: string) =>
    edit((r) => {
      const s = r.sections.find((x) => x.id === section.id);
      if (s?.kind === "text") s.body = v;
    }, `body:${section.id}`);
  return (
    <AutoTextarea
      value={section.body}
      onChange={(e) => set(e.target.value)}
      onKeyDown={(e) => handleBoldShortcut(e, set)}
      placeholder="Two or three sentences on who you are and what you build."
      className="min-h-[84px]"
    />
  );
}

export function ListEditor({ section }: { section: ListSection }) {
  const select = (r: Resume) => {
    const s = r.sections.find((x) => x.id === section.id);
    return s?.kind === "list" ? s.items : undefined;
  };
  return (
    <LinesEditor
      items={section.items}
      select={select}
      group={`list:${section.id}`}
      placeholder="One line on the CV, e.g. IELTS Academic 7.0"
      addLabel="Add line"
      marker={false}
    />
  );
}

export function SkillsEditor({ section }: { section: SkillsSection }) {
  const edit = useCv((s) => s.edit);
  const withList = (fn: (items: SkillsSection["items"]) => void, group?: string) =>
    edit((r) => {
      const s = r.sections.find((x) => x.id === section.id);
      if (s?.kind === "skills") fn(s.items);
    }, group);

  return (
    <div className="flex flex-col gap-1">
      <SortableList
        ids={section.items.map((k) => k.id)}
        onMove={(a, o) => withList((items) => moveById(items, a, o))}
        className="flex flex-col gap-1.5"
      >
        {section.items.map((k) => (
          <SortableItem key={k.id} id={k.id}>
            <div className="group/line flex items-start gap-1">
              <DragHandle className="mt-[5px]" />
              <Input
                value={k.label}
                placeholder="Category"
                aria-label="Skill category"
                onChange={(e) =>
                  withList((items) => {
                    const x = items.find((i) => i.id === k.id);
                    if (x) x.label = e.target.value;
                  }, `${k.id}:label`)
                }
                className="w-[34%] shrink-0 font-medium"
              />
              <AutoTextarea
                value={k.value}
                placeholder="Skills, comma separated"
                aria-label="Skills"
                onChange={(e) =>
                  withList((items) => {
                    const x = items.find((i) => i.id === k.id);
                    if (x) x.value = e.target.value;
                  }, `${k.id}:value`)
                }
              />
              <IconButton
                label="Remove row"
                tone="danger"
                onClick={() => withList((items) => removeById(items, k.id))}
                className="mt-[2px] opacity-0 focus-visible:opacity-100 group-hover/line:opacity-100"
              >
                <X size={13} weight="bold" />
              </IconButton>
            </div>
          </SortableItem>
        ))}
      </SortableList>
      <div>
        <Button variant="ghost" className="h-7 px-2 text-muted" onClick={() => withList((items) => void items.push(newSkill()))}>
          <Plus size={13} weight="bold" />
          Add row
        </Button>
      </div>
    </div>
  );
}
