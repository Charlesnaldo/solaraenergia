'use client';

import { m } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, CircleDollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { DashboardMetric } from '@/services/saas-dashboard-service';

interface MetricCardProps {
  metric: DashboardMetric;
  index: number;
}

export function MetricCard({ metric, index }: MetricCardProps) {
  const positive = !metric.trend.startsWith('-') && metric.tone !== 'red';

  return (
    <m.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.035 }}
    >
      <Card className="h-full overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-black uppercase tracking-[0.16em] text-[color:var(--dash-muted)]">{metric.label}</p>
              <p className="mt-3 text-2xl font-black tracking-tight text-[color:var(--dash-fg)]">{metric.value}</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-yellow-400/20 bg-yellow-400/10 text-yellow-200">
              <CircleDollarSign size={18} />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="truncate text-sm text-[color:var(--dash-muted)]">{metric.helper}</span>
            <Badge tone={metric.tone} className="gap-1 whitespace-nowrap">
              {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {metric.trend}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </m.div>
  );
}
