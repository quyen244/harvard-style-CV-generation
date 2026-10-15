import { useCv } from "./store";
import { useToast } from "./toast";
import type { Resume } from "./types";

/**
 * Runs a destructive edit on the active CV and offers an Undo toast.
 * The toast only undoes if nothing else was changed since, so it never reverts the wrong edit.
 */
export function deleteWithUndo(message: string, recipe: (draft: Resume) => void) {
  const cv = useCv.getState();
  cv.edit(recipe);
  const mark = useCv.getState().rev;
  useToast.getState().show(message, {
    label: "Undo",
    run: () => {
      const s = useCv.getState();
      if (s.rev === mark) s.undo();
      else useToast.getState().show("Use Undo in the toolbar - other changes were made since.");
    },
  });
}
