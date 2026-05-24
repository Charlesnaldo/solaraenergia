'use client';

import { useQuery } from '@tanstack/react-query';
import { getSaasDashboardData } from '@/services/saas-dashboard-service';

export function useDashboardData() {
  return useQuery({
    queryKey: ['saas-dashboard'],
    queryFn: getSaasDashboardData,
  });
}
