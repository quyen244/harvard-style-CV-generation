# CV-gen

A minimalist Harvard-style CV editor built with Next.js.
Everything is stored in your browser (localStorage); there is no server or account.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Features

- Several CVs side by side, each with its own section order (for example Experience → Projects → Research in one, Research → Projects in another).
- Drag sections, items, bullets, skill rows and links by their ⋮⋮ handle to reorder them.
- Add, edit, duplicate, hide and delete sections and items; every change can be undone (Ctrl+Z / Ctrl+Shift+Z).
- Section types: entries (title, subtitle, date, location, link, bullets), skills (label: value), lines, and a free-text paragraph.
- `**bold**` in any text, or select text and press Ctrl+B.
- Live A4 / US Letter preview with an estimated page count and page-break markers.
- Download PDF uses the browser print dialog (Ctrl+P → "Save as PDF"), so the text in the PDF stays selectable for ATS parsers.
  Turn off "Headers and footers" in the print dialog.
- Export a CV as `.json` and import it again on another machine.

## Tests

```bash
npm test          # unit tests (vitest)
npm run test:e2e  # end-to-end tests (Playwright, uses the installed Chrome)
```

## Layout

- `src/lib/types.ts` - the CV data model.
- `src/lib/ops.ts` - pure operations: factories, reorder, duplicate, import normalisation.
- `src/lib/store.ts` - zustand store with persistence and undo/redo history.
- `src/components/CvDocument.tsx` - renders the Harvard layout; shared by the preview and print.
- `src/components/editor/` - the editing panels.
