'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DashboardOverview } from '@/lib/dashboard/types';

interface NewClientForm {
  nome: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  endereco_completo: string;
  valor_mensal: string;
  dia_vencimento: string;
}

const initialForm: NewClientForm = {
  nome: '',
  cpf_cnpj: '',
  email: '',
  telefone: '',
  endereco_completo: '',
  valor_mensal: '',
  dia_vencimento: '10',
};

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function nextDueDate(day: number) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), day);
  if (date < now) {
    date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString().slice(0, 10);
}

export default function AdminDashboardClient() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativa' | 'inativa' | 'cancelada'>('todos');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<NewClientForm>(initialForm);
  const [billingValues, setBillingValues] = useState<Record<string, string>>({});
  const [dueDates, setDueDates] = useState<Record<string, string>>({});

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/overview', { cache: 'no-store' });
      const data = (await res.json()) as DashboardOverview;
      setOverview(data);

      const values: Record<string, string> = {};
      const vencimentos: Record<string, string> = {};
      data.clientes.forEach((cliente) => {
        if (cliente.assinatura) {
          values[cliente.id] = String(cliente.assinatura.valor_mensal ?? '');
          vencimentos[cliente.id] = nextDueDate(cliente.assinatura.dia_vencimento ?? 10);
        }
      });
      setBillingValues(values);
      setDueDates(vencimentos);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const filteredClients = useMemo(() => {
    if (!overview) {
      return [];
    }

    return overview.clientes.filter((cliente) => {
      const matchQuery =
        cliente.nome.toLowerCase().includes(query.toLowerCase()) ||
        cliente.cpf_cnpj.includes(query) ||
        cliente.email.toLowerCase().includes(query.toLowerCase());

      const matchStatus = statusFilter === 'todos' ? true : cliente.status_assinatura === statusFilter;

      return matchQuery && matchStatus;
    });
  }, [overview, query, statusFilter]);

  const createClient = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.nome.trim() || form.cpf_cnpj.replace(/\D/g, '').length < 11 || !emailRegex.test(form.email)) {
      alert('Preencha nome, CPF/CNPJ e e-mail válidos.');
      return;
    }

    const valorMensal = Number(form.valor_mensal);
    const diaVencimento = Number(form.dia_vencimento);
    if (valorMensal <= 0 || diaVencimento < 1 || diaVencimento > 31) {
      alert('Informe valor mensal e dia de vencimento válidos.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          valor_mensal: valorMensal,
          dia_vencimento: diaVencimento,
          status_assinatura: 'ativa',
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? 'Erro ao cadastrar cliente.');
      }

      setShowModal(false);
      setForm(initialForm);
      await loadOverview();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha no cadastro.');
    } finally {
      setSubmitting(false);
    }
  };

  const gerarFaturamento = async () => {
    if (!overview) {
      return;
    }

    const itens = overview.clientes
      .filter((c) => c.status_assinatura === 'ativa')
      .map((c) => ({
        clienteId: c.id,
        valor: Number(billingValues[c.id] ?? 0),
        dataVencimento: dueDates[c.id] ?? nextDueDate(c.assinatura?.dia_vencimento ?? 10),
      }))
      .filter((item) => item.valor > 0 && item.dataVencimento);

    if (!itens.length) {
      alert('Preencha os valores para gerar faturamento.');
      return;
    }

    const res = await fetch('/api/faturamento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens }),
    });

    const result = (await res.json()) as { sucesso?: number; total?: number; error?: string; falhas?: string[] };
    if (!res.ok) {
      alert(result.error ?? 'Erro ao gerar faturamento.');
      return;
    }

    const failText = result.falhas?.length ? ` Falhas: ${result.falhas.join('; ')}` : '';
    alert(`Faturamento concluído. ${result.sucesso}/${result.total} boletos gerados.${failText}`);
    await loadOverview();
  };

  if (loading || !overview) {
    return <div className="text-slate-300">Carregando dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard Principal</h1>
          <p className="text-slate-400">MRR, faturamento e saúde da usina em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowModal(true)} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/5">Novo Cliente</button>
          <button onClick={gerarFaturamento} className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-yellow-400">Gerar Faturamento do Mês</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"><p className="text-xs text-slate-400">MRR</p><p className="mt-1 text-2xl font-bold text-white">{money(overview.mrr)}</p></div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"><p className="text-xs text-slate-400">Clientes Ativos</p><p className="mt-1 text-2xl font-bold text-white">{overview.clientesAtivos}</p></div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"><p className="text-xs text-slate-400">Inadimplência</p><p className="mt-1 text-2xl font-bold text-white">{overview.inadimplenciaPercentual}%</p></div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"><p className="text-xs text-slate-400">Saúde da Usina</p><p className="mt-1 text-2xl font-bold text-emerald-400">{overview.saudeUsinaPercentual}%</p></div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"><p className="text-xs text-slate-400">Geração em Tempo Real</p><p className="mt-1 text-2xl font-bold text-cyan-300">{overview.geracaoTempoRealKw} kW</p></div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <h2 className="mb-4 text-lg font-semibold text-white">Faturamento Mensal</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overview.monthlyBilling}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="mes" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#020617', border: '1px solid #334155', borderRadius: '10px' }} formatter={(value) => money(Number(value ?? 0))} />
              <Bar dataKey="total" fill="#facc15" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <div className="mb-4 flex flex-wrap gap-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, CPF/CNPJ ou e-mail" className="min-w-[220px] flex-1 rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-500" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white"><option value="todos">Todos</option><option value="ativa">Ativa</option><option value="inativa">Inativa</option><option value="cancelada">Cancelada</option></select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="border-b border-white/10 text-left text-slate-400"><th className="px-2 py-3">Cliente</th><th className="px-2 py-3">Contato</th><th className="px-2 py-3">Status</th><th className="px-2 py-3">Valor Boleto (R$)</th><th className="px-2 py-3">Vencimento</th><th className="px-2 py-3">Último Boleto</th></tr></thead>
            <tbody>
              {filteredClients.map((cliente) => (
                <tr key={cliente.id} className="border-b border-white/5 text-slate-200">
                  <td className="px-2 py-3"><p className="font-semibold text-white">{cliente.nome}</p><p className="text-xs text-slate-400">{cliente.cpf_cnpj}</p></td>
                  <td className="px-2 py-3"><p>{cliente.email}</p><p className="text-xs text-slate-400">{cliente.telefone || '-'}</p></td>
                  <td className="px-2 py-3"><span className="rounded-full border border-white/15 px-2 py-1 text-xs uppercase tracking-wide">{cliente.status_assinatura}</span></td>
                  <td className="px-2 py-3"><input value={billingValues[cliente.id] ?? ''} onChange={(e) => setBillingValues((prev) => ({ ...prev, [cliente.id]: e.target.value }))} className="w-28 rounded-lg border border-white/15 bg-slate-950 px-2 py-1 text-white" /></td>
                  <td className="px-2 py-3"><input type="date" value={dueDates[cliente.id] ?? ''} onChange={(e) => setDueDates((prev) => ({ ...prev, [cliente.id]: e.target.value }))} className="rounded-lg border border-white/15 bg-slate-950 px-2 py-1 text-white" /></td>
                  <td className="px-2 py-3">{cliente.ultimoFaturamento?.boleto_url ? <a href={cliente.ultimoFaturamento.boleto_url} target="_blank" rel="noreferrer" className="text-yellow-400 underline">Baixar</a> : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950 p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">Cadastro de Cliente</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white" placeholder="Nome" value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} />
              <input className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white" placeholder="CPF/CNPJ" value={form.cpf_cnpj} onChange={(e) => setForm((p) => ({ ...p, cpf_cnpj: e.target.value }))} />
              <input className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white" placeholder="E-mail" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              <input className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white" placeholder="Telefone" value={form.telefone} onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))} />
              <input className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white md:col-span-2" placeholder="Endereço completo" value={form.endereco_completo} onChange={(e) => setForm((p) => ({ ...p, endereco_completo: e.target.value }))} />
              <input className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white" placeholder="Valor mensal" type="number" value={form.valor_mensal} onChange={(e) => setForm((p) => ({ ...p, valor_mensal: e.target.value }))} />
              <input className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white" placeholder="Dia vencimento" type="number" value={form.dia_vencimento} onChange={(e) => setForm((p) => ({ ...p, dia_vencimento: e.target.value }))} />
            </div>
            <div className="mt-6 flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="rounded-lg border border-white/15 px-4 py-2 text-white">Cancelar</button><button disabled={submitting} onClick={createClient} className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60">Salvar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
