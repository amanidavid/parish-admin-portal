'use client';
import { create } from 'zustand';

const useUiLoaderStore = create((set) => ({
  pendingCount: 0,
  start: () => set((state) => ({ pendingCount: state.pendingCount + 1 })),
  stop: () => set((state) => ({ pendingCount: Math.max(0, state.pendingCount - 1) })),
  reset: () => set({ pendingCount: 0 }),
}));

export default useUiLoaderStore;
