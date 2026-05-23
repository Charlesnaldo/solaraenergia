'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DashboardOverview, ClienteStatus } from '@/lib/dashboard/types';

type GeneratedBilling = NonNullable<DashboardOverview['clientes'][number]['ultimoFaturamento']>;

function nextDueDate(day: number) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), day);
  if (date < now) date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

function parseMoneyInput(value: string) {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function AdminClientesPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | ClienteStatus>('todos');
  const [billingValues, setBillingValues] = useState<Record<string, string>>({});
  const [dueDates, setDueDates] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletingBillingId, setDeletingBillingId] = useState<string | null>(null);

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
        const vencimento = cliente.assinatura?.dia_vencimento ?? Number(cliente.ultimoFaturamento?.data_vencimento?.slice(8, 10) ?? 10);
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

  const buildPdfUrl = (clienteId: string, faturamento?: GeneratedBilling | null) => {
    if (!faturamento?.id) {
      alert('Gere um boleto antes de visualizar ou baixar o PDF.');
      return null;
    }

    return `/api/clientes/${clienteId}/faturamentos/${faturamento.id}/pdf`;
  };

  const openPdf = (clienteId: string, faturamento?: GeneratedBilling | null) => {
    const url = buildPdfUrl(clienteId, faturamento);
    if (!url) return;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadPdf = async (clienteId: string, faturamento?: GeneratedBilling | null) => {
    const url = buildPdfUrl(clienteId, faturamento);
    if (!url || !faturamento) return;

    const res = await fetch(url);
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      alert(payload?.error ?? 'Falha ao baixar boleto.');
      return;
    }

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `boleto-${clienteId}-${faturamento.data_vencimento}.pdf`;
    link.click();
    URL.revokeObjectURL(objectUrl);
  };

  const generateOfficialBoleto = async (clienteId: string) => {
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
      const payload = (await res.json()) as { error?: string; faturamento?: { boleto_url?: string | null }; admin_pdf_url?: string | null };
      if (!res.ok) throw new Error(payload.error ?? 'Falha ao gerar boleto.');

      const boletoUrl = payload.faturamento?.boleto_url ?? payload.admin_pdf_url;
      if (boletoUrl) {
        window.open(boletoUrl, '_blank', 'noopener,noreferrer');
      }
      await loadOverview();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao gerar boleto.');
    } finally {
      setBusyId(null);
    }
  };

  const sendPdfEmail = async (clienteId: string, faturamento?: GeneratedBilling | null) => {
    if (!faturamento?.id) {
      alert('Gere um boleto antes de enviar o PDF por e-mail.');
      return;
    }

    setBusyId(clienteId);
    try {
      const res = await fetch('/api/admin/clientes/email-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faturamentoId: faturamento.id }),
      });
      const payload = (await res.json()) as { error?: string; emailResult?: { mocked?: boolean; reason?: string } };
      if (!res.ok) throw new Error(payload.error ?? 'Falha ao enviar e-mail.');
      alert(payload.emailResult?.mocked ? `E-mail em modo mock. ${payload.emailResult.reason ?? ''}` : 'E-mail enviado com PDF em anexo.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao enviar e-mail.');
    } finally {
      setBusyId(null);
    }
  };

  const deleteBoleto = async (faturamentoId: string) => {
    const adminPassword = window.prompt('Digite a senha do administrador para excluir este boleto.');
    if (!adminPassword) return;

    const confirmed = window.confirm('Excluir este boleto do painel? Esta acao nao cancela automaticamente a cobranca no Itau.');
    if (!confirmed) return;

    setDeletingBillingId(faturamentoId);
    try {
      const res = await fetch('/api/boletos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faturamentoId, adminPassword }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? 'Falha ao excluir boleto.');
      await loadOverview();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao excluir boleto.');
    } finally {
      setDeletingBillingId(null);
    }
  };

  if (loading || !overview) {
    return <div className="text-slate-300">Carregando clientes...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.25)] sm:p-6 md:rounded-[2rem]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-300/80">Clientes</p>
            <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">Gestao de clientes</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Edite o valor do PDF por cliente, gere o documento para download e envie o boleto por e-mail com o PDF anexado.
            </p>
          </div>
          <button onClick={() => void loadOverview()} className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 sm:w-fit">
            Recarregar dados
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, CPF/CNPJ ou e-mail"
          className="min-w-0 rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="todos">Todos</option>
          <option value="ativa">Ativa</option>
          <option value="inativa">Inativa</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.2)] md:rounded-[1.75rem] md:p-5">
        <div className="space-y-3 md:hidden">
          {filteredClients.map((cliente) => (
            <article key={cliente.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{cliente.nome}</p>
                  <p className="text-xs text-slate-400">{cliente.cpf_cnpj}</p>
                  <p className="truncate text-xs text-slate-500">{cliente.email ?? 'Sem e-mail'}</p>
                </div>
                <span className="shrink-0 rounded-full border border-white/15 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-200">{cliente.status_assinatura}</span>
              </div>

              <p className="mt-3 text-sm text-slate-300">{cliente.telefone || cliente.whatsapp || '-'}</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Valor PDF</span>
                  <input
                    value={billingValues[cliente.id] ?? ''}
                    onChange={(e) => setBillingValues((prev) => ({ ...prev, [cliente.id]: e.target.value }))}
                    className="w-full rounded-lg border border-white/15 bg-slate-950 px-2 py-2 text-sm text-white"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Vencimento</span>
                  <input
                    type="date"
                    value={dueDates[cliente.id] ?? ''}
                    onChange={(e) => setDueDates((prev) => ({ ...prev, [cliente.id]: e.target.value }))}
                    className="w-full rounded-lg border border-white/15 bg-slate-950 px-2 py-2 text-sm text-white"
                  />
                </label>
              </div>

              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ultimo boleto</p>
                {cliente.ultimoFaturamento?.boleto_url ? (
                  <a href={cliente.ultimoFaturamento.boleto_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-yellow-400 underline">
                    Abrir boleto
                  </a>
                ) : cliente.ultimoFaturamento?.id ? (
                  <p className="mt-1 text-sm text-slate-300">Boleto gerado</p>
                ) : (
                  <p className="mt-1 text-sm text-slate-300">-</p>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => openPdf(cliente.id, cliente.ultimoFaturamento)} className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white">
                  Ver boleto
                </button>
                <button onClick={() => void downloadPdf(cliente.id, cliente.ultimoFaturamento)} className="rounded-lg border border-cyan-400/30 px-3 py-2 text-xs font-semibold text-cyan-200">
                  Baixar boleto
                </button>
                {cliente.ultimoFaturamento?.boleto_url ? (
                  <a
                    href={cliente.ultimoFaturamento.boleto_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-white/20 px-3 py-2 text-center text-xs font-semibold text-white"
                  >
                    Abrir boleto
                  </a>
                ) : null}
                <button
                  onClick={() => void generateOfficialBoleto(cliente.id)}
                  disabled={busyId === cliente.id}
                  className="rounded-lg bg-yellow-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60"
                >
                  {busyId === cliente.id ? 'Processando...' : 'Gerar boleto'}
                </button>
                <button
                  onClick={() => void sendPdfEmail(cliente.id, cliente.ultimoFaturamento)}
                  disabled={busyId === cliente.id}
                  className="col-span-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {busyId === cliente.id ? 'Enviando...' : 'Enviar e-mail com PDF'}
                </button>
                <button
                  onClick={() => {
                    if (cliente.ultimoFaturamento?.id) void deleteBoleto(cliente.ultimoFaturamento.id);
                  }}
                  disabled={!cliente.ultimoFaturamento?.id || deletingBillingId === cliente.ultimoFaturamento?.id}
                  className="col-span-2 rounded-lg border border-rose-400/30 px-3 py-2 text-xs font-semibold text-rose-200 disabled:opacity-50"
                >
                  {deletingBillingId === cliente.ultimoFaturamento?.id ? 'Excluindo...' : 'Excluir boleto'}
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-slate-400">
                <th className="px-2 py-3">Cliente</th>
                <th className="px-2 py-3">Contato</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-2 py-3">Valor do PDF</th>
                <th className="px-2 py-3">Vencimento</th>
                <th className="px-2 py-3">Último boleto</th>
                <th className="px-2 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((cliente) => (
                <tr key={cliente.id} className="border-b border-white/5 text-slate-200">
                  <td className="px-2 py-3">
                    <p className="font-semibold text-white">{cliente.nome}</p>
                    <p className="text-xs text-slate-400">{cliente.cpf_cnpj}</p>
                  </td>
                  <td className="px-2 py-3">
                    <p>{cliente.email ?? 'Sem e-mail'}</p>
                    <p className="text-xs text-slate-400">{cliente.telefone || cliente.whatsapp || '-'}</p>
                  </td>
                  <td className="px-2 py-3">
                    <span className="rounded-full border border-white/15 px-2 py-1 text-xs uppercase tracking-wide text-white">{cliente.status_assinatura}</span>
                  </td>
                  <td className="px-2 py-3">
                    <input
                      value={billingValues[cliente.id] ?? ''}
                      onChange={(e) => setBillingValues((prev) => ({ ...prev, [cliente.id]: e.target.value }))}
                      className="w-32 rounded-lg border border-white/15 bg-slate-950 px-2 py-1 text-white"
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
                    {cliente.ultimoFaturamento?.boleto_url ? (
                      <a href={cliente.ultimoFaturamento.boleto_url} target="_blank" rel="noreferrer" className="text-yellow-400 underline">
                        Abrir boleto
                      </a>
                    ) : cliente.ultimoFaturamento?.id ? (
                      <span className="text-slate-300">Boleto gerado</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => openPdf(cliente.id, cliente.ultimoFaturamento)} className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white">
                        Ver boleto
                      </button>
                      <button onClick={() => void downloadPdf(cliente.id, cliente.ultimoFaturamento)} className="rounded-lg border border-cyan-400/30 px-3 py-1 text-xs font-semibold text-cyan-200">
                        Baixar boleto
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
                      <button onClick={() => void generateOfficialBoleto(cliente.id)} disabled={busyId === cliente.id} className="rounded-lg bg-yellow-500 px-3 py-1 text-xs font-semibold text-slate-950 disabled:opacity-60">
                        {busyId === cliente.id ? 'Processando...' : 'Gerar boleto'}
                      </button>
                      <button onClick={() => void sendPdfEmail(cliente.id, cliente.ultimoFaturamento)} disabled={busyId === cliente.id} className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">
                        {busyId === cliente.id ? 'Enviando...' : 'Enviar e-mail com PDF'}
                      </button>
                      <button
                        onClick={() => {
                          if (cliente.ultimoFaturamento?.id) void deleteBoleto(cliente.ultimoFaturamento.id);
                        }}
                        disabled={!cliente.ultimoFaturamento?.id || deletingBillingId === cliente.ultimoFaturamento?.id}
                        className="rounded-lg border border-rose-400/30 px-3 py-1 text-xs font-semibold text-rose-200 disabled:opacity-50"
                      >
                        {deletingBillingId === cliente.ultimoFaturamento?.id ? 'Excluindo...' : 'Excluir boleto'}
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
