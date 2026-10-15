"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* ---------- buttons ---------- */

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" };

export function Button({ variant = "outline", className, ...p }: BtnProps) {
  return (
    <button
      type="button"
      {...p}
      className={cx(
        "inline-flex h-8 select-none items-center gap-1.5 whitespace-nowrap rounded-[6px] px-3 text-[13px] font-medium transition-[background-color,transform,color] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
        variant === "primary" && "bg-ink-strong text-white hover:bg-[#333]",
        variant === "outline" && "border border-line bg-surface text-ink hover:bg-surface-2 hover:border-line-strong",
        variant === "ghost" && "text-ink hover:bg-black/[0.04]",
        className,
      )}
    />
  );
}

export function IconButton({
  label,
  className,
  tone = "default",
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: "default" | "danger" }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...p}
      className={cx(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-[5px] text-muted transition-colors disabled:pointer-events-none disabled:opacity-30",
        tone === "danger" ? "hover:bg-danger-bg hover:text-danger-ink" : "hover:bg-black/[0.05] hover:text-ink",
        className,
      )}
    />
  );
}

/* ---------- inputs ---------- */

const fieldBase =
  "w-full rounded-[6px] border border-line bg-surface px-2.5 text-[13px] text-ink-strong placeholder:text-faint outline-none transition-[border-color,box-shadow] hover:border-line-strong focus:border-[#b9b8b4] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...p },
  ref,
) {
  return <input ref={ref} {...p} className={cx(fieldBase, "h-8", className)} />;
});

/** Textarea that grows with its content. */
export const AutoTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function AutoTextarea({ className, value, ...p }, ref) {
    const inner = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => inner.current!);

    const resize = () => {
      const el = inner.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight + 2}px`;
    };
    useLayoutEffect(resize, [value]);
    useEffect(() => {
      const el = inner.current;
      if (!el) return;
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    return (
      <textarea
        ref={inner}
        rows={1}
        value={value}
        {...p}
        className={cx(fieldBase, "block resize-none overflow-hidden py-[6px] leading-[1.5]", className)}
      />
    );
  },
);

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx("flex min-w-0 flex-col gap-1", className)}>
      <span className="flex items-baseline justify-between text-[11px] font-medium uppercase tracking-[0.05em] text-muted">
        {label}
        {hint && <span className="normal-case tracking-normal text-faint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

/* ---------- popover menu ---------- */

export function Menu({
  trigger,
  children,
  align = "left",
  width = 220,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Open upwards when there is not enough room below the trigger.
  useLayoutEffect(() => {
    if (!open || !root.current || !panel.current) return;
    const r = root.current.getBoundingClientRect();
    const h = panel.current.offsetHeight;
    setUp(window.innerHeight - r.bottom < h + 12 && r.top > h + 12);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          ref={panel}
          role="menu"
          style={{ width }}
          className={cx(
            "absolute z-50",
            up ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]",
            "rounded-[8px] border border-line bg-surface p-1 shadow-[0_8px_28px_rgba(0,0,0,0.08)]",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  icon,
  children,
  hint,
  tone,
  active,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode; hint?: ReactNode; tone?: "danger"; active?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      {...p}
      className={cx(
        "flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-left text-[13px] transition-colors disabled:pointer-events-none disabled:opacity-40",
        tone === "danger" ? "text-danger-ink hover:bg-danger-bg" : "text-ink hover:bg-black/[0.04]",
        active && "bg-black/[0.04]",
      )}
    >
      {icon && <span className="flex size-4 shrink-0 items-center justify-center text-muted">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint && <span className="shrink-0 text-[11px] text-faint">{hint}</span>}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.05em] text-faint">{children}</div>;
}

export function MenuDivider() {
  return <div className="my-1 h-px bg-line" />;
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-[4px] border border-line bg-canvas px-1 font-mono text-[10px] leading-4 text-muted">{children}</kbd>
  );
}
