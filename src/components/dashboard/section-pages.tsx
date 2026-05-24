'use client';

import { Activity, Database, FileDown, FileSpreadsheet, KeyRound, Lock, PlugZap, ShieldCheck, Upload, UserCog, Webhook, Zap } from 'lucide-react';
import { BillingTable } from '@/components/dashboard/billing-table';
import { EnergySavingsChart, PaymentStatusChart, PixVsBoletoChart, RevenueChart } from '@/components/dashboard/dashboard-charts';
import { PageShell } from '@/components/dashboard/page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardData } from '@/hooks/use-dashboard-data';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function LoadingSection({ title }: { title: string }) {
  return (
    <PageShell eyebrow="Solara" title={title} description="Carregando dados operacionais." badge="Realtime">
      <Skeleton className="h-96" />
    </PageShell>
  );
}

export function FaturamentosPageContent() {
  const { data, isLoading } = useDashboardData();
  if (isLoading || !data) return <LoadingSection title="Faturamentos" />;

  return (
    <PageShell eyebrow="Financeiro" title="Faturamentos" description="Gestão completa de PDF, Pix, boleto, vencimento, status e segunda via." badge="Produção">
      <RevenueChart data={data.monthlyRevenue} />
      <BillingTable billings={data.billings} title="Tabela de faturamentos" description="Visualizar PDF, copiar Pix, baixar boleto, enviar e-mail, WhatsApp e gerar segunda via." />
    </PageShell>
  );
}

export function CobrancasPageContent() {
  const { data, isLoading } = useDashboardData();
  if (isLoading || !data) return <LoadingSection title="Cobranças" />;

  return (
    <PageShell eyebrow="Cobrança" title="Cobranças" description="Carteira aberta, vencimentos, réguas de comunicação e ações de recuperação." badge="Automação">
      <BillingTable billings={data.billings} title="Cobranças em aberto" description="Filtros avançados por cliente, status, vencimento e linha digitável." initialStatus="pendente" />
    </PageShell>
  );
}

export function PagamentosPageContent() {
  const { data, isLoading } = useDashboardData();
  if (isLoading || !data) return <LoadingSection title="Pagamentos" />;

  return (
    <PageShell eyebrow="Recebíveis" title="Pagamentos" description="Conciliação de Pix, boleto, liquidação e inadimplência." badge="Itaú">
      <div className="grid gap-4 xl:grid-cols-2">
        <PaymentStatusChart data={data.paymentStatus} />
        <PixVsBoletoChart data={data.pixVsBoleto} />
      </div>
      <BillingTable billings={data.billings} title="Pagamentos por status" description="Pagos, pendentes, atrasados e cancelados com ações operacionais." />
    </PageShell>
  );
}

export function EnergiaPageContent() {
  const { data, isLoading } = useDashboardData();
  if (isLoading || !data) return <LoadingSection title="Energia" />;

  const kwh = data.clients.reduce((sum, client) => sum + client.consumoKwh, 0);
  const savings = data.clients.reduce((sum, client) => sum + client.economia, 0);

  return (
    <PageShell eyebrow="Energia" title="Energia" description="Consumo, economia, kWh compensados e performance de unidades consumidoras." badge="Geração distribuída">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[color:var(--dash-muted)]">Economia gerada</p>
            <p className="mt-2 text-3xl font-black">{currency.format(savings)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[color:var(--dash-muted)]">kWh compensados</p>
            <p className="mt-2 text-3xl font-black">{new Intl.NumberFormat('pt-BR').format(kwh)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[color:var(--dash-muted)]">Unidades</p>
            <p className="mt-2 text-3xl font-black">{data.clients.length}</p>
          </CardContent>
        </Card>
      </div>
      <EnergySavingsChart data={data.energySavings} />
    </PageShell>
  );
}

export function RelatoriosPageContent() {
  const { data, isLoading } = useDashboardData();
  if (isLoading || !data) return <LoadingSection title="Relatórios" />;

  return (
    <PageShell eyebrow="BI" title="Relatórios" description="Exportações executivas, fechamento financeiro e auditoria para diretoria." badge="PDF / Excel">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Fechamento financeiro', 'Receita mensal, inadimplência e recebíveis.', FileDown],
          ['Base de clientes', 'Status, consumo, economia e unidade consumidora.', FileSpreadsheet],
          ['Importação CSV', 'Carga operacional para atualização em massa.', Upload],
        ].map(([title, description, Icon]) => (
          <Card key={String(title)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-yellow-400/20 bg-yellow-400/10 text-yellow-200">
                  <Icon size={18} />
                </div>
                <div>
                  <CardTitle>{String(title)}</CardTitle>
                  <CardDescription>{String(description)}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button type="button" variant="outline" onClick={() => window.print()}>
                Gerar relatório
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <RevenueChart data={data.monthlyRevenue} />
    </PageShell>
  );
}

export function IntegracoesPageContent() {
  const { data, isLoading } = useDashboardData();
  if (isLoading || !data) return <LoadingSection title="Integrações" />;

  return (
    <PageShell eyebrow="Integrações" title="Integrações" description="Itaú, Supabase, webhooks, storage, realtime e trilha de auditoria." badge={data.itauStatus.environment}>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Integração Itaú</CardTitle>
              <CardDescription>Status de token, webhook, ambiente, logs API e erros.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ['Token', data.itauStatus.token, KeyRound],
              ['Webhook', data.itauStatus.webhook, Webhook],
              ['Homologação', data.itauStatus.environment, PlugZap],
              ['Latência', `${data.itauStatus.latencyMs}ms`, Activity],
            ].map(([label, value, Icon]) => (
              <div key={String(label)} className="rounded-lg border border-[color:var(--dash-border)] p-4">
                <Icon size={18} className="text-yellow-300" />
                <p className="mt-3 text-sm text-[color:var(--dash-muted)]">{String(label)}</p>
                <p className="mt-1 font-black">{String(value)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Supabase</CardTitle>
              <CardDescription>Autenticação, storage, realtime, policies e auditoria.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ['Auth', 'Sessões e usuários', ShieldCheck],
              ['Storage', 'PDFs e anexos', Database],
              ['Realtime', 'Clientes e faturamento', Zap],
              ['Policies', 'RBAC por perfil', Lock],
            ].map(([label, value, Icon]) => (
              <div key={String(label)} className="rounded-lg border border-[color:var(--dash-border)] p-4">
                <Icon size={18} className="text-sky-300" />
                <p className="mt-3 text-sm text-[color:var(--dash-muted)]">{String(label)}</p>
                <p className="mt-1 font-black">{String(value)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Logs API</CardTitle>
            <CardDescription>Auditoria de integração e eventos recentes.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.logs.map((log) => (
            <div key={log.id} className="flex flex-col justify-between gap-2 rounded-lg border border-[color:var(--dash-border)] p-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold">{log.label}</p>
                <p className="text-sm text-[color:var(--dash-muted)]">{log.detail}</p>
              </div>
              <Badge tone={log.status === 'ok' ? 'green' : log.status === 'warning' ? 'yellow' : 'red'}>{log.time}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}

export function UsuariosPageContent() {
  return (
    <PageShell eyebrow="Segurança" title="Usuários" description="Controle RBAC para admin, operador e cliente, com trilha de auditoria." badge="RBAC">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Admin', 'Acesso completo a finanças, clientes, integrações e configurações.'],
          ['Operator', 'Operação de cobrança, envio de PDF, WhatsApp e segunda via.'],
          ['Client', 'Consulta de boletos, Pix, consumo, economia e histórico.'],
        ].map(([role, description]) => (
          <Card key={role}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <UserCog className="text-yellow-300" size={20} />
                <div>
                  <CardTitle>{role}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Badge tone={role === 'Admin' ? 'green' : role === 'Operator' ? 'blue' : 'slate'}>policy ativa</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

export function LogsPageContent() {
  const { data, isLoading } = useDashboardData();
  if (isLoading || !data) return <LoadingSection title="Logs" />;

  return (
    <PageShell eyebrow="Auditoria" title="Logs" description="Eventos de webhook, PDFs, pagamentos, segurança e ações administrativas." badge="Audit trail">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Trilha de auditoria</CardTitle>
            <CardDescription>Eventos recentes da operação financeira.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-[color:var(--dash-border)] p-4">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-bold">{log.label}</p>
                  <p className="mt-1 text-sm text-[color:var(--dash-muted)]">{log.detail}</p>
                </div>
                <Badge tone={log.status === 'ok' ? 'green' : log.status === 'warning' ? 'yellow' : 'red'}>{log.status}</Badge>
              </div>
              <p className="mt-3 text-xs text-[color:var(--dash-muted)]">{log.time}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}

export function ConfiguracoesPageContent() {
  return (
    <PageShell eyebrow="Admin" title="Configurações" description="Preferências operacionais, segurança, notificações e políticas do dashboard." badge="Enterprise">
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ['Proteção de rotas', 'Middleware e sessão Supabase para áreas administrativas.'],
          ['Auditoria', 'Registro de envio, download, geração de PDF e webhooks.'],
          ['Notificações', 'E-mail, WhatsApp, alertas de vencimento e inadimplência.'],
          ['Ambiente Itaú', 'Homologação, produção, token e webhook de retorno.'],
        ].map(([title, description]) => (
          <Card key={title}>
            <CardHeader>
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Badge tone="green">configurado</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
