"use client";

import { CaretRight, Copy, DotsThree, Eye, EyeSlash, Plus, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { deleteWithUndo } from "@/lib/actions";
import { duplicateById, moveById, newSection, removeById } from "@/lib/ops";
import { useCv } from "@/lib/store";
import type { Section, SectionKind } from "@/lib/types";
import { DragHandle, SortableItem, SortableList } from "../Sortable";
import { cx, IconButton, Menu, MenuDivider, MenuItem, MenuLabel } from "../ui";
import { EntriesEditor } from "./EntriesEditor";
import { ListEditor, SkillsEditor, TextEditor } from "./SimpleEditors";

const KIND_LABEL: Record<SectionKind, string> = {
  entries: "Entries",
  skills: "Skills",
  list: "Lines",
  text: "Paragraph",
};

const PRESETS: { title: string; kind: SectionKind }[] = [
  { title: "Experience", kind: "entries" },
  { title: "Projects", kind: "entries" },
  { title: "Research Experience", kind: "entries" },
  { title: "Education", kind: "entries" },
  { title: "Leadership & Activities", kind: "entries" },
  { title: "Publications", kind: "list" },
  { title: "Technical Skills", kind: "skills" },
  { title: "Certifications", kind: "list" },
  { title: "Awards", kind: "list" },
  { title: "Summary", kind: "text" },
];

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function count(s: Section): string {
  switch (s.kind) {
    case "text":
      return s.body.trim() ? plural(s.body.trim().split(/\s+/).length, "word") : "empty";
    case "entries": {
      const shown = s.items.filter((e) => !e.hidden).length;
      return shown === s.items.length ? plural(s.items.length, "item") : `${shown}/${s.items.length} shown`;
    }
    case "skills":
      return plural(s.items.length, "row");
    case "list":
      return plural(s.items.length, "line");
  }
}

function SectionCard({ section, open, onToggle }: { section: Section; open: boolean; onToggle: () => void }) {
  const edit = useCv((s) => s.edit);
  const withSection = (fn: (s: Section) => void, group?: string) =>
    edit((r) => {
      const s = r.sections.find((x) => x.id === section.id);
      if (s) fn(s);
    }, group);

  return (
    <div data-section-card className={cx("rounded-[10px] border border-line bg-surface", section.hidden && "bg-surface-2")}>
      <div className="group/section flex items-center gap-1 py-2 pl-2 pr-2">
        <DragHandle label="Drag to reorder section" />
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? "Collapse section" : "Expand section"}
          className="flex size-6 shrink-0 items-center justify-center rounded-[4px] text-faint hover:bg-black/[0.05] hover:text-ink"
        >
          <CaretRight size={12} weight="bold" className={cx("transition-transform", open && "rotate-90")} />
        </button>
        <input
          value={section.title}
          onChange={(e) =>
            withSection((s) => {
              s.title = e.target.value;
            }, `title:${section.id}`)
          }
          placeholder="Section title"
          aria-label="Section title"
          className={cx(
            "h-7 min-w-0 flex-1 rounded-[5px] border border-transparent bg-transparent px-1.5 text-[14px] font-semibold outline-none transition-colors placeholder:font-normal placeholder:text-faint hover:border-line focus:border-line-strong focus:bg-surface",
            section.hidden ? "text-faint line-through" : "text-ink-strong",
          )}
        />
        <button type="button" onClick={onToggle} className="shrink-0 px-1 text-[11px] tabular-nums text-faint hover:text-muted">
          {count(section)}
        </button>
        <IconButton
          label={section.hidden ? "Show section on CV" : "Hide section from CV"}
          onClick={() =>
            withSection((s) => {
              s.hidden = !s.hidden || undefined;
            })
          }
        >
          {section.hidden ? <EyeSlash size={14} weight="bold" /> : <Eye size={14} weight="bold" />}
        </IconButton>
        <Menu
          align="right"
          width={190}
          trigger={({ toggle }) => (
            <IconButton label="Section actions" onClick={toggle}>
              <DotsThree size={16} weight="bold" />
            </IconButton>
          )}
        >
          {(close) => (
            <>
              <MenuLabel>{KIND_LABEL[section.kind]} section</MenuLabel>
              <MenuItem
                icon={<Copy size={14} weight="bold" />}
                onClick={() => {
                  edit((r) => {
                    const copy = duplicateById(r.sections, section.id);
                    if (copy) copy.title = `${copy.title} (copy)`;
                  });
                  close();
                }}
              >
                Duplicate section
              </MenuItem>
              <MenuDivider />
              <MenuItem
                tone="danger"
                icon={<Trash size={14} weight="bold" />}
                onClick={() => {
                  close();
                  deleteWithUndo(`Deleted section “${section.title.trim() || "Untitled"}”`, (r) =>
                    removeById(r.sections, section.id),
                  );
                }}
              >
                Delete section
              </MenuItem>
            </>
          )}
        </Menu>
      </div>

      {open && (
        <div className="border-t border-line px-3 pb-3 pt-3">
          {section.kind === "entries" && <EntriesEditor section={section} />}
          {section.kind === "skills" && <SkillsEditor section={section} />}
          {section.kind === "list" && <ListEditor section={section} />}
          {section.kind === "text" && <TextEditor section={section} />}
        </div>
      )}
    </div>
  );
}

function AddSectionMenu({ existing, onAdded }: { existing: Set<string>; onAdded: (id: string) => void }) {
  const edit = useCv((s) => s.edit);
  const add = (kind: SectionKind, title: string) => {
    const s = newSection(kind, title);
    edit((r) => void r.sections.push(s));
    onAdded(s.id);
  };
  return (
    <Menu
      width={250}
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-line-strong text-[13px] font-medium text-muted transition-colors hover:border-[#c4c3bf] hover:bg-surface hover:text-ink"
        >
          <Plus size={13} weight="bold" />
          Add section
        </button>
      )}
    >
      {(close) => (
        <div className="max-h-[360px] overflow-auto">
          <MenuLabel>Common sections</MenuLabel>
          {PRESETS.map((p) => (
            <MenuItem
              key={p.title}
              hint={existing.has(p.title.toLowerCase()) ? "added" : KIND_LABEL[p.kind]}
              onClick={() => {
                add(p.kind, p.title);
                close();
              }}
            >
              {p.title}
            </MenuItem>
          ))}
          <MenuDivider />
          <MenuLabel>Blank</MenuLabel>
          {(Object.keys(KIND_LABEL) as SectionKind[]).map((k) => (
            <MenuItem
              key={k}
              hint={k === "entries" ? "title, date, bullets" : k === "skills" ? "label: value" : k === "list" ? "plain lines" : "free text"}
              onClick={() => {
                add(k, "New section");
                close();
              }}
            >
              {KIND_LABEL[k]}
            </MenuItem>
          ))}
        </div>
      )}
    </Menu>
  );
}

export function SectionsPanel({ sections }: { sections: Section[] }) {
  const edit = useCv((s) => s.edit);
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-2">
      <SortableList
        ids={sections.map((s) => s.id)}
        onMove={(a, o) => edit((r) => moveById(r.sections, a, o))}
        className="flex flex-col gap-2"
      >
        {sections.map((s) => (
          <SortableItem key={s.id} id={s.id}>
            <SectionCard section={s} open={open.has(s.id)} onToggle={() => toggle(s.id)} />
          </SortableItem>
        ))}
      </SortableList>
      <AddSectionMenu
        existing={new Set(sections.map((s) => s.title.trim().toLowerCase()))}
        onAdded={(id) => setOpen((prev) => new Set(prev).add(id))}
      />
    </div>
  );
}
