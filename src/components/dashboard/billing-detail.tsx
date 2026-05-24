'use client';

import { Copy, Download, FileText, Mail, MessageCircle, QrCode, RefreshCcw, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import type { BillingStatus, DashboardBilling } from '@/services/saas-dashboard-service';
import { getBillingById } from '@/services/saas-dashboard-service';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const statusTone: Record<BillingStatus, 'green' | 'yellow' | 'red' | 'blue' | 'slate'> = {
  pago: 'green',
  pendente: 'yellow',
  gerado: 'blue',
  atrasado: 'red',
  cancelado: 'slate',
  nao_pago: 'red',
};

const statusLabel: Record<BillingStatus, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  gerado: 'Gerado',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
  nao_pago: 'Não pago',
};

function getPdfUrl(billing: DashboardBilling) {
  return `/api/clientes/${billing.clienteId}/faturamentos/${billing.id}/pdf`;
}

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? 'Não foi possível executar a ação.');
  }
}

function PixPreview({ payload }: { payload: string | null }) {
  if (!payload) {
    return (
      <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed border-[color:var(--dash-border)] text-sm text-[color:var(--dash-muted)]">
        Pix indisponível para esta cobrança.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-surface-strong)] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-md border border-yellow-400/30 bg-yellow-400/10 text-yellow-200">
          <QrCode size={28} />
        </div>
        <div>
          <p className="font-black">QR Code Pix oficial</p>
          <p className="text-sm text-[color:var(--dash-muted)]">Renderizado no PDF a partir do BR Code salvo.</p>
        </div>
      </div>
      <pre className="mt-4 max-h-36 overflow-auto whitespace-pre-wrap break-all rounded-md bg-black/20 p-3 text-xs leading-5 text-[color:var(--dash-muted)]">
        {payload}
      </pre>
    </div>
  );
}

export function BillingDetailPageContent({ faturamentoId }: { faturamentoId: string }) {
  const { data, isLoading } = useDashboardData();

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-[640px]" />
      </div>
    );
  }

  const billing = getBillingById(data, faturamentoId);
  const pdfUrl = getPdfUrl(billing);

  async function run(action: () => Promise<void>) {
    try {
      await action();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Ação não concluída.');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-300">Faturamento</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{billing.cliente}</h1>
          <p className="mt-2 text-sm text-[color:var(--dash-muted)]">
            {billing.id} · {currency.format(billing.valor)} · vencimento {billing.vencimento}
          </p>
        </div>
        <Badge tone={statusTone[billing.status]}>{statusLabel[billing.status]}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}>
          <FileText size={16} />
          Visualizar PDF
        </Button>
        <Button type="button" variant="outline" onClick={() => window.open(billing.boletoUrl && billing.boletoUrl !== '#' ? billing.boletoUrl : pdfUrl, '_blank', 'noopener,noreferrer')}>
          <Download size={16} />
          Baixar boleto
        </Button>
        <Button type="button" variant="outline" disabled={!billing.pix} onClick={() => run(async () => navigator.clipboard.writeText(billing.pix ?? ''))}>
          <Copy size={16} />
          Copiar Pix
        </Button>
        <Button type="button" variant="outline" onClick={() => run(async () => postJson('/api/admin/clientes/email-pdf', { faturamentoId: billing.id }))}>
          <Mail size={16} />
          E-mail
        </Button>
        <Button type="button" variant="outline" onClick={() => run(async () => postJson('/api/boletos/whatsapp', { faturamentoId: billing.id }))}>
          <MessageCircle size={16} />
          WhatsApp
        </Button>
        <Button type="button" variant="outline" onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}>
          <RefreshCcw size={16} />
          Segunda via
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>PDF preview</CardTitle>
              <CardDescription>Boleto profissional com QR Code Pix, linha digitável e código de barras.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <iframe
              title="Preview PDF do faturamento"
              src={pdfUrl}
              className="h-[720px] w-full rounded-lg border border-[color:var(--dash-border)] bg-white"
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Pix e boleto</CardTitle>
                <CardDescription>Campos oficiais armazenados para cobrança.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <PixPreview payload={billing.pix} />

              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-black uppercase tracking-[0.16em] text-[color:var(--dash-muted)]">Linha digitável</p>
                  <p className="mt-2 break-all rounded-md border border-[color:var(--dash-border)] p-3 font-mono">{billing.linhaDigitavel ?? 'Não informada'}</p>
                </div>
                <div>
                  <p className="font-black uppercase tracking-[0.16em] text-[color:var(--dash-muted)]">Código de barras</p>
                  <p className="mt-2 break-all rounded-md border border-[color:var(--dash-border)] p-3 font-mono">{billing.codigoBarras ?? 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Timeline</CardTitle>
                <CardDescription>Eventos e auditoria da cobrança.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ['Cobrança criada', billing.createdAt],
                ['BR Code Pix validado', billing.pix ? 'Payload oficial disponível' : 'Sem Pix oficial'],
                ['PDF gerado', 'Aguardando ação do operador'],
                ['Webhook Itaú', billing.status === 'pago' ? 'Pagamento confirmado' : 'Monitorando liquidação'],
              ].map(([label, detail], index) => (
                <div key={label} className="flex gap-3">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-yellow-400/30 bg-yellow-400/10 text-yellow-200">
                    <ShieldCheck size={15} />
                  </div>
                  <div className="border-b border-[color:var(--dash-border)] pb-3">
                    <p className="font-bold">{index + 1}. {label}</p>
                    <p className="mt-1 text-sm text-[color:var(--dash-muted)]">{detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
