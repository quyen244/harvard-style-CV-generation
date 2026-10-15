import { produce } from "immer";
import { describe, expect, it } from "vitest";
import { parseBold } from "./markup";
import { cloneWithNewIds, DEFAULT_STYLE, duplicateById, moveById, newResume, normalizeResume, removeById } from "./ops";
import { computePageBreaks } from "./pagination";
import { sampleResume } from "./sample";

const titles = (r: { sections: { title: string }[] }) => r.sections.map((s) => s.title);

describe("section ordering", () => {
  it("moves Research above Projects (one CV) without touching other sections", () => {
    const r = sampleResume();
    const projects = r.sections.find((s) => s.title === "Projects")!.id;
    const research = r.sections.find((s) => s.title === "Research Experience")!.id;

    const next = produce(r, (d) => moveById(d.sections, research, projects));

    expect(titles(next)).toEqual([
      "Summary",
      "Education",
      "Research Experience",
      "Projects",
      "Technical Skills",
      "Certifications",
      "Activities",
    ]);
    expect(titles(r)[3]).toBe("Research Experience"); // original untouched
  });

  it("ignores unknown ids", () => {
    const list = [{ id: "a" }, { id: "b" }];
    moveById(list, "a", "zzz");
    expect(list.map((x) => x.id)).toEqual(["a", "b"]);
  });
});

describe("item CRUD", () => {
  it("duplicates right after the original with fresh ids everywhere", () => {
    const r = sampleResume();
    const projects = r.sections.find((s) => s.title === "Projects")!;
    if (projects.kind !== "entries") throw new Error("expected entries");
    const first = projects.items[0];

    const next = produce(r, (d) => {
      const s = d.sections.find((x) => x.id === projects.id)!;
      if (s.kind === "entries") duplicateById(s.items, first.id);
    });
    const items = (next.sections.find((x) => x.id === projects.id) as typeof projects).items;

    expect(items).toHaveLength(projects.items.length + 1);
    expect(items[1].title).toBe(first.title);
    expect(items[1].id).not.toBe(first.id);
    expect(items[1].bullets.map((b) => b.id)).not.toEqual(first.bullets.map((b) => b.id));
    expect(items[1].bullets.map((b) => b.text)).toEqual(first.bullets.map((b) => b.text));
  });

  it("removes by id", () => {
    const list = [{ id: "a" }, { id: "b" }, { id: "c" }];
    removeById(list, "b");
    expect(list.map((x) => x.id)).toEqual(["a", "c"]);
  });

  it("cloneWithNewIds keeps every non-id value", () => {
    const r = sampleResume();
    const c = cloneWithNewIds(r);
    expect(c.id).not.toBe(r.id);
    expect(titles(c)).toEqual(titles(r));
    expect(c.header).toMatchObject({ name: r.header.name, email: r.header.email });
  });
});

describe("import", () => {
  it("round-trips an export", () => {
    const r = sampleResume();
    const back = normalizeResume(JSON.parse(JSON.stringify(r)));
    expect(back.id).not.toBe(r.id);
    expect({ ...back, id: r.id, updatedAt: r.updatedAt }).toEqual(r);
  });

  it("fills defaults, drops unknown section kinds, clamps style", () => {
    const r = normalizeResume({
      header: { name: "A" },
      sections: [{ kind: "nope" }, { kind: "list", title: "X", items: ["plain string", { text: "obj" }] }],
      style: { fontSize: 99, page: "Letter", font: "comic" },
    });
    expect(r.header).toMatchObject({ name: "A", email: "", links: [] });
    expect(r.sections).toHaveLength(1);
    expect(r.sections[0].kind === "list" && r.sections[0].items.map((i) => i.text)).toEqual(["plain string", "obj"]);
    expect(r.style).toEqual({ ...DEFAULT_STYLE, fontSize: 12, page: "Letter" });
    expect(normalizeResume({ header: {}, style: { margin: 20 } }).style).toMatchObject({ marginX: 20, marginY: 20 });
  });

  it("rejects files that are not a CV", () => {
    expect(() => normalizeResume({ hello: 1 })).toThrow(/does not look like a CV/);
    expect(() => normalizeResume([])).toThrow();
  });

  it("new blank CV has the usual sections", () => {
    expect(titles(newResume("x"))).toEqual(["Summary", "Education", "Experience", "Projects", "Technical Skills"]);
  });
});

describe("bold markup", () => {
  it("splits **bold** runs and keeps unclosed markers literal", () => {
    expect(parseBold("a **b** c **d")).toEqual([
      { text: "a ", bold: false },
      { text: "b", bold: true },
      { text: " c **d", bold: false },
    ]);
  });
});

describe("page break estimate", () => {
  it("keeps a whole entry together and moves its orphaned heading with it", () => {
    const blocks = [
      { top: 0, bottom: 80, kind: "avoid" as const },
      { top: 85, bottom: 95, kind: "heading" as const },
      { top: 95, bottom: 130, kind: "avoid" as const }, // straddles 100
    ];
    expect(computePageBreaks(blocks, 130, 100)).toEqual([85]);
  });

  it("splits text anywhere and reports nothing for a one-page CV", () => {
    expect(computePageBreaks([{ top: 0, bottom: 150, kind: "text" }], 150, 100)).toEqual([100]);
    expect(computePageBreaks([{ top: 0, bottom: 90, kind: "avoid" }], 90, 100)).toEqual([]);
  });
});
