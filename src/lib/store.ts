import { produce } from "immer";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { cloneWithNewIds, newResume, normalizeStyle, uid } from "./ops";
import { sampleResume } from "./sample";
import type { Id, Resume } from "./types";

interface Snapshot {
  resumes: Resume[];
  activeId: Id;
}

export interface CvState extends Snapshot {
  past: Snapshot[];
  future: Snapshot[];
  /** Last coalescing key, so a burst of typing in one field is one undo step. */
  lastGroup: { key: string; at: number } | null;
  /** Bumped on every change, undo and redo. */
  rev: number;

  /** Mutates the active resume through an immer draft. */
  edit: (recipe: (draft: Resume) => void, group?: string) => void;
  setActive: (id: Id) => void;
  createResume: (from: "blank" | "sample") => void;
  duplicateResume: (id: Id) => void;
  renameResume: (id: Id, name: string) => void;
  deleteResume: (id: Id) => void;
  importResume: (resume: Resume) => void;
  undo: () => void;
  redo: () => void;
}

const HISTORY_LIMIT = 100;
const GROUP_WINDOW_MS = 1200;

function initial(): Snapshot {
  const r = sampleResume();
  return { resumes: [r], activeId: r.id };
}

export const useCv = create<CvState>()(
  persist(
    (set, get) => {
      /** Applies a change to the whole snapshot and records undo history. */
      const commit = (recipe: (draft: Snapshot) => void, group?: string) => {
        const s = get();
        const before: Snapshot = { resumes: s.resumes, activeId: s.activeId };
        const after = produce(before, recipe);
        if (after === before) return;

        const now = Date.now();
        const coalesce =
          group !== undefined &&
          s.lastGroup?.key === group &&
          now - s.lastGroup.at < GROUP_WINDOW_MS;

        set({
          ...after,
          past: coalesce ? s.past : [...s.past, before].slice(-HISTORY_LIMIT),
          future: [],
          lastGroup: group ? { key: group, at: now } : null,
          rev: s.rev + 1,
        });
      };

      return {
        ...initial(),
        past: [],
        future: [],
        lastGroup: null,
        rev: 0,

        edit: (recipe, group) =>
          commit((d) => {
            const r = d.resumes.find((x) => x.id === d.activeId);
            if (!r) return;
            recipe(r);
            r.updatedAt = Date.now();
          }, group),

        setActive: (id) => {
          if (get().resumes.some((r) => r.id === id)) set({ activeId: id, lastGroup: null });
        },

        createResume: (from) =>
          commit((d) => {
            const r = from === "sample" ? sampleResume() : newResume("Untitled CV");
            d.resumes.push(r);
            d.activeId = r.id;
          }),

        duplicateResume: (id) =>
          commit((d) => {
            const i = d.resumes.findIndex((r) => r.id === id);
            if (i < 0) return;
            const copy = cloneWithNewIds(JSON.parse(JSON.stringify(d.resumes[i])) as Resume);
            copy.name = `${d.resumes[i].name} (copy)`;
            copy.updatedAt = Date.now();
            d.resumes.splice(i + 1, 0, copy);
            d.activeId = copy.id;
          }),

        renameResume: (id, name) =>
          commit((d) => {
            const r = d.resumes.find((x) => x.id === id);
            if (r) r.name = name;
          }, `rename:${id}`),

        deleteResume: (id) =>
          commit((d) => {
            if (d.resumes.length <= 1) return;
            const i = d.resumes.findIndex((r) => r.id === id);
            if (i < 0) return;
            d.resumes.splice(i, 1);
            if (d.activeId === id) d.activeId = d.resumes[Math.max(0, i - 1)].id;
          }),

        importResume: (resume) =>
          commit((d) => {
            const r = { ...resume, id: uid() };
            d.resumes.push(r);
            d.activeId = r.id;
          }),

        undo: () => {
          const s = get();
          const prev = s.past.at(-1);
          if (!prev) return;
          set({
            ...prev,
            past: s.past.slice(0, -1),
            future: [{ resumes: s.resumes, activeId: s.activeId }, ...s.future],
            lastGroup: null,
            rev: s.rev + 1,
          });
        },

        redo: () => {
          const s = get();
          const next = s.future[0];
          if (!next) return;
          set({
            ...next,
            past: [...s.past, { resumes: s.resumes, activeId: s.activeId }],
            future: s.future.slice(1),
            lastGroup: null,
            rev: s.rev + 1,
          });
        },
      };
    },
    {
      name: "cv-gen",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ resumes: s.resumes, activeId: s.activeId }),
      merge: (persisted, current) => {
        const p = persisted as Partial<Snapshot> | undefined;
        if (!p?.resumes?.length) return current;
        const resumes = p.resumes.map((r) => ({ ...r, style: normalizeStyle(r.style) }));
        const activeId = resumes.some((r) => r.id === p.activeId) ? p.activeId! : resumes[0].id;
        return { ...current, resumes, activeId };
      },
    },
  ),
);

export function useActiveResume(): Resume {
  return useCv((s) => s.resumes.find((r) => r.id === s.activeId) ?? s.resumes[0]);
}
