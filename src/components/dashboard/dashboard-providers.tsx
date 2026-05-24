'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { useDashboardStore, type DashboardRole } from '@/stores/dashboard-store';

interface DashboardProvidersProps {
  children: ReactNode;
  role: DashboardRole;
}

export function DashboardProviders({ children, role }: DashboardProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  const setRole = useDashboardStore((state) => state.setRole);

  useEffect(() => {
    setRole(role);
  }, [role, setRole]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
