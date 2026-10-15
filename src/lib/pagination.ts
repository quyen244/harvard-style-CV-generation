export type BlockKind = "avoid" | "heading" | "text";

export interface Block {
  top: number;
  bottom: number;
  kind: BlockKind;
}

/**
 * Approximates where the browser will break pages when printing, mirroring the
 * print CSS: `avoid` blocks are not split (break-inside: avoid), headings stay
 * with the block after them (break-after: avoid), text may split anywhere.
 *
 * Blocks must be in document order, measured from the top of the content box.
 * Returns the content offset at which each new page starts.
 */
export function computePageBreaks(blocks: Block[], contentHeight: number, pageHeight: number): number[] {
  const breaks: number[] = [];
  if (pageHeight <= 0) return breaks;

  let pageStart = 0;
  for (let guard = 0; guard < 50; guard++) {
    const pageEnd = pageStart + pageHeight;
    if (contentHeight <= pageEnd) break;

    const i = blocks.findIndex((b) => b.bottom > pageEnd + 0.5);
    let next = pageEnd;
    if (i >= 0) {
      const b = blocks[i];
      const fits = b.bottom - b.top <= pageHeight;
      if (b.top >= pageEnd) next = b.top;
      else if (b.kind !== "text" && fits) next = b.top;

      // A heading left alone at the bottom of a page moves to the next page.
      const prev = blocks[i - 1];
      if (next === b.top && prev?.kind === "heading" && prev.top > pageStart) next = prev.top;
    }
    if (next <= pageStart) next = pageEnd;

    breaks.push(next);
    pageStart = next;
  }
  return breaks;
}
