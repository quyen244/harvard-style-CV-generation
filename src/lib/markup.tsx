import { Fragment, type ReactNode } from "react";

/** Splits text on **bold** markers. Unclosed markers are kept as literal text. */
export function parseBold(text: string): { text: string; bold: boolean }[] {
  const parts: { text: string; bold: boolean }[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), bold: false });
    parts.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), bold: false });
  return parts;
}

export function Rich({ text }: { text: string }): ReactNode {
  return parseBold(text).map((p, i) =>
    p.bold ? <strong key={i}>{p.text}</strong> : <Fragment key={i}>{p.text}</Fragment>,
  );
}
