'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ClienteStatus, DashboardOverview, FaturamentoStatus } from '@/lib/dashboard/types';

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function parseMoneyInput(value: string) {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nextDueDate(day: number) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), day);
  if (date < now) date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

export default function AdminFaturasPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | ClienteStatus>('todos');
  const [billingValues, setBillingValues] = useState<Record<string, string>>({});
  const [dueDates, setDueDates] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [emailingBillingId, setEmailingBillingId] = useState<string | null>(null);
  const [whatsappingBillingId, setWhatsappingBillingId] = useState<string | null>(null);
  const [statusBillingId, setStatusBillingId] = useState<string | null>(null);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/overview', { cache: 'no-store' });
      const data = (await res.json()) as DashboardOverview;
      setOverview(data);

      const values: Record<string, string> = {};
      const vencimentos: Record<string, string> = {};
      data.clientes.forEach((cliente) => {
        const valor = cliente.assinatura?.valor_mensal ?? cliente.ultimoFaturamento?.valor ?? 0;
        const vencimento =
          cliente.assinatura?.dia_vencimento ??
          Number(cliente.ultimoFaturamento?.data_vencimento?.slice(8, 10) ?? 10);
        values[cliente.id] = String(valor || '');
        vencimentos[cliente.id] = nextDueDate(vencimento || 10);
      });
      setBillingValues(values);
      setDueDates(vencimentos);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const filteredClients = useMemo(() => {
    if (!overview) return [];
    const normalizedQuery = query.toLowerCase();
    return overview.clientes.filter((cliente) => {
      const matchQuery =
        cliente.nome.toLowerCase().includes(normalizedQuery) ||
        cliente.cpf_cnpj.includes(query) ||
        (cliente.email ?? '').toLowerCase().includes(normalizedQuery);
      const matchStatus = statusFilter === 'todos' ? true : cliente.status_assinatura === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [overview, query, statusFilter]);

  const generateBoleto = async (clienteId: string) => {
    const valor = parseMoneyInput(billingValues[clienteId] ?? '');
    const dataVencimento = dueDates[clienteId];

    if (valor <= 0 || !dataVencimento) {
      alert('Informe valor e vencimento para gerar o boleto.');
      return;
    }

    setBusyId(clienteId);
    try {
      const res = await fetch('/api/boletos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId, valor, dataVencimento }),
      });
      const payload = (await res.json()) as { error?: string; faturamento?: { boleto_url?: string | null } };
      if (!res.ok) throw new Error(payload.error ?? 'Falha ao gerar boleto.');

      if (payload.faturamento?.boleto_url) {
        window.open(payload.faturamento.boleto_url, '_blank', 'noopener,noreferrer');
      }

      await loadOverview();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao gerar boleto.');
    } finally {
      setBusyId(null);
    }
  };

  const buildPdfUrl = (clienteId: string, download = false) => {
    const valor = parseMoneyInput(billingValues[clienteId] ?? '');
    const dueDate = dueDates[clienteId];
    if (valor <= 0 || !dueDate) {
      alert('Informe valor e vencimento antes de gerar o PDF.');
      return null;
    }

    const params = new URLSearchParams({
      valor: String(valor),
      dueDate,
    });

    if (download) {
      params.set('download', '1');
    }

    return `/api/admin/clientes/${clienteId}/pdf?${params.toString()}`;
  };

  const openPdf = (clienteId: string, download = false) => {
    const url = buildPdfUrl(clienteId, download);
    if (!url) return;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const sendEmail = async (faturamentoId: string) => {
    setEmailingBillingId(faturamentoId);
    try {
      const res = await fetch('/api/boletos/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faturamentoId }),
      });
      const payload = (await res.json()) as { error?: string; emailResult?: { mocked?: boolean; reason?: string } };
      if (!res.ok) throw new Error(payload.error ?? 'Falha ao enviar e-mail.');
      alert(payload.emailResult?.mocked ? `E-mail em modo mock. ${payload.emailResult.reason ?? ''}` : 'E-mail enviado.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao enviar e-mail.');
    } finally {
      setEmailingBillingId(null);
    }
  };

  const sendWhatsapp = async (faturamentoId: string) => {
    setWhatsappingBillingId(faturamentoId);
    try {
      const res = await fetch('/api/boletos/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faturamentoId }),
      });
      const payload = (await res.json()) as { error?: string; whatsappResult?: { mocked?: boolean; reason?: string } };
      if (!res.ok) throw new Error(payload.error ?? 'Falha ao enviar WhatsApp.');
      alert(payload.whatsappResult?.mocked ? `WhatsApp em modo mock. ${payload.whatsappResult.reason ?? ''}` : 'WhatsApp enviado.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao enviar WhatsApp.');
    } finally {
      setWhatsappingBillingId(null);
    }
  };

  const updateBillingStatus = async (faturamentoId: string, status: FaturamentoStatus) => {
    setStatusBillingId(faturamentoId);
    try {
      const res = await fetch('/api/boletos/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faturamentoId, status }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? 'Falha ao atualizar status.');
      await loadOverview();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao atualizar status.');
    } finally {
      setStatusBillingId(null);
    }
  };

  if (loading || !overview) {
    return <div className="text-slate-300">Carregando boletos...</div>;
  }

  const totalPendente = overview.clientes.reduce(
    (sum, cliente) => sum + (cliente.ultimoFaturamento?.status === 'gerado' || cliente.ultimoFaturamento?.status === 'nao_pago' ? Number(cliente.ultimoFaturamento.valor ?? 0) : 0),
    0,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.16),_transparent_34%),linear-gradient(180deg,_rgba(2,6,23,0.95),_rgba(15,23,42,0.9))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-300/80">Boletos e Itau</p>
            <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">Emissao de boletos</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Gere boletos em modo mock ou Itau real conforme as variaveis da Vercel. O retorno salva linha digitavel,
              codigo de barras, Pix e identificadores do banco em faturamento.
            </p>
          </div>
          <button
            onClick={() => void loadOverview()}
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Recarregar
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">Clientes</p>
          <p className="mt-2 text-3xl font-black text-white">{overview.clientes.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">Ativos</p>
          <p className="mt-2 text-3xl font-black text-emerald-300">{overview.clientesAtivos}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">Pendente</p>
          <p className="mt-2 text-3xl font-black text-yellow-300">{money(totalPendente)}</p>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, CPF/CNPJ ou e-mail"
          className="min-w-[220px] flex-1 rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="todos">Todos</option>
          <option value="ativa">Ativa</option>
          <option value="inativa">Inativa</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-slate-400">
                <th className="px-2 py-3">Cliente</th>
                <th className="px-2 py-3">Valor</th>
                <th className="px-2 py-3">Vencimento</th>
                <th className="px-2 py-3">Ultimo boleto</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-2 py-3">Linha digitavel</th>
                <th className="px-2 py-3">Pix</th>
                <th className="px-2 py-3">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((cliente) => (
                <tr key={cliente.id} className="border-b border-white/5 text-slate-200">
                  <td className="px-2 py-3">
                    <p className="font-semibold text-white">{cliente.nome}</p>
                    <p className="text-xs text-slate-400">{cliente.cpf_cnpj}</p>
                    <p className="text-xs text-slate-500">{cliente.email ?? 'Sem e-mail'}</p>
                  </td>
                  <td className="px-2 py-3">
                    <input
                      value={billingValues[cliente.id] ?? ''}
                      onChange={(e) => setBillingValues((prev) => ({ ...prev, [cliente.id]: e.target.value }))}
                      className="w-28 rounded-lg border border-white/15 bg-slate-950 px-2 py-1 text-white"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <input
                      type="date"
                      value={dueDates[cliente.id] ?? ''}
                      onChange={(e) => setDueDates((prev) => ({ ...prev, [cliente.id]: e.target.value }))}
                      className="rounded-lg border border-white/15 bg-slate-950 px-2 py-1 text-white"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <p className="text-sm text-white">
                      {cliente.ultimoFaturamento ? money(Number(cliente.ultimoFaturamento.valor)) : '-'}
                    </p>
                    <p className="text-xs text-slate-500">{cliente.ultimoFaturamento?.nosso_numero ?? ''}</p>
                  </td>
                  <td className="px-2 py-3">
                    {cliente.ultimoFaturamento?.id ? (
                      <select
                        value={cliente.ultimoFaturamento.status}
                        disabled={statusBillingId === cliente.ultimoFaturamento.id}
                        onChange={(e) => void updateBillingStatus(cliente.ultimoFaturamento!.id, e.target.value as FaturamentoStatus)}
                        className="rounded-lg border border-white/15 bg-slate-950 px-2 py-1 text-xs text-white outline-none disabled:opacity-60"
                      >
                        <option value="gerado">Gerado</option>
                        <option value="pago">Pago</option>
                        <option value="nao_pago">Nao pago</option>
                      </select>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="max-w-xs truncate px-2 py-3 text-xs text-slate-300">
                    {cliente.ultimoFaturamento?.linha_digitavel ?? '-'}
                  </td>
                  <td className="max-w-[180px] truncate px-2 py-3 text-xs text-slate-300">
                    {cliente.ultimoFaturamento?.pix_url ?? cliente.ultimoFaturamento?.pix_qr_code ?? '-'}
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => void generateBoleto(cliente.id)}
                        disabled={busyId === cliente.id}
                        className="rounded-lg bg-yellow-500 px-3 py-1 text-xs font-semibold text-slate-950 disabled:opacity-60"
                      >
                        {busyId === cliente.id ? 'Gerando...' : 'Gerar boleto'}
                      </button>
                      <button
                        onClick={() => openPdf(cliente.id)}
                        className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white"
                      >
                        Visualizar PDF
                      </button>
                      <button
                        onClick={() => openPdf(cliente.id, true)}
                        className="rounded-lg border border-cyan-400/30 px-3 py-1 text-xs font-semibold text-cyan-200"
                      >
                        Baixar PDF
                      </button>
                      {cliente.ultimoFaturamento?.boleto_url ? (
                        <a
                          href={cliente.ultimoFaturamento.boleto_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white"
                        >
                          Abrir boleto
                        </a>
                      ) : null}
                      <button
                        onClick={() => {
                          if (cliente.ultimoFaturamento?.id) void sendEmail(cliente.ultimoFaturamento.id);
                        }}
                        disabled={!cliente.ultimoFaturamento?.id || emailingBillingId === cliente.ultimoFaturamento?.id}
                        className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {emailingBillingId === cliente.ultimoFaturamento?.id ? 'Enviando...' : 'E-mail'}
                      </button>
                      <button
                        onClick={() => {
                          if (cliente.ultimoFaturamento?.id) void sendWhatsapp(cliente.ultimoFaturamento.id);
                        }}
                        disabled={!cliente.ultimoFaturamento?.id || whatsappingBillingId === cliente.ultimoFaturamento?.id}
                        className="rounded-lg border border-emerald-400/30 px-3 py-1 text-xs font-semibold text-emerald-200 disabled:opacity-50"
                      >
                        {whatsappingBillingId === cliente.ultimoFaturamento?.id ? 'Enviando...' : 'WhatsApp'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
