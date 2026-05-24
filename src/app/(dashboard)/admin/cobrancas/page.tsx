'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DashboardOverview, Faturamento, FaturamentoStatus } from '@/lib/dashboard/types';

type ClienteComFaturamento = DashboardOverview['clientes'][number];

type BoletoRow = Faturamento & {
  clienteNome: string;
  clienteDocumento: string;
  clienteEmail: string | null;
  clienteTelefone: string | null;
};

const statusLabels: Record<FaturamentoStatus, string> = {
  gerado: 'Em aberto',
  pago: 'Pago',
  nao_pago: 'Não pago',
};

const statusClasses: Record<FaturamentoStatus, string> = {
  gerado: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-200',
  pago: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  nao_pago: 'border-red-400/30 bg-red-400/10 text-red-200',
};

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDateBR(value: string | null | undefined) {
  if (!value) return '-';

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('pt-BR').format(date);
}

function getClientBillings(cliente: ClienteComFaturamento) {
  if (cliente.historicoFaturamentos?.length) return cliente.historicoFaturamentos;
  return cliente.ultimoFaturamento ? [cliente.ultimoFaturamento] : [];
}

function buildPdfUrl(boleto: BoletoRow) {
  return `/api/clientes/${boleto.cliente_id}/faturamentos/${boleto.id}/pdf`;
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) throw new Error(payload?.error ?? 'Não foi possível concluir a ação.');
}

export default function AdminCobrancasPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FaturamentoStatus | 'todos'>('todos');
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/overview', { cache: 'no-store' });
      const data = (await res.json()) as DashboardOverview;
      setOverview(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const boletos = useMemo<BoletoRow[]>(() => {
    if (!overview) return [];

    return overview.clientes
      .flatMap((cliente) =>
        getClientBillings(cliente).map((boleto) => ({
          ...boleto,
          clienteNome: cliente.nome,
          clienteDocumento: cliente.cpf_cnpj,
          clienteEmail: cliente.email,
          clienteTelefone: cliente.whatsapp || cliente.telefone,
        })),
      )
      .sort((a, b) => String(b.data_vencimento ?? '').localeCompare(String(a.data_vencimento ?? '')));
  }, [overview]);

  const filteredBoletos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return boletos.filter((boleto) => {
      const matchesStatus = statusFilter === 'todos' || boleto.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        [
          boleto.clienteNome,
          boleto.clienteDocumento,
          boleto.clienteEmail,
          boleto.clienteTelefone,
          boleto.id,
          boleto.id_itau,
          boleto.nosso_numero,
          boleto.linha_digitavel,
          boleto.codigo_barras,
          boleto.pix_qr_code,
          boleto.pix_url,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [boletos, query, statusFilter]);

  const totals = useMemo(() => {
    const paid = boletos.filter((boleto) => boleto.status === 'pago');
    const open = boletos.filter((boleto) => boleto.status !== 'pago');

    return {
      total: boletos.length,
      paid: paid.length,
      open: open.length,
      paidValue: paid.reduce((sum, boleto) => sum + Number(boleto.valor ?? 0), 0),
      openValue: open.reduce((sum, boleto) => sum + Number(boleto.valor ?? 0), 0),
    };
  }, [boletos]);

  const openPdf = (boleto: BoletoRow) => {
    window.open(buildPdfUrl(boleto), '_blank', 'noopener,noreferrer');
  };

  const downloadPdf = async (boleto: BoletoRow) => {
    setBusyId(boleto.id);
    try {
      const res = await fetch(buildPdfUrl(boleto));
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Falha ao baixar boleto.');
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `boleto-${boleto.cliente_id}-${boleto.data_vencimento}.pdf`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao baixar boleto.');
    } finally {
      setBusyId(null);
    }
  };

  const updateBillingStatus = async (boleto: BoletoRow, status: FaturamentoStatus) => {
    setBusyId(boleto.id);
    try {
      const res = await fetch('/api/boletos/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faturamentoId: boleto.id, status }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? 'Falha ao atualizar status.');
      await loadOverview();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao atualizar status.');
    } finally {
      setBusyId(null);
    }
  };

  const sendEmail = async (boleto: BoletoRow) => {
    setBusyId(boleto.id);
    try {
      await postJson('/api/boletos/email', { faturamentoId: boleto.id });
      alert('E-mail enviado.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao enviar e-mail.');
    } finally {
      setBusyId(null);
    }
  };

  const sendWhatsapp = async (boleto: BoletoRow) => {
    setBusyId(boleto.id);
    try {
      await postJson('/api/boletos/whatsapp', { faturamentoId: boleto.id });
      alert('WhatsApp enviado.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao enviar WhatsApp.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading || !overview) {
    return <div className="text-[color:var(--dash-muted)]">Carregando cobranças...</div>;
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-300">Cobranças</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[color:var(--dash-fg)] md:text-4xl">Todos os boletos gerados</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--dash-muted)]">
            Acompanhamento completo dos boletos emitidos, com status de pagamento, vencimento, Pix, linha digitável e ações operacionais.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadOverview()}
          className="h-10 rounded-md border border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] px-4 text-sm font-bold text-[color:var(--dash-fg)] transition hover:border-yellow-400/50"
        >
          Recarregar
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--dash-muted)]">Boletos gerados</p>
          <p className="mt-2 text-3xl font-black">{totals.total}</p>
        </div>
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">Pagos</p>
          <p className="mt-2 text-3xl font-black text-emerald-100">{totals.paid}</p>
          <p className="mt-1 text-sm text-emerald-200/80">{money(totals.paidValue)}</p>
        </div>
        <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-yellow-200">Não pagos</p>
          <p className="mt-2 text-3xl font-black text-yellow-100">{totals.open}</p>
          <p className="mt-1 text-sm text-yellow-200/80">{money(totals.openValue)}</p>
        </div>
        <div className="rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--dash-muted)]">Resultado do filtro</p>
          <p className="mt-2 text-3xl font-black">{filteredBoletos.length}</p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por cliente, CPF/CNPJ, nosso número, linha digitável, Pix..."
          className="min-w-0 rounded-md border border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] px-3 py-2 text-sm text-[color:var(--dash-fg)] outline-none focus:border-yellow-400/50"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as FaturamentoStatus | 'todos')}
          className="rounded-md border border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] px-3 py-2 text-sm font-semibold text-[color:var(--dash-fg)] outline-none"
        >
          <option value="todos">Todos</option>
          <option value="pago">Pagos</option>
          <option value="gerado">Em aberto</option>
          <option value="nao_pago">Não pagos</option>
        </select>
      </section>

      <section className="rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.2)]">
        <div className="grid gap-3 xl:hidden">
          {filteredBoletos.map((boleto) => (
            <article key={boleto.id} className="rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-surface-strong)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold">{boleto.clienteNome}</p>
                  <p className="mt-1 text-xs text-[color:var(--dash-muted)]">{boleto.clienteDocumento}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${statusClasses[boleto.status]}`}>
                  {statusLabels[boleto.status]}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[color:var(--dash-muted)]">Valor</p>
                  <p className="mt-1 font-black">{money(Number(boleto.valor ?? 0))}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[color:var(--dash-muted)]">Vencimento</p>
                  <p className="mt-1 font-semibold">{formatDateBR(boleto.data_vencimento)}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[color:var(--dash-muted)]">Pago?</p>
                  <p className={boleto.status === 'pago' ? 'mt-1 font-black text-emerald-300' : 'mt-1 font-black text-yellow-300'}>
                    {boleto.status === 'pago' ? 'Sim' : 'Não'}
                  </p>
                </div>
                <label className="space-y-1">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-[color:var(--dash-muted)]">Status</span>
                  <select
                    value={boleto.status}
                    disabled={busyId === boleto.id}
                    onChange={(event) => void updateBillingStatus(boleto, event.target.value as FaturamentoStatus)}
                    className="w-full rounded-md border border-[color:var(--dash-border)] bg-[color:var(--dash-bg)] px-2 py-2 text-sm text-[color:var(--dash-fg)]"
                  >
                    <option value="gerado">Em aberto</option>
                    <option value="pago">Pago</option>
                    <option value="nao_pago">Não pago</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <p className="break-all font-mono text-[color:var(--dash-muted)]">Linha: {boleto.linha_digitavel ?? '-'}</p>
                <p className="break-all font-mono text-[color:var(--dash-muted)]">Pix: {boleto.pix_url ?? boleto.pix_qr_code ?? '-'}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => openPdf(boleto)} className="rounded-md border border-[color:var(--dash-border)] px-3 py-2 text-xs font-bold">
                  Ver PDF
                </button>
                <button type="button" onClick={() => void downloadPdf(boleto)} disabled={busyId === boleto.id} className="rounded-md border border-cyan-400/30 px-3 py-2 text-xs font-bold text-cyan-200 disabled:opacity-50">
                  Baixar
                </button>
                <button type="button" onClick={() => void sendEmail(boleto)} disabled={busyId === boleto.id} className="rounded-md border border-[color:var(--dash-border)] px-3 py-2 text-xs font-bold disabled:opacity-50">
                  E-mail
                </button>
                <button type="button" onClick={() => void sendWhatsapp(boleto)} disabled={busyId === boleto.id} className="rounded-md border border-emerald-400/30 px-3 py-2 text-xs font-bold text-emerald-200 disabled:opacity-50">
                  WhatsApp
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto xl:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--dash-border)] text-left text-[color:var(--dash-muted)]">
                <th className="px-3 py-3">Cliente</th>
                <th className="px-3 py-3">Vencimento</th>
                <th className="px-3 py-3">Valor</th>
                <th className="px-3 py-3">Pago?</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Linha digitável / Pix</th>
                <th className="px-3 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredBoletos.map((boleto) => (
                <tr key={boleto.id} className="border-b border-[color:var(--dash-border)]">
                  <td className="px-3 py-4">
                    <p className="font-bold">{boleto.clienteNome}</p>
                    <p className="mt-1 text-xs text-[color:var(--dash-muted)]">{boleto.clienteDocumento}</p>
                    <p className="mt-1 text-xs text-[color:var(--dash-muted)]">{boleto.nosso_numero || boleto.id_itau || boleto.id}</p>
                  </td>
                  <td className="px-3 py-4 font-semibold">{formatDateBR(boleto.data_vencimento)}</td>
                  <td className="px-3 py-4 font-black">{money(Number(boleto.valor ?? 0))}</td>
                  <td className="px-3 py-4">
                    <span className={boleto.status === 'pago' ? 'font-black text-emerald-300' : 'font-black text-yellow-300'}>
                      {boleto.status === 'pago' ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <select
                      value={boleto.status}
                      disabled={busyId === boleto.id}
                      onChange={(event) => void updateBillingStatus(boleto, event.target.value as FaturamentoStatus)}
                      className="rounded-md border border-[color:var(--dash-border)] bg-[color:var(--dash-bg)] px-2 py-2 text-xs font-bold text-[color:var(--dash-fg)] outline-none disabled:opacity-50"
                    >
                      <option value="gerado">Em aberto</option>
                      <option value="pago">Pago</option>
                      <option value="nao_pago">Não pago</option>
                    </select>
                  </td>
                  <td className="max-w-[360px] px-3 py-4">
                    <p className="truncate font-mono text-xs text-[color:var(--dash-muted)]" title={boleto.linha_digitavel ?? undefined}>
                      {boleto.linha_digitavel ?? '-'}
                    </p>
                    <p className="mt-1 truncate font-mono text-xs text-[color:var(--dash-muted)]" title={boleto.pix_url ?? boleto.pix_qr_code ?? undefined}>
                      {boleto.pix_url ?? boleto.pix_qr_code ?? '-'}
                    </p>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => openPdf(boleto)} className="rounded-md border border-[color:var(--dash-border)] px-3 py-2 text-xs font-bold hover:border-yellow-400/50">
                        Ver PDF
                      </button>
                      <button type="button" onClick={() => void downloadPdf(boleto)} disabled={busyId === boleto.id} className="rounded-md border border-cyan-400/30 px-3 py-2 text-xs font-bold text-cyan-200 disabled:opacity-50">
                        Baixar
                      </button>
                      <button type="button" onClick={() => void sendEmail(boleto)} disabled={busyId === boleto.id} className="rounded-md border border-[color:var(--dash-border)] px-3 py-2 text-xs font-bold disabled:opacity-50">
                        E-mail
                      </button>
                      <button type="button" onClick={() => void sendWhatsapp(boleto)} disabled={busyId === boleto.id} className="rounded-md border border-emerald-400/30 px-3 py-2 text-xs font-bold text-emerald-200 disabled:opacity-50">
                        WhatsApp
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!filteredBoletos.length ? (
          <div className="py-12 text-center text-sm text-[color:var(--dash-muted)]">
            Nenhum boleto gerado encontrado para os filtros selecionados.
          </div>
        ) : null}
      </section>
    </div>
  );
}
