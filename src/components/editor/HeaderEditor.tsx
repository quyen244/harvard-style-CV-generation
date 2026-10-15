"use client";

import { Plus, X } from "@phosphor-icons/react";
import { moveById, newLink, removeById } from "@/lib/ops";
import { useCv } from "@/lib/store";
import type { Header, Link } from "@/lib/types";
import { DragHandle, SortableItem, SortableList } from "../Sortable";
import { Button, Field, IconButton, Input } from "../ui";

type TextKey = Exclude<keyof Header, "links">;

export function HeaderEditor({ header }: { header: Header }) {
  const edit = useCv((s) => s.edit);
  const set = (key: TextKey) => (e: { target: { value: string } }) =>
    edit((r) => {
      r.header[key] = e.target.value;
    }, `header:${key}`);
  const setLink = (id: string, key: "label" | "url", value: string) =>
    edit((r) => {
      const l = r.header.links.find((x) => x.id === id);
      if (l) l[key] = value;
    }, `link:${id}:${key}`);

  return (
    <div className="flex flex-col gap-3">
      <Field label="Full name">
        <Input value={header.name} onChange={set("name")} placeholder="Nguyen Van A" className="text-[14px] font-semibold" />
      </Field>
      <Field label="Headline" hint="shown under your name">
        <Input value={header.headline} onChange={set("headline")} placeholder="Software Engineer Intern | Backend" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email">
          <Input value={header.email} onChange={set("email")} placeholder="you@example.com" type="email" />
        </Field>
        <Field label="Phone">
          <Input value={header.phone} onChange={set("phone")} placeholder="+84 …" type="tel" />
        </Field>
      </div>
      <Field label="Location">
        <Input value={header.location} onChange={set("location")} placeholder="Ho Chi Minh City, Vietnam" />
      </Field>

      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-[0.05em] text-muted">Links</span>
        <SortableList
          ids={header.links.map((l) => l.id)}
          onMove={(a, o) => edit((r) => moveById(r.header.links, a, o))}
          className="flex flex-col gap-1.5"
        >
          {header.links.map((l: Link) => (
            <SortableItem key={l.id} id={l.id}>
              <div className="group/line flex items-center gap-1">
                <DragHandle />
                <Input
                  value={l.label}
                  onChange={(e) => setLink(l.id, "label", e.target.value)}
                  placeholder="GitHub"
                  aria-label="Link label"
                  className="w-[30%] shrink-0"
                />
                <Input
                  value={l.url}
                  onChange={(e) => setLink(l.id, "url", e.target.value)}
                  placeholder="https://github.com/you"
                  aria-label="Link URL"
                  inputMode="url"
                />
                <IconButton
                  label="Remove link"
                  tone="danger"
                  onClick={() => edit((r) => removeById(r.header.links, l.id))}
                  className="opacity-0 focus-visible:opacity-100 group-hover/line:opacity-100"
                >
                  <X size={13} weight="bold" />
                </IconButton>
              </div>
            </SortableItem>
          ))}
        </SortableList>
        <div>
          <Button variant="ghost" className="h-7 px-2 text-muted" onClick={() => edit((r) => void r.header.links.push(newLink()))}>
            <Plus size={13} weight="bold" />
            Add link
          </Button>
        </div>
      </div>
    </div>
  );
}
