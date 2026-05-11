'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ClienteStatus, DashboardOverview } from '@/lib/dashboard/types';

interface ClientForm {
  nome: string;
  cpf_cnpj: string;
  telefone: string;
  endereco_completo: string;
  status_assinatura: ClienteStatus;
}

const emptyForm: ClientForm = {
  nome: '',
  cpf_cnpj: '',
  telefone: '',
  endereco_completo: '',
  status_assinatura: 'ativa',
};

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function nextDueDate(day: number) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), day);
  if (date < now) date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

function formFromClient(cliente?: DashboardOverview['clientes'][number] | null): ClientForm {
  if (!cliente) return emptyForm;

  return {
    nome: cliente.nome ?? '',
    cpf_cnpj: cliente.cpf_cnpj ?? '',
    telefone: cliente.telefone ?? cliente.whatsapp ?? '',
    endereco_completo: cliente.endereco_completo ?? '',
    status_assinatura: cliente.status_assinatura,
  };
}

function StatCard({ label, value, accent = 'text-white' }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-black ${accent}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboardClient() {
  const router = useRouter();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | ClienteStatus>('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [confirmDeleteClientId, setConfirmDeleteClientId] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatingClientId, setGeneratingClientId] = useState<string | null>(null);
  const [emailingBillingId, setEmailingBillingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [billingValues, setBillingValues] = useState<Record<string, string>>({});
  const [dueDates, setDueDates] = useState<Record<string, string>>({});

  const loadOverview = useCallback(async () => {
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
        values[cliente.id] = valor ? String(valor) : '';
        vencimentos[cliente.id] = nextDueDate(vencimento || 10);
      });
      setBillingValues(values);
      setDueDates(vencimentos);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const logout = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      await fetch('/api/auth/logout', { method: 'POST' });
      await supabase.auth.signOut();
    } finally {
      router.push('/');
      router.refresh();
    }
  };

  const filteredClients = useMemo(() => {
    if (!overview) return [];
    const normalizedQuery = query.toLowerCase();

    return overview.clientes.filter((cliente) => {
      const email = cliente.email ?? '';
      const telefone = cliente.telefone ?? cliente.whatsapp ?? '';
      const endereco = cliente.endereco_completo ?? '';
      const matchQuery =
        cliente.nome.toLowerCase().includes(normalizedQuery) ||
        cliente.cpf_cnpj.includes(query) ||
        email.toLowerCase().includes(normalizedQuery) ||
        telefone.includes(query) ||
        endereco.toLowerCase().includes(normalizedQuery);
      const matchStatus = statusFilter === 'todos' ? true : cliente.status_assinatura === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [overview, query, statusFilter]);

  const saveClient = async () => {
    if (!form.nome.trim() || !form.cpf_cnpj.trim()) {
      alert('Preencha nome completo e CPF/CNPJ.');
      return;
    }

    if (editingClientId && !adminPassword) {
      alert('Informe a senha do administrador para salvar.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        valor_mensal: 0,
        dia_vencimento: 10,
      };
      const url = editingClientId ? `/api/clientes/${editingClientId}` : '/api/clientes';
      const method = editingClientId ? 'PATCH' : 'POST';
      const body = editingClientId ? { ...payload, adminPassword } : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(result.error ?? 'Erro ao salvar cliente.');

      setShowModal(false);
      setEditingClientId(null);
      setAdminPassword('');
      setForm(emptyForm);
      await loadOverview();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha no cadastro.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteClient = async () => {
    if (!confirmDeleteClientId) return;
    if (!adminPassword) {
      alert('Informe a senha do administrador.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/clientes/${confirmDeleteClientId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword }),
      });
      const result = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(result.error ?? 'Erro ao excluir cliente.');
      setConfirmDeleteClientId(null);
      setAdminPassword('');
      await loadOverview();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao excluir cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  const gerarBoletoCliente = async (clienteId: string) => {
    const valor = Number(billingValues[clienteId] ?? 0);
    const dataVencimento = dueDates[clienteId];
    if (valor <= 0 || !dataVencimento) return alert('Informe valor e vencimento para esse cliente.');

    setGeneratingClientId(clienteId);
    try {
      const res = await fetch('/api/boletos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId, valor, dataVencimento }),
      });
      const payload = (await res.json()) as { error?: string; faturamento?: { boleto_url?: string | null } };
      if (!res.ok) throw new Error(payload.error ?? 'Falha ao gerar boleto.');
      if (payload.faturamento?.boleto_url) window.open(payload.faturamento.boleto_url, '_blank', 'noopener,noreferrer');
      await loadOverview();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao gerar boleto.');
    } finally {
      setGeneratingClientId(null);
    }
  };

  const enviarEmailCliente = async (faturamentoId: string) => {
    setEmailingBillingId(faturamentoId);
    try {
      const res = await fetch('/api/boletos/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faturamentoId }),
      });
      const payload = (await res.json()) as { error?: string; emailResult?: { mocked?: boolean; reason?: string } };
      if (!res.ok) throw new Error(payload.error ?? 'Falha ao enviar e-mail.');
      alert(payload.emailResult?.mocked ? `E-mail em modo mock. ${payload.emailResult.reason ?? ''}` : 'E-mail enviado para o cliente com sucesso.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao enviar e-mail.');
    } finally {
      setEmailingBillingId(null);
    }
  };

  if (loading || !overview) return <div className="text-slate-300">Carregando dashboard...</div>;

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.15),_transparent_35%),linear-gradient(180deg,_rgba(2,6,23,0.96),_rgba(15,23,42,0.92))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.25)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-yellow-300/80">Painel administrativo</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">Dashboard Principal</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
              Cadastro simples de clientes, faturamento e operacao financeira em um unico painel.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setEditingClientId(null);
                setForm(emptyForm);
                setShowModal(true);
              }}
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Novo cliente
            </button>
            <button
              onClick={() => void logout()}
              className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
            >
              Sair
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="MRR" value={money(overview.mrr)} />
        <StatCard label="Clientes ativos" value={overview.clientesAtivos} />
        <StatCard label="Inadimplencia" value={`${overview.inadimplenciaPercentual}%`} />
        <StatCard label="Saude da usina" value={`${overview.saudeUsinaPercentual}%`} accent="text-emerald-400" />
        <StatCard label="Geracao em tempo real" value={`${overview.geracaoTempoRealKw} kW`} accent="text-cyan-300" />
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Faturamento mensal</h2>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Visao consolidada</p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overview.monthlyBilling}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="mes" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#020617', border: '1px solid #334155', borderRadius: '12px' }} formatter={(value) => money(Number(value ?? 0))} />
              <Bar dataKey="total" fill="#facc15" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, CPF/CNPJ, telefone ou endereco"
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
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-slate-400">
                <th className="px-2 py-3">Cliente</th>
                <th className="px-2 py-3">Contato</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-2 py-3">Valor boleto</th>
                <th className="px-2 py-3">Vencimento</th>
                <th className="px-2 py-3">Ultimo boleto</th>
                <th className="px-2 py-3">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((cliente) => (
                <tr key={cliente.id} className="border-b border-white/5 text-slate-200">
                  <td className="px-2 py-3">
                    <p className="font-semibold text-white">{cliente.nome}</p>
                    <p className="text-xs text-slate-400">{cliente.cpf_cnpj}</p>
                    <p className="text-xs text-slate-500">{cliente.endereco_completo || '-'}</p>
                  </td>
                  <td className="px-2 py-3">
                    <p>{cliente.telefone || cliente.whatsapp || '-'}</p>
                    <p className="text-xs text-slate-400">{cliente.email || 'Sem e-mail'}</p>
                  </td>
                  <td className="px-2 py-3">
                    <span className="rounded-full border border-white/15 px-2 py-1 text-xs uppercase tracking-wide text-white">
                      {cliente.status_assinatura}
                    </span>
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
                    {cliente.ultimoFaturamento?.boleto_url ? (
                      <a href={cliente.ultimoFaturamento.boleto_url} target="_blank" rel="noreferrer" className="text-yellow-400 underline">
                        Baixar
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => void gerarBoletoCliente(cliente.id)}
                        disabled={generatingClientId === cliente.id}
                        className="rounded-lg bg-yellow-500 px-3 py-1 text-xs font-semibold text-slate-950 disabled:opacity-60"
                      >
                        {generatingClientId === cliente.id ? 'Gerando...' : 'Gerar boleto'}
                      </button>
                      <button
                        onClick={() => {
                          if (cliente.ultimoFaturamento?.id) void enviarEmailCliente(cliente.ultimoFaturamento.id);
                        }}
                        disabled={!cliente.ultimoFaturamento?.id || emailingBillingId === cliente.ultimoFaturamento?.id}
                        className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {emailingBillingId === cliente.ultimoFaturamento?.id ? 'Enviando...' : 'Enviar e-mail'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingClientId(cliente.id);
                          setForm(formFromClient(cliente));
                          setShowModal(true);
                        }}
                        className="rounded-lg border border-cyan-400/30 px-3 py-1 text-xs font-semibold text-cyan-200"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDeleteClientId(cliente.id);
                          setAdminPassword('');
                        }}
                        className="rounded-lg border border-rose-400/30 px-3 py-1 text-xs font-semibold text-rose-200"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showModal ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[1.75rem] border border-white/10 bg-slate-950 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-white">{editingClientId ? 'Editar cliente' : 'Cadastro de cliente'}</h3>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Dados basicos</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white outline-none"
                placeholder="Nome completo"
                value={form.nome}
                onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
              />
              <input
                className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white outline-none"
                placeholder="CPF ou CNPJ"
                value={form.cpf_cnpj}
                onChange={(e) => setForm((prev) => ({ ...prev, cpf_cnpj: e.target.value }))}
              />
              <input
                className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white outline-none"
                placeholder="Telefone"
                value={form.telefone}
                onChange={(e) => setForm((prev) => ({ ...prev, telefone: e.target.value }))}
              />
              <select
                className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white outline-none"
                value={form.status_assinatura}
                onChange={(e) => setForm((prev) => ({ ...prev, status_assinatura: e.target.value as ClienteStatus }))}
              >
                <option value="ativa">Ativa</option>
                <option value="inativa">Inativa</option>
                <option value="cancelada">Cancelada</option>
              </select>
              <input
                className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white outline-none md:col-span-2"
                placeholder="Endereco"
                value={form.endereco_completo}
                onChange={(e) => setForm((prev) => ({ ...prev, endereco_completo: e.target.value }))}
              />
              {editingClientId ? (
                <input
                  type="password"
                  className="rounded-lg border border-yellow-500/30 bg-slate-900 px-3 py-2 text-white outline-none md:col-span-2"
                  placeholder="Senha do administrador para salvar"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingClientId(null);
                  setAdminPassword('');
                  setForm(emptyForm);
                }}
                className="rounded-lg border border-white/15 px-4 py-2 text-white"
              >
                Cancelar
              </button>
              <button disabled={submitting} onClick={saveClient} className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60">
                Salvar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmDeleteClientId ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-slate-950 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <h3 className="text-xl font-semibold text-white">Confirmar exclusao</h3>
            <p className="mt-2 text-sm text-slate-400">Digite a senha do administrador para excluir este cliente permanentemente.</p>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="mt-4 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white"
              placeholder="Senha do administrador"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setConfirmDeleteClientId(null);
                  setAdminPassword('');
                }}
                className="rounded-lg border border-white/15 px-4 py-2 text-white"
              >
                Cancelar
              </button>
              <button disabled={submitting} onClick={deleteClient} className="rounded-lg bg-rose-500 px-4 py-2 font-semibold text-white disabled:opacity-60">
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
