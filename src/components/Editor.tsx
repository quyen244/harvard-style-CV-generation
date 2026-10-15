"use client";

import { CaretRight, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useActiveResume, useCv } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { HeaderEditor } from "./editor/HeaderEditor";
import { SectionsPanel } from "./editor/SectionsPanel";
import { StylePanel } from "./editor/StylePanel";
import { Preview } from "./Preview";
import { printResume, Toolbar } from "./Toolbar";
import { cx } from "./ui";

/** The CV lives in localStorage, so the editor only renders in the browser. */
const subscribeNoop = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      const s = useCv.getState();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        s.undo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        s.redo();
      } else if (k === "p") {
        e.preventDefault();
        const r = s.resumes.find((x) => x.id === s.activeId);
        if (r) printResume(r);
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, []);
}

function ToastView() {
  const toast = useToast((s) => s.toast);
  const dismiss = useToast((s) => s.dismiss);
  if (!toast) return null;
  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <div
        role="status"
        className="pointer-events-auto flex max-w-[480px] items-center gap-3 rounded-[8px] bg-ink-strong py-2 pl-4 pr-2 text-[13px] text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
      >
        <span className="min-w-0 truncate">{toast.message}</span>
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action!.run();
              dismiss();
            }}
            className="shrink-0 rounded-[5px] px-2 py-1 font-medium text-[#9fd3fb] hover:bg-white/10"
          >
            {toast.action.label}
          </button>
        )}
        <button type="button" aria-label="Dismiss" onClick={dismiss} className="shrink-0 rounded-[5px] p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X size={12} weight="bold" />
        </button>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, defaultOpen = true, children }: { title: string; subtitle?: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-[10px] border border-line bg-surface">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <CaretRight size={12} weight="bold" className={cx("shrink-0 text-faint transition-transform", open && "rotate-90")} />
        <span className="text-[14px] font-semibold text-ink-strong">{title}</span>
        {subtitle && <span className="min-w-0 flex-1 truncate text-right text-[12px] text-faint">{subtitle}</span>}
      </button>
      {open && <div className="border-t border-line px-4 pb-4 pt-3">{children}</div>}
    </section>
  );
}

function EditorShell() {
  const resume = useActiveResume();
  const [tab, setTab] = useState<"content" | "design">("content");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [pages, setPages] = useState(1);
  const onPages = useCallback((n: number) => setPages(n), []);
  useShortcuts();

  return (
    <div className="app-root flex h-dvh flex-col">
      <Toolbar />
      <div className="app-main flex min-h-0 flex-1">
        <aside
          className={cx(
            "no-print flex min-h-0 w-full flex-col border-r border-line bg-canvas lg:w-[460px] lg:shrink-0",
            mobileView === "preview" && "hidden lg:flex",
          )}
        >
          <div className="flex shrink-0 items-center gap-1 border-b border-line px-4 py-2">
            {(["content", "design"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cx(
                  "h-8 rounded-[6px] px-3 text-[13px] font-medium capitalize transition-colors",
                  tab === t ? "bg-surface text-ink-strong ring-1 ring-line" : "text-muted hover:text-ink",
                )}
              >
                {t}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setMobileView("preview")}
              className="ml-auto h-8 rounded-[6px] px-3 text-[13px] font-medium text-muted hover:text-ink lg:hidden"
            >
              Preview
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24 pt-4">
            {tab === "content" ? (
              <div className="flex flex-col gap-5">
                <Panel title="Personal details" subtitle={resume.header.name} defaultOpen={false}>
                  <HeaderEditor header={resume.header} />
                </Panel>
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between px-1">
                    <h2 className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Sections</h2>
                    <span className="text-[11px] text-faint">drag ⋮⋮ to reorder</span>
                  </div>
                  <SectionsPanel key={resume.id} sections={resume.sections} />
                </div>
              </div>
            ) : (
              <Panel title="Layout">
                <StylePanel style={resume.style} />
              </Panel>
            )}
          </div>
        </aside>

        <main className={cx("preview-pane relative min-w-0 flex-1 bg-[#efeeea]", mobileView === "edit" && "hidden lg:block")}>
          <div className="no-print absolute right-4 top-3 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileView("edit")}
              className="h-7 rounded-[6px] border border-line bg-surface px-2.5 text-[12px] font-medium text-ink lg:hidden"
            >
              Edit
            </button>
            <span
              className={cx(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.05em]",
                pages === 1 ? "bg-[#edf3ec] text-[#346538]" : "bg-[#fbf3db] text-[#956400]",
              )}
              title="Estimated from the print layout"
            >
              {pages} {pages === 1 ? "page" : "pages"}
            </span>
          </div>
          <Preview resume={resume} onPagesChange={onPages} />
        </main>
      </div>
      <ToastView />
    </div>
  );
}

export function Editor() {
  const isClient = useIsClient();
  if (!isClient) {
    return (
      <div className="flex h-dvh items-center justify-center text-[13px] text-faint" aria-busy>
        Loading your CVs…
      </div>
    );
  }
  return <EditorShell />;
}
