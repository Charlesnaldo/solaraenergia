import type { ReactNode } from 'react';
import { DashboardProviders } from '@/components/dashboard/dashboard-providers';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardProviders role="admin">
      <DashboardShell basePath="/admin">{children}</DashboardShell>
    </DashboardProviders>
  );
}
