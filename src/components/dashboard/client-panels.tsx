'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, Mail, Phone, Zap } from 'lucide-react';
import { BillingTable } from '@/components/dashboard/billing-table';
import { EnergySavingsChart } from '@/components/dashboard/dashboard-charts';
import { PageShell } from '@/components/dashboard/page-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { getClientById } from '@/services/saas-dashboard-service';
import { useDashboardStore } from '@/stores/dashboard-store';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const number = new Intl.NumberFormat('pt-BR');

function statusTone(status: string): 'green' | 'yellow' | 'red' | 'blue' | 'slate' {
  const value = status.toLowerCase();
  if (value.includes('inadimpl')) return 'red';
  if (value.includes('pend')) return 'yellow';
  if (value.includes('ativa') || value.includes('ativo')) return 'green';
  return 'slate';
}

export function ClientsPageContent() {
  const { data, isLoading } = useDashboardData();
  const globalSearch = useDashboardStore((state) => state.globalSearch);

  const clients = useMemo(() => {
    if (!data) return [];
    const search = globalSearch.trim().toLowerCase();
    return data.clients.filter((client) =>
      !search ||
      [client.nome, client.email, client.documento, client.telefone, client.unidade].join(' ').toLowerCase().includes(search),
    );
  }, [data, globalSearch]);

  if (isLoading || !data) {
    return (
      <PageShell eyebrow="CRM" title="Clientes" description="Cadastro, unidade consumidora, economia e histórico financeiro." badge="Supabase">
        <Skeleton className="h-96" />
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="CRM" title="Clientes" description="Cadastro, unidade consumidora, economia e histórico financeiro." badge="Realtime">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[color:var(--dash-muted)]">Clientes ativos</p>
            <p className="mt-2 text-3xl font-black">{clients.filter((client) => client.status === 'ativa').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[color:var(--dash-muted)]">Valor mensal</p>
            <p className="mt-2 text-3xl font-black">{currency.format(clients.reduce((sum, client) => sum + client.valorMensal, 0))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[color:var(--dash-muted)]">kWh monitorados</p>
            <p className="mt-2 text-3xl font-black">{number.format(clients.reduce((sum, client) => sum + client.consumoKwh, 0))}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Base de clientes</CardTitle>
            <CardDescription>Busca rápida, status operacional e acesso ao dossiê do cliente.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-[color:var(--dash-border)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Consumo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Abrir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <p className="font-bold">{client.nome}</p>
                      <p className="mt-1 text-xs text-[color:var(--dash-muted)]">{client.email}</p>
                    </TableCell>
                    <TableCell>{client.documento}</TableCell>
                    <TableCell>{client.unidade}</TableCell>
                    <TableCell>{number.format(client.consumoKwh)} kWh</TableCell>
                    <TableCell>
                      <Badge tone={statusTone(client.status)}>{client.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/clientes/${client.id}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[color:var(--dash-muted)] transition-colors hover:bg-white/10 hover:text-[color:var(--dash-fg)]"
                        aria-label="Abrir cliente"
                        title="Abrir cliente"
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

export function ClientDetailPageContent({ clientId }: { clientId: string }) {
  const { data, isLoading } = useDashboardData();

  if (isLoading || !data) {
    return (
      <PageShell eyebrow="Cliente" title="Carregando cliente" description="Buscando dados completos do cadastro." badge="Realtime">
        <Skeleton className="h-96" />
      </PageShell>
    );
  }

  const client = getClientById(data, clientId);
  const billings = data.billings.filter((billing) => billing.clienteId === client.id);

  return (
    <PageShell eyebrow="Cliente" title={client.nome} description="Dados completos, unidade consumidora, pagamentos, consumo, economia, boleto e Pix." badge={client.status}>
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Dados completos</CardTitle>
                <CardDescription>Cadastro operacional e contato financeiro.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 size={18} className="mt-1 text-yellow-300" />
                <div>
                  <p className="font-bold">{client.documento}</p>
                  <p className="text-sm text-[color:var(--dash-muted)]">{client.unidade}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={18} className="mt-1 text-yellow-300" />
                <p className="text-sm">{client.email}</p>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={18} className="mt-1 text-yellow-300" />
                <p className="text-sm">{client.telefone}</p>
              </div>
              <div className="flex items-start gap-3">
                <Zap size={18} className="mt-1 text-yellow-300" />
                <div>
                  <p className="font-bold">{number.format(client.consumoKwh)} kWh</p>
                  <p className="text-sm text-[color:var(--dash-muted)]">Consumo médio monitorado</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex justify-between gap-3">
                <span className="text-sm text-[color:var(--dash-muted)]">Valor mensal</span>
                <strong>{currency.format(client.valorMensal)}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-sm text-[color:var(--dash-muted)]">Economia</span>
                <strong>{currency.format(client.economia)}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-sm text-[color:var(--dash-muted)]">Boletos</span>
                <strong>{billings.length}</strong>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <EnergySavingsChart
            data={data.energySavings.map((point) => ({
              ...point,
              economia: Math.round((point.economia ?? 0) * Math.max(0.1, client.economia / 100000)),
              kwh: Math.round((point.kwh ?? 0) * Math.max(0.1, client.consumoKwh / 100000)),
            }))}
          />
          <BillingTable billings={billings.length ? billings : data.billings.slice(0, 2)} title="Histórico de pagamentos" description="Boletos, Pix, status e segunda via do cliente." />
        </div>
      </div>
    </PageShell>
  );
}
