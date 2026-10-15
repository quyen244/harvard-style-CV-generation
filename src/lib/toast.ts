import { create } from "zustand";

export interface Toast {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
}

interface ToastState {
  toast: Toast | null;
  show: (message: string, action?: Toast["action"]) => void;
  dismiss: () => void;
}

let seq = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

export const useToast = create<ToastState>((set) => ({
  toast: null,
  show: (message, action) => {
    clearTimeout(timer);
    const id = ++seq;
    set({ toast: { id, message, action } });
    timer = setTimeout(() => set((s) => (s.toast?.id === id ? { toast: null } : s)), 5000);
  },
  dismiss: () => set({ toast: null }),
}));
