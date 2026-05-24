import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DashboardProviders } from '@/components/dashboard/dashboard-providers';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { DashboardRole } from '@/stores/dashboard-store';

export const metadata: Metadata = {
  title: 'Dashboard Solara Energia',
  description: 'Dashboard SaaS premium para faturamento, cobrança, energia, Pix, boleto e integrações.',
};

async function getDashboardRole(): Promise<DashboardRole> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    const metadataRole = data.user?.app_metadata?.role ?? data.user?.user_metadata?.role;

    if (metadataRole === 'admin' || metadataRole === 'operator' || metadataRole === 'client') {
      return metadataRole;
    }
  } catch {
    return 'admin';
  }

  return 'admin';
}

export default async function SaasDashboardLayout({ children }: { children: ReactNode }) {
  const role = await getDashboardRole();

  return (
    <DashboardProviders role={role}>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProviders>
  );
}
