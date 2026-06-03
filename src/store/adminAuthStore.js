'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAdminAuthStore = create(
  persist(
    (set) => ({
      user: null,
      admin: null,
      clearAuth: () => set({ user: null, admin: null }),
      setAuth: (user, admin) => set({ user, admin }),
    }),
    {
      name: 'parish-admin-auth',
      partialize: (state) => ({ user: state.user, admin: state.admin }),
    }
  )
);

export default useAdminAuthStore;
