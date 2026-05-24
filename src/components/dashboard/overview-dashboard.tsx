'use client';

import { m } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { BillingTable } from '@/components/dashboard/billing-table';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { MetricCard } from '@/components/dashboard/metric-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardData } from '@/hooks/use-dashboard-data';

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {Array.from({ length: 9 }).map((_, index) => (
          <Skeleton key={index} className="h-36" />
        ))}
      </div>
      <Skeleton className="h-80" />
      <Skeleton className="h-96" />
    </div>
  );
}

export function OverviewDashboard() {
  const { data, isLoading } = useDashboardData();

  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-5">
      <m.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-300">Solara SaaS</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[color:var(--dash-fg)] md:text-4xl">Dashboard operacional</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--dash-muted)]">
              Faturamento, cobrança, energia, Pix, boleto, auditoria e integração Itaú em uma visão executiva.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone="green" className="gap-2">
              <CheckCircle2 size={13} />
              Realtime
            </Badge>
            <Badge tone="blue" className="gap-2">
              <ShieldCheck size={13} />
              RBAC
            </Badge>
            <Badge tone={data.itauStatus.token === 'online' ? 'green' : 'yellow'} className="gap-2">
              <Activity size={13} />
              Itaú {data.itauStatus.latencyMs}ms
            </Badge>
          </div>
        </div>
      </m.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {data.metrics.map((metric, index) => (
          <MetricCard key={metric.id} metric={metric} index={index} />
        ))}
      </section>

      <DashboardCharts data={data} />

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <BillingTable billings={data.billings} />

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Logs críticos</CardTitle>
              <CardDescription>Eventos financeiros, webhook e auditoria.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.logs.map((log) => (
              <div key={log.id} className="rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-surface-strong)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[color:var(--dash-fg)]">{log.label}</p>
                    <p className="mt-1 text-sm leading-5 text-[color:var(--dash-muted)]">{log.detail}</p>
                  </div>
                  <Badge tone={log.status === 'ok' ? 'green' : log.status === 'warning' ? 'yellow' : 'red'}>
                    {log.status === 'error' ? <AlertTriangle size={12} /> : null}
                    {log.status}
                  </Badge>
                </div>
                <p className="mt-3 text-xs font-semibold text-[color:var(--dash-muted)]">{log.time}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
