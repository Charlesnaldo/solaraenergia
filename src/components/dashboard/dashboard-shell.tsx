'use client';

import type { CSSProperties, ReactNode } from 'react';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardTopbar } from '@/components/dashboard/topbar';
import { useDashboardRealtime } from '@/hooks/use-dashboard-realtime';
import { useDashboardStore } from '@/stores/dashboard-store';

type DashboardCssVars = CSSProperties & {
  '--dash-bg': string;
  '--dash-bg-soft': string;
  '--dash-surface': string;
  '--dash-surface-strong': string;
  '--dash-border': string;
  '--dash-fg': string;
  '--dash-muted': string;
};

const darkVars: DashboardCssVars = {
  '--dash-bg': '#020617',
  '--dash-bg-soft': '#050814',
  '--dash-surface': 'rgba(15,23,42,0.72)',
  '--dash-surface-strong': 'rgba(15,23,42,0.92)',
  '--dash-border': 'rgba(255,255,255,0.10)',
  '--dash-fg': '#f8fafc',
  '--dash-muted': '#94a3b8',
};

const lightVars: DashboardCssVars = {
  '--dash-bg': '#f8fafc',
  '--dash-bg-soft': '#ffffff',
  '--dash-surface': 'rgba(255,255,255,0.92)',
  '--dash-surface-strong': '#ffffff',
  '--dash-border': 'rgba(15,23,42,0.12)',
  '--dash-fg': '#0f172a',
  '--dash-muted': '#64748b',
};

interface DashboardShellProps {
  children: ReactNode;
  basePath?: '/dashboard' | '/admin';
}

export function DashboardShell({ children, basePath = '/dashboard' }: DashboardShellProps) {
  const theme = useDashboardStore((state) => state.theme);

  useDashboardRealtime();

  return (
    <div
      style={theme === 'dark' ? darkVars : lightVars}
      className="min-h-screen bg-[color:var(--dash-bg)] text-[color:var(--dash-fg)]"
    >
      <DashboardSidebar basePath={basePath} />
      <div className="min-h-screen lg:pl-72">
        <DashboardTopbar />
        <main className="px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
