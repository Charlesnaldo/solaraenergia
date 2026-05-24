'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileDown,
  FileSpreadsheet,
  Mail,
  MessageCircle,
  RefreshCcw,
  Search,
  Upload,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { BillingStatus, DashboardBilling } from '@/services/saas-dashboard-service';
import { useDashboardStore } from '@/stores/dashboard-store';

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

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${date}T00:00:00`));
}

function getPdfUrl(billing: DashboardBilling) {
  return `/api/clientes/${billing.clienteId}/faturamentos/${billing.id}/pdf`;
}

function exportCsv(rows: DashboardBilling[]) {
  const header = ['cliente', 'valor', 'vencimento', 'status', 'linha_digitavel'];
  const csv = [
    header.join(';'),
    ...rows.map((row) =>
      [
        row.cliente,
        String(row.valor).replace('.', ','),
        row.vencimento,
        statusLabel[row.status],
        row.linhaDigitavel ?? '',
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(';'),
    ),
  ].join('\n');

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'solara-faturamentos.csv';
  anchor.click();
  URL.revokeObjectURL(url);
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

interface BillingTableProps {
  billings: DashboardBilling[];
  title?: string;
  description?: string;
  initialStatus?: BillingStatus | 'todos';
}

export function BillingTable({
  billings,
  title = 'Faturamentos',
  description = 'Operação de boleto, Pix, segunda via e comunicação.',
  initialStatus = 'todos',
}: BillingTableProps) {
  const globalSearch = useDashboardStore((state) => state.globalSearch);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<BillingStatus | 'todos'>(initialStatus);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const pageSize = 6;

  const filtered = useMemo(() => {
    const search = `${globalSearch} ${query}`.trim().toLowerCase();
    return billings.filter((billing) => {
      const matchesStatus = status === 'todos' || billing.status === status;
      const matchesSearch =
        !search ||
        [billing.cliente, billing.id, billing.linhaDigitavel, billing.codigoBarras, billing.pix]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [billings, globalSearch, query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, status, globalSearch]);

  async function runAction(id: string, action: () => Promise<void>) {
    try {
      setBusyId(id);
      await action();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Ação não concluída.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-col gap-4 lg:flex-row lg:items-center">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <div className="relative min-w-0 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--dash-muted)]" size={16} />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar" className="pl-9" />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as BillingStatus | 'todos')}
            className="h-10 rounded-md border border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] px-3 text-sm font-semibold text-[color:var(--dash-fg)] outline-none"
          >
            <option value="todos">Todos</option>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
            <option value="gerado">Gerado</option>
            <option value="atrasado">Atrasado</option>
            <option value="nao_pago">Não pago</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            <FileDown size={15} />
            PDF
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => exportCsv(filtered)}>
            <FileSpreadsheet size={15} />
            Excel
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => csvInputRef.current?.click()}>
            <Upload size={15} />
            CSV
          </Button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) window.alert(`CSV selecionado: ${file.name}`);
              event.target.value = '';
            }}
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-[color:var(--dash-border)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRows.map((billing) => (
                <TableRow key={billing.id}>
                  <TableCell>
                    <Link href={`/dashboard/faturamentos/${billing.id}`} className="font-semibold hover:text-yellow-300">
                      {billing.cliente}
                    </Link>
                    <p className="mt-1 text-xs text-[color:var(--dash-muted)]">{billing.id}</p>
                  </TableCell>
                  <TableCell className="font-black">{currency.format(billing.valor)}</TableCell>
                  <TableCell>{formatDate(billing.vencimento)}</TableCell>
                  <TableCell>
                    <Badge tone={statusTone[billing.status]}>{statusLabel[billing.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Visualizar PDF"
                        aria-label="Visualizar PDF"
                        onClick={() => window.open(getPdfUrl(billing), '_blank', 'noopener,noreferrer')}
                      >
                        <FileDown size={16} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Copiar Pix"
                        aria-label="Copiar Pix"
                        disabled={!billing.pix}
                        onClick={() => runAction(billing.id, async () => navigator.clipboard.writeText(billing.pix ?? ''))}
                      >
                        <Copy size={16} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Baixar boleto"
                        aria-label="Baixar boleto"
                        onClick={() => window.open(billing.boletoUrl && billing.boletoUrl !== '#' ? billing.boletoUrl : getPdfUrl(billing), '_blank', 'noopener,noreferrer')}
                      >
                        <Download size={16} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Enviar e-mail"
                        aria-label="Enviar e-mail"
                        disabled={busyId === billing.id}
                        onClick={() => runAction(billing.id, async () => postJson('/api/admin/clientes/email-pdf', { faturamentoId: billing.id }))}
                      >
                        <Mail size={16} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Enviar WhatsApp"
                        aria-label="Enviar WhatsApp"
                        disabled={busyId === billing.id}
                        onClick={() => runAction(billing.id, async () => postJson('/api/boletos/whatsapp', { faturamentoId: billing.id }))}
                      >
                        <MessageCircle size={16} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Gerar segunda via"
                        aria-label="Gerar segunda via"
                        onClick={() => window.open(getPdfUrl(billing), '_blank', 'noopener,noreferrer')}
                      >
                        <RefreshCcw size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col justify-between gap-3 text-sm text-[color:var(--dash-muted)] sm:flex-row sm:items-center">
          <span>
            {filtered.length} registros encontrados, página {page} de {pageCount}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              <ChevronLeft size={15} />
              Anterior
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>
              Próxima
              <ChevronRight size={15} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
