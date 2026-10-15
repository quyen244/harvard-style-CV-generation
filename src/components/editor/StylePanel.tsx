"use client";

import type { CSSProperties } from "react";
import { DEFAULT_STYLE, STYLE_LIMITS } from "@/lib/ops";
import { useCv } from "@/lib/store";
import type { FontId, PageSize, ResumeStyle } from "@/lib/types";
import { FONT_STACKS } from "../CvDocument";
import { Button, cx } from "../ui";

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string; style?: CSSProperties }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-[8px] border border-line bg-canvas p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          style={o.style}
          className={cx(
            "h-8 rounded-[5px] px-2 text-[13px] transition-colors",
            value === o.value ? "bg-surface text-ink-strong shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-line" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between text-[11px] font-medium uppercase tracking-[0.05em] text-muted">
        {label}
        <span className="font-mono text-[12px] normal-case tracking-normal text-ink">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#111]"
      />
    </label>
  );
}

export function StylePanel({ style }: { style: ResumeStyle }) {
  const edit = useCv((s) => s.edit);
  const set = <K extends keyof ResumeStyle>(key: K, value: ResumeStyle[K]) =>
    edit((r) => {
      r.style[key] = value;
    }, `style:${key}`);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.05em] text-muted">Font</span>
        <Segmented<FontId>
          label="Font"
          value={style.font}
          onChange={(v) => set("font", v)}
          options={[
            { value: "arial", label: "Arial", style: { fontFamily: FONT_STACKS.arial } },
            { value: "times", label: "Times", style: { fontFamily: FONT_STACKS.times } },
            { value: "garamond", label: "Garamond", style: { fontFamily: FONT_STACKS.garamond } },
          ]}
        />
      </div>
      <Slider label="Font size" {...STYLE_LIMITS.fontSize} value={style.fontSize} unit="pt" onChange={(v) => set("fontSize", v)} />
      <Slider label="Line spacing" {...STYLE_LIMITS.lineHeight} value={style.lineHeight} unit="×" onChange={(v) => set("lineHeight", v)} />
      <div className="grid grid-cols-2 gap-4">
        <Slider label="Side margin" {...STYLE_LIMITS.marginX} value={style.marginX} unit="mm" onChange={(v) => set("marginX", v)} />
        <Slider label="Top / bottom" {...STYLE_LIMITS.marginY} value={style.marginY} unit="mm" onChange={(v) => set("marginY", v)} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.05em] text-muted">Paper</span>
        <Segmented<PageSize>
          label="Paper size"
          value={style.page}
          onChange={(v) => set("page", v)}
          options={[
            { value: "A4", label: "A4" },
            { value: "Letter", label: "US Letter" },
          ]}
        />
      </div>
      <div>
        <Button
          variant="ghost"
          className="h-7 px-2 text-muted"
          onClick={() =>
            edit((r) => {
              r.style = { ...DEFAULT_STYLE };
            })
          }
        >
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}
