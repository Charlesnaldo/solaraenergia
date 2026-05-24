import { create } from 'zustand';

export type DashboardRole = 'admin' | 'operator' | 'client';
export type DashboardTheme = 'dark' | 'light';

interface DashboardState {
  sidebarOpen: boolean;
  globalSearch: string;
  theme: DashboardTheme;
  role: DashboardRole;
  setSidebarOpen: (value: boolean) => void;
  setGlobalSearch: (value: string) => void;
  toggleTheme: () => void;
  setRole: (role: DashboardRole) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  sidebarOpen: false,
  globalSearch: '',
  theme: 'dark',
  role: 'admin',
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setGlobalSearch: (globalSearch) => set({ globalSearch }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setRole: (role) => set({ role }),
}));
