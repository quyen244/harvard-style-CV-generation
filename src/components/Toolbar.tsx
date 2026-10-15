"use client";

import {
  ArrowCounterClockwise,
  ArrowClockwise,
  CaretDown,
  Check,
  Copy,
  DownloadSimple,
  FilePlus,
  FileText,
  Sparkle,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import { useRef } from "react";
import { normalizeResume } from "@/lib/ops";
import { useActiveResume, useCv } from "@/lib/store";
import { useToast } from "@/lib/toast";
import type { Resume } from "@/lib/types";
import { Button, IconButton, Menu, MenuDivider, MenuItem, MenuLabel } from "./ui";

/** "Nguyễn Văn Quyền" -> "Nguyen_Van_Quyen_CV", used as the default PDF / JSON file name. */
export function fileBaseName(r: Resume): string {
  const base = (r.header.name.trim() || r.name.trim() || "CV")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${base || "CV"}_CV`;
}

export function printResume(r: Resume) {
  const prev = document.title;
  document.title = fileBaseName(r);
  window.addEventListener("afterprint", () => (document.title = prev), { once: true });
  window.print();
}

const relTime = (t: number) => {
  const d = Date.now() - t;
  if (d < 60_000) return "just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return new Date(t).toLocaleDateString();
};

export function Toolbar() {
  const resume = useActiveResume();
  const resumes = useCv((s) => s.resumes);
  const canUndo = useCv((s) => s.past.length > 0);
  const canRedo = useCv((s) => s.future.length > 0);
  const { undo, redo, setActive, createResume, duplicateResume, renameResume, deleteResume, importResume } = useCv.getState();
  const toast = useToast((s) => s.show);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(resume, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${fileBaseName(resume)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const r = normalizeResume(JSON.parse(await file.text()));
      importResume(r);
      toast(`Imported “${r.name}”`);
    } catch (err) {
      toast(`Could not import: ${err instanceof Error ? err.message : "invalid file"}`);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <header className="no-print flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 sm:gap-3 sm:px-4">
      <div className="flex items-center gap-2 pr-1">
        <span className="flex size-7 items-center justify-center rounded-[6px] bg-ink-strong text-white">
          <FileText size={15} weight="bold" />
        </span>
        <span className="hidden text-[14px] font-semibold tracking-[-0.01em] text-ink-strong sm:inline">CV-gen</span>
      </div>
      <span className="hidden h-5 w-px bg-line sm:block" />

      <div className="flex min-w-0 items-center">
        <input
          value={resume.name}
          onChange={(e) => renameResume(resume.id, e.target.value)}
          aria-label="CV name"
          placeholder="Untitled CV"
          className="h-8 w-[clamp(96px,22vw,260px)] min-w-0 truncate rounded-l-[6px] border border-r-0 border-transparent bg-transparent px-2 text-[13px] font-medium text-ink-strong outline-none transition-colors hover:border-line focus:border-line-strong"
        />
        <Menu
          width={290}
          trigger={({ toggle, open }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-label="Switch CV"
              title="Switch CV"
              className="flex h-8 items-center gap-1 rounded-[6px] px-2 text-muted transition-colors hover:bg-black/[0.04] hover:text-ink"
            >
              <span className="rounded-[4px] bg-canvas px-1.5 text-[11px] tabular-nums">{resumes.length}</span>
              <CaretDown size={12} weight="bold" />
            </button>
          )}
        >
          {(close) => (
            <>
              <MenuLabel>Your CVs</MenuLabel>
              <div className="max-h-[260px] overflow-auto">
                {resumes.map((r) => (
                  <MenuItem
                    key={r.id}
                    active={r.id === resume.id}
                    icon={r.id === resume.id ? <Check size={14} weight="bold" /> : null}
                    hint={relTime(r.updatedAt)}
                    onClick={() => {
                      setActive(r.id);
                      close();
                    }}
                  >
                    {r.name.trim() || "Untitled CV"}
                  </MenuItem>
                ))}
              </div>
              <MenuDivider />
              <MenuItem icon={<FilePlus size={14} weight="bold" />} onClick={() => (createResume("blank"), close())}>
                New blank CV
              </MenuItem>
              <MenuItem icon={<Sparkle size={14} weight="bold" />} onClick={() => (createResume("sample"), close())}>
                New from sample
              </MenuItem>
              <MenuItem icon={<Copy size={14} weight="bold" />} onClick={() => (duplicateResume(resume.id), close())}>
                Duplicate this CV
              </MenuItem>
              <div className="md:hidden">
                <MenuItem icon={<UploadSimple size={14} weight="bold" />} onClick={() => (fileRef.current?.click(), close())}>
                  Import from .json
                </MenuItem>
                <MenuItem icon={<DownloadSimple size={14} weight="bold" />} onClick={() => (exportJson(), close())}>
                  Export as .json
                </MenuItem>
              </div>
              <MenuDivider />
              <MenuItem
                tone="danger"
                icon={<Trash size={14} weight="bold" />}
                disabled={resumes.length <= 1}
                hint={resumes.length <= 1 ? "last one" : undefined}
                onClick={() => {
                  close();
                  if (window.confirm(`Delete “${resume.name || "Untitled CV"}”? You can still undo right after.`)) {
                    deleteResume(resume.id);
                    const mark = useCv.getState().rev;
                    toast("CV deleted", {
                      label: "Undo",
                      run: () => useCv.getState().rev === mark && undo(),
                    });
                  }
                }}
              >
                Delete this CV
              </MenuItem>
            </>
          )}
        </Menu>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <IconButton label="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo}>
          <ArrowCounterClockwise size={15} weight="bold" />
        </IconButton>
        <IconButton label="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}>
          <ArrowClockwise size={15} weight="bold" />
        </IconButton>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
        <div className="hidden items-center gap-1 md:flex">
          <span className="mx-1.5 h-5 w-px bg-line" />
          <Button variant="ghost" onClick={() => fileRef.current?.click()} title="Import a CV from a .json file">
            <UploadSimple size={14} weight="bold" />
            Import
          </Button>
          <Button variant="ghost" onClick={exportJson} title="Save this CV as a .json file">
            <DownloadSimple size={14} weight="bold" />
            Export
          </Button>
        </div>
        <Button variant="primary" onClick={() => printResume(resume)} title="Opens the print dialog - choose “Save as PDF”" className="ml-1">
          <span className="sm:hidden">PDF</span>
          <span className="hidden sm:inline">Download PDF</span>
          <span className="hidden font-mono text-[10px] font-normal text-white/45 lg:inline">Ctrl P</span>
        </Button>
      </div>
    </header>
  );
}
