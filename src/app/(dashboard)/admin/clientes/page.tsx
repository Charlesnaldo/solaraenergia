'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DashboardOverview, ClienteStatus } from '@/lib/dashboard/types';

function nextDueDate(day: number) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), day);
  if (date < now) date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

export default function AdminClientesPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | ClienteStatus>('todos');
  const [billingValues, setBillingValues] = useState<Record<string, string>>({});
  const [dueDates, setDueDates] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const buildPdfUrl = (clienteId: string, download = false) => {
    const valor = Number(billingValues[clienteId] ?? 0);
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

  const generateOfficialBoleto = async (clienteId: string) => {
    const valor = Number(billingValues[clienteId] ?? 0);
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

      const boletoUrl = payload.faturamento?.boleto_url;
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

  const sendPdfEmail = async (clienteId: string) => {
    const valor = Number(billingValues[clienteId] ?? 0);
    const dueDate = dueDates[clienteId];
    if (valor <= 0 || !dueDate) {
      alert('Informe valor e vencimento antes de enviar o PDF.');
      return;
    }

    setBusyId(clienteId);
    try {
      const res = await fetch('/api/admin/clientes/email-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId, valor, dueDate }),
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

  if (loading || !overview) {
    return <div className="text-slate-300">Carregando clientes...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-300/80">Clientes</p>
            <h1 className="mt-2 text-3xl font-black text-white">Gestão de clientes</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Edite o valor do PDF por cliente, gere o documento para download e envie o boleto por e-mail com o PDF anexado.
            </p>
          </div>
          <button onClick={() => void loadOverview()} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10">
            Recarregar dados
          </button>
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
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => openPdf(cliente.id)} className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white">
                        Visualizar PDF
                      </button>
                      <button onClick={() => openPdf(cliente.id, true)} className="rounded-lg border border-cyan-400/30 px-3 py-1 text-xs font-semibold text-cyan-200">
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
                      <button onClick={() => void generateOfficialBoleto(cliente.id)} disabled={busyId === cliente.id} className="rounded-lg bg-yellow-500 px-3 py-1 text-xs font-semibold text-slate-950 disabled:opacity-60">
                        {busyId === cliente.id ? 'Processando...' : 'Gerar boleto'}
                      </button>
                      <button onClick={() => void sendPdfEmail(cliente.id)} disabled={busyId === cliente.id} className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">
                        {busyId === cliente.id ? 'Enviando...' : 'Enviar e-mail com PDF'}
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
