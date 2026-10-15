"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { computePageBreaks, type Block, type BlockKind } from "@/lib/pagination";
import type { Resume } from "@/lib/types";
import { CvDocument, PAGE_MM } from "./CvDocument";

const PX_PER_MM = 96 / 25.4;
const GUTTER = 32;

export function Preview({ resume, onPagesChange }: { resume: Resume; onPagesChange?: (n: number) => void }) {
  const { page, marginX, marginY } = resume.style;
  const size = PAGE_MM[page];
  const pageW = size.w * PX_PER_MM;
  const pageH = size.h * PX_PER_MM;
  const padX = marginX * PX_PER_MM;
  const padY = marginY * PX_PER_MM;
  const contentPerPage = pageH - 2 * padY;

  const scrollRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [breaks, setBreaks] = useState<number[]>([]);

  // Fit the page to the available width.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1.25, (el.clientWidth - GUTTER * 2) / pageW));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pageW]);

  // Measure blocks in unscaled px and simulate print pagination.
  useLayoutEffect(() => {
    const doc = docRef.current;
    if (!doc) return;
    const measure = () => {
      const origin = doc.getBoundingClientRect();
      const s = origin.width / doc.offsetWidth || 1;
      const blocks: Block[] = Array.from(doc.querySelectorAll<HTMLElement>("[data-block]")).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          top: (r.top - origin.top) / s,
          bottom: (r.bottom - origin.top) / s,
          kind: el.dataset.block as BlockKind,
        };
      });
      const next = computePageBreaks(blocks, doc.offsetHeight, contentPerPage);
      setBreaks((prev) => (prev.length === next.length && prev.every((v, i) => Math.abs(v - next[i]) < 0.5) ? prev : next));
      onPagesChange?.(next.length + 1);
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [resume, contentPerPage, scale, onPagesChange]);

  const pages = breaks.length + 1;
  const sheetH = Math.max(pageH, pages * pageH);

  return (
    <div ref={scrollRef} className="preview-scroll">
      <style>{`@page { size: ${page === "A4" ? "A4" : "letter"}; margin: ${marginY}mm ${marginX}mm; }`}</style>
      <div className="cv-scale-box" style={{ width: pageW * scale, height: sheetH * scale }}>
        <div
          className="cv-page"
          style={{
            width: pageW,
            minHeight: sheetH,
            padding: `${padY}px ${padX}px`,
            transform: `scale(${scale})`,
          }}
        >
          <div ref={docRef}>
            <CvDocument resume={resume} />
          </div>
          {breaks.map((y, i) => (
            <div key={i} className="cv-break" style={{ top: padY + y }} aria-hidden>
              <span>Page {i + 2}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
