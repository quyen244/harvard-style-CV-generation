import type {
  Bullet,
  Entry,
  Header,
  Id,
  Link,
  Resume,
  ResumeStyle,
  Section,
  SectionKind,
  Skill,
} from "./types";

export function uid(): Id {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 12);
  }
  return Math.random().toString(36).slice(2, 14);
}

/* ---------- factories ---------- */

export const newBullet = (text = ""): Bullet => ({ id: uid(), text });
export const newLink = (label = "", url = ""): Link => ({ id: uid(), label, url });
export const newSkill = (label = "", value = ""): Skill => ({ id: uid(), label, value });

export const newEntry = (patch: Partial<Entry> = {}): Entry => ({
  id: uid(),
  title: "",
  url: "",
  subtitle: "",
  date: "",
  place: "",
  bullets: [newBullet()],
  ...patch,
});

export function newSection(kind: SectionKind, title: string): Section {
  const id = uid();
  switch (kind) {
    case "text":
      return { id, kind, title, body: "" };
    case "entries":
      return { id, kind, title, items: [newEntry()] };
    case "skills":
      return { id, kind, title, items: [newSkill()] };
    case "list":
      return { id, kind, title, items: [newBullet()] };
  }
}

/** Matches the reference Harvard CV: Arial 8.85pt, 1.16 leading, ~14.5mm sides. */
export const DEFAULT_STYLE: ResumeStyle = {
  font: "arial",
  fontSize: 9,
  lineHeight: 1.16,
  marginX: 14,
  marginY: 8,
  page: "A4",
};

export const STYLE_LIMITS = {
  fontSize: { min: 8, max: 12, step: 0.25 },
  lineHeight: { min: 1, max: 1.6, step: 0.02 },
  marginX: { min: 5, max: 30, step: 1 },
  marginY: { min: 5, max: 30, step: 1 },
} as const;

export const emptyHeader = (): Header => ({
  name: "",
  headline: "",
  location: "",
  email: "",
  phone: "",
  links: [],
});

export function newResume(name: string, sections?: Section[]): Resume {
  return {
    id: uid(),
    name,
    updatedAt: Date.now(),
    header: emptyHeader(),
    sections: sections ?? [
      newSection("text", "Summary"),
      newSection("entries", "Education"),
      newSection("entries", "Experience"),
      newSection("entries", "Projects"),
      newSection("skills", "Technical Skills"),
    ],
    style: { ...DEFAULT_STYLE },
  };
}

/** Deep copy with fresh ids everywhere, so copies never share identity with the source. */
export function cloneWithNewIds<T>(value: T): T {
  if (Array.isArray(value)) return value.map(cloneWithNewIds) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = k === "id" ? uid() : cloneWithNewIds(v);
    }
    return out as T;
  }
  return value;
}

/* ---------- array helpers ---------- */

export function move<T>(list: T[], from: number, to: number): void {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
}

export function moveById<T extends { id: Id }>(list: T[], activeId: Id, overId: Id): void {
  move(
    list,
    list.findIndex((x) => x.id === activeId),
    list.findIndex((x) => x.id === overId),
  );
}

export function removeById<T extends { id: Id }>(list: T[], id: Id): void {
  const i = list.findIndex((x) => x.id === id);
  if (i >= 0) list.splice(i, 1);
}

/** Inserts a copy (with new ids) right after the original and returns it. */
export function duplicateById<T extends { id: Id }>(list: T[], id: Id): T | undefined {
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) return undefined;
  const copy = cloneWithNewIds(list[i]);
  list.splice(i + 1, 0, copy);
  return copy;
}

/* ---------- lookups on a resume draft ---------- */

export function findSection(r: Resume, sectionId: Id): Section | undefined {
  return r.sections.find((s) => s.id === sectionId);
}

export function findEntry(r: Resume, sectionId: Id, entryId: Id): Entry | undefined {
  const s = findSection(r, sectionId);
  return s?.kind === "entries" ? s.items.find((e) => e.id === entryId) : undefined;
}

/* ---------- import / normalisation ---------- */

const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const id = (v: unknown): Id => (typeof v === "string" && v ? v : uid());
const num = (v: unknown, min: number, max: number, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

function normalizeBullet(v: unknown): Bullet {
  if (typeof v === "string") return newBullet(v);
  const o = obj(v);
  return { id: id(o.id), text: str(o.text) };
}

function normalizeSection(v: unknown): Section | null {
  const o = obj(v);
  const base = { id: id(o.id), title: str(o.title), hidden: o.hidden === true || undefined };
  switch (o.kind) {
    case "text":
      return { ...base, kind: "text", body: str(o.body) };
    case "entries":
      return {
        ...base,
        kind: "entries",
        items: arr(o.items).map((e) => {
          const x = obj(e);
          return {
            id: id(x.id),
            hidden: x.hidden === true || undefined,
            title: str(x.title),
            url: str(x.url),
            subtitle: str(x.subtitle),
            date: str(x.date),
            place: str(x.place),
            bullets: arr(x.bullets).map(normalizeBullet),
          };
        }),
      };
    case "skills":
      return {
        ...base,
        kind: "skills",
        items: arr(o.items).map((s) => {
          const x = obj(s);
          return { id: id(x.id), label: str(x.label), value: str(x.value) };
        }),
      };
    case "list":
      return { ...base, kind: "list", items: arr(o.items).map(normalizeBullet) };
    default:
      return null;
  }
}

/** Fills in and clamps a (possibly old or hand-edited) style object. */
export function normalizeStyle(input: unknown): ResumeStyle {
  const s = obj(input);
  const L = STYLE_LIMITS;
  // `margin` is the single-margin field of earlier versions.
  const legacyMargin = typeof s.margin === "number" ? s.margin : undefined;
  return {
    font: s.font === "times" || s.font === "garamond" ? s.font : "arial",
    fontSize: num(s.fontSize, L.fontSize.min, L.fontSize.max, DEFAULT_STYLE.fontSize),
    lineHeight: num(s.lineHeight, L.lineHeight.min, L.lineHeight.max, DEFAULT_STYLE.lineHeight),
    marginX: num(s.marginX ?? legacyMargin, L.marginX.min, L.marginX.max, DEFAULT_STYLE.marginX),
    marginY: num(s.marginY ?? legacyMargin, L.marginY.min, L.marginY.max, DEFAULT_STYLE.marginY),
    page: s.page === "Letter" ? "Letter" : "A4",
  };
}

/**
 * Turns untrusted JSON (an exported CV file) into a valid Resume.
 * Throws when the input is clearly not a CV, fills in defaults otherwise.
 */
export function normalizeResume(input: unknown): Resume {
  const o = obj(input);
  if (!("header" in o) && !("sections" in o)) {
    throw new Error("This file does not look like a CV export (no header or sections).");
  }
  const h = obj(o.header);
  const sections = arr(o.sections)
    .map(normalizeSection)
    .filter((x): x is Section => x !== null);
  return {
    id: uid(),
    name: str(o.name) || "Imported CV",
    updatedAt: Date.now(),
    header: {
      name: str(h.name),
      headline: str(h.headline),
      location: str(h.location),
      email: str(h.email),
      phone: str(h.phone),
      links: arr(h.links).map((l) => {
        const x = obj(l);
        return { id: id(x.id), label: str(x.label), url: str(x.url) };
      }),
    },
    sections,
    style: normalizeStyle(o.style),
  };
}
