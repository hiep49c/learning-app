/**
 * Toast utility — simple global toast state using Zustand.
 *
 * Uses a zustand store to manage toast message state.
 * Components can subscribe to the store and render a Snackbar.
 * Services call `showToast(message)` to display user-facing messages.
 *
 * Requirements: 17.1, 17.5
 */
import { create } from 'zustand';

// ─── Types ───

interface ToastState {
  message: string | null;
  visible: boolean;
}

interface ToastActions {
  show: (message: string) => void;
  dismiss: () => void;
}

// ─── Store ───

export const useToastStore = create<ToastState & ToastActions>()((set) => ({
  message: null,
  visible: false,

  show: (message: string): void => {
    set({ message, visible: true });
  },

  dismiss: (): void => {
    set({ visible: false });
  },
}));

/**
 * Show a toast message to the user.
 * Can be called from anywhere (services, stores, components).
 */
export function showToast(message: string): void {
  useToastStore.getState().show(message);
}
