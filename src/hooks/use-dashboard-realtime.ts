'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function useDashboardRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;

    try {
      const supabase = createSupabaseBrowserClient();
      const channel = supabase
        .channel('saas-dashboard-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'faturamento' }, () => {
          if (mounted) queryClient.invalidateQueries({ queryKey: ['saas-dashboard'] });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => {
          if (mounted) queryClient.invalidateQueries({ queryKey: ['saas-dashboard'] });
        })
        .subscribe();

      return () => {
        mounted = false;
        void supabase.removeChannel(channel);
      };
    } catch {
      return () => {
        mounted = false;
      };
    }
  }, [queryClient]);
}
