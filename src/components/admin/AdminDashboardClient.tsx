'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DashboardOverview, ClienteStatus } from '@/lib/dashboard/types';

interface ClientForm {
  nome: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  whatsapp: string;
  endereco_completo: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  complemento: string;
  responsavel: string;
  cargo_responsavel: string;
  observacoes: string;
  status_assinatura: ClienteStatus;
  valor_mensal: string;
  dia_vencimento: string;
}

const emptyForm: ClientForm = {
  nome: '',
  cpf_cnpj: '',
  email: '',
  telefone: '',
  whatsapp: '',
  endereco_completo: '',
  rua: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  complemento: '',
  responsavel: '',
  cargo_responsavel: '',
  observacoes: '',
  status_assinatura: 'ativa',
  valor_mensal: '',
  dia_vencimento: '10',
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
    email: cliente.email ?? '',
    telefone: cliente.telefone ?? '',
    whatsapp: cliente.whatsapp ?? '',
    endereco_completo: cliente.endereco_completo ?? '',
    rua: cliente.rua ?? '',
    numero: cliente.numero ?? '',
    bairro: cliente.bairro ?? '',
    cidade: cliente.cidade ?? '',
    estado: cliente.estado ?? '',
    cep: cliente.cep ?? '',
    complemento: cliente.complemento ?? '',
    responsavel: cliente.responsavel ?? '',
    cargo_responsavel: cliente.cargo_responsavel ?? '',
    observacoes: cliente.observacoes ?? '',
    status_assinatura: cliente.status_assinatura,
    valor_mensal: String(cliente.assinatura?.valor_mensal ?? ''),
    dia_vencimento: String(cliente.assinatura?.dia_vencimento ?? 10),
  };
}

export default function AdminDashboardClient() {
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
  const [selectedMapClientId, setSelectedMapClientId] = useState('');
  const [form, setForm] = useState<ClientForm>(emptyForm);
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

  useEffect(() => { void loadOverview(); }, []);

  const filteredClients = useMemo(() => {
    if (!overview) return [];
    return overview.clientes.filter((cliente) => {
      const matchQuery = cliente.nome.toLowerCase().includes(query.toLowerCase()) || cliente.cpf_cnpj.includes(query) || cliente.email.toLowerCase().includes(query.toLowerCase());
      const matchStatus = statusFilter === 'todos' ? true : cliente.status_assinatura === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [overview, query, statusFilter]);

  const clientsWithAddress = useMemo(() => filteredClients.filter((c) => (c.endereco_completo ?? '').trim().length > 0), [filteredClients]);
  const selectedMapClient = clientsWithAddress.find((c) => c.id === selectedMapClientId) ?? clientsWithAddress[0] ?? null;

  const openCreate = () => {
    setEditingClientId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (cliente: DashboardOverview['clientes'][number]) => {
    setEditingClientId(cliente.id);
    setForm(formFromClient(cliente));
    setShowModal(true);
  };

  const saveClient = async () => {
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
      const payload = {
        ...form,
        valor_mensal: valorMensal,
        dia_vencimento: diaVencimento,
      };

      const url = editingClientId ? `/api/clientes/${editingClientId}` : '/api/clientes';
      const method = editingClientId ? 'PATCH' : 'POST';
      const body = editingClientId ? { ...payload, adminPassword } : { ...payload };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? 'Erro ao salvar cliente.');
      }

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
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? 'Erro ao excluir cliente.');
      }
      setConfirmDeleteClientId(null);
      setAdminPassword('');
      await loadOverview();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao excluir cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  const gerarFaturamento = async () => {
    if (!overview) return;
    const itens = overview.clientes.filter((c) => c.status_assinatura === 'ativa').map((c) => ({ clienteId: c.id, valor: Number(billingValues[c.id] ?? 0), dataVencimento: dueDates[c.id] ?? nextDueDate(c.assinatura?.dia_vencimento ?? 10) })).filter((item) => item.valor > 0 && item.dataVencimento);
    if (!itens.length) {
      alert('Preencha os valores para gerar faturamento.');
      return;
    }
    const res = await fetch('/api/faturamento', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itens }) });
    const result = (await res.json()) as { sucesso?: number; total?: number; error?: string; falhas?: string[] };
    if (!res.ok) {
      alert(result.error ?? 'Erro ao gerar faturamento.');
      return;
    }
    const failText = result.falhas?.length ? ` Falhas: ${result.falhas.join('; ')}` : '';
    alert(`Faturamento concluído. ${result.sucesso}/${result.total} boletos gerados.${failText}`);
    await loadOverview();
  };

  const gerarBoletoCliente = async (clienteId: string) => {
    const valor = Number(billingValues[clienteId] ?? 0);
    const dataVencimento = dueDates[clienteId];
    if (valor <= 0 || !dataVencimento) {
      alert('Informe valor e vencimento para esse cliente.');
      return;
    }
    setGeneratingClientId(clienteId);
    try {
      const res = await fetch('/api/boletos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clienteId, valor, dataVencimento }) });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? 'Falha ao gerar boleto.');
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
      const res = await fetch('/api/boletos/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ faturamentoId }) });
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard Principal</h1>
          <p className="text-slate-400">Cadastro, edição e operação financeira dos clientes.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openCreate} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/5">Novo Cliente</button>
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
        <h2 className="mb-4 text-lg font-semibold text-white">Mapa de Clientes</h2>
        {clientsWithAddress.length ? (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <select value={selectedMapClient?.id ?? ''} onChange={(e) => setSelectedMapClientId(e.target.value)} className="rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white">
                {clientsWithAddress.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
              </select>
              <p className="text-sm text-slate-400">{selectedMapClient?.endereco_completo}</p>
            </div>
            <div className="h-80 overflow-hidden rounded-xl border border-white/10">
              <iframe title="Mapa do cliente" src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedMapClient?.endereco_completo ?? '')}&output=embed`} className="h-full w-full" loading="lazy" />
            </div>
          </>
        ) : <p className="text-sm text-slate-400">Nenhum cliente com endereço completo para exibir no mapa.</p>}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <div className="mb-4 flex flex-wrap gap-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, CPF/CNPJ ou e-mail" className="min-w-[220px] flex-1 rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-500" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white"><option value="todos">Todos</option><option value="ativa">Ativa</option><option value="inativa">Inativa</option><option value="cancelada">Cancelada</option></select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-slate-400">
                <th className="px-2 py-3">Cliente</th><th className="px-2 py-3">Contato</th><th className="px-2 py-3">Status</th><th className="px-2 py-3">Valor Boleto (R$)</th><th className="px-2 py-3">Vencimento</th><th className="px-2 py-3">Último Boleto</th><th className="px-2 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((cliente) => (
                <tr key={cliente.id} className="border-b border-white/5 text-slate-200">
                  <td className="px-2 py-3"><p className="font-semibold text-white">{cliente.nome}</p><p className="text-xs text-slate-400">{cliente.cpf_cnpj}</p></td>
                  <td className="px-2 py-3"><p>{cliente.email}</p><p className="text-xs text-slate-400">{cliente.telefone || cliente.whatsapp || '-'}</p></td>
                  <td className="px-2 py-3"><span className="rounded-full border border-white/15 px-2 py-1 text-xs uppercase tracking-wide">{cliente.status_assinatura}</span></td>
                  <td className="px-2 py-3"><input value={billingValues[cliente.id] ?? ''} onChange={(e) => setBillingValues((prev) => ({ ...prev, [cliente.id]: e.target.value }))} className="w-28 rounded-lg border border-white/15 bg-slate-950 px-2 py-1 text-white" /></td>
                  <td className="px-2 py-3"><input type="date" value={dueDates[cliente.id] ?? ''} onChange={(e) => setDueDates((prev) => ({ ...prev, [cliente.id]: e.target.value }))} className="rounded-lg border border-white/15 bg-slate-950 px-2 py-1 text-white" /></td>
                  <td className="px-2 py-3">{cliente.ultimoFaturamento?.boleto_url ? <a href={cliente.ultimoFaturamento.boleto_url} target="_blank" rel="noreferrer" className="text-yellow-400 underline">Baixar</a> : '-'}</td>
                  <td className="px-2 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => void gerarBoletoCliente(cliente.id)} disabled={generatingClientId === cliente.id} className="rounded-lg bg-yellow-500 px-3 py-1 text-xs font-semibold text-slate-950 disabled:opacity-60">{generatingClientId === cliente.id ? 'Gerando...' : 'Gerar boleto'}</button>
                      <button onClick={() => void cliente.ultimoFaturamento?.id && enviarEmailCliente(cliente.ultimoFaturamento.id)} disabled={!cliente.ultimoFaturamento?.id || emailingBillingId === cliente.ultimoFaturamento?.id} className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">{emailingBillingId === cliente.ultimoFaturamento?.id ? 'Enviando...' : 'Enviar e-mail'}</button>
                      <button onClick={() => openEdit(cliente)} className="rounded-lg border border-cyan-400/30 px-3 py-1 text-xs font-semibold text-cyan-200">Editar</button>
                      <button onClick={() => { setConfirmDeleteClientId(cliente.id); setAdminPassword(''); }} className="rounded-lg border border-rose-400/30 px-3 py-1 text-xs font-semibold text-rose-200">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-slate-950 p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">{editingClientId ? 'Editar Cliente' : 'Cadastro de Cliente'}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {(['nome','cpf_cnpj','email','telefone','whatsapp','responsavel','cargo_responsavel','cep','cidade','estado','bairro','numero'] as const).map((field) => (
                <input key={field} className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white" placeholder={field} value={form[field]} onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))} />
              ))}
              <input className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white md:col-span-2" placeholder="Endereço completo" value={form.endereco_completo} onChange={(e) => setForm((p) => ({ ...p, endereco_completo: e.target.value }))} />
              <input className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white" placeholder="Complemento" value={form.complemento} onChange={(e) => setForm((p) => ({ ...p, complemento: e.target.value }))} />
              <select className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white" value={form.status_assinatura} onChange={(e) => setForm((p) => ({ ...p, status_assinatura: e.target.value as ClienteStatus }))}><option value="ativa">Ativa</option><option value="inativa">Inativa</option><option value="cancelada">Cancelada</option></select>
              <input className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white" placeholder="Valor mensal" type="number" value={form.valor_mensal} onChange={(e) => setForm((p) => ({ ...p, valor_mensal: e.target.value }))} />
              <input className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white" placeholder="Dia vencimento" type="number" value={form.dia_vencimento} onChange={(e) => setForm((p) => ({ ...p, dia_vencimento: e.target.value }))} />
              {editingClientId ? <input type="password" className="rounded-lg border border-yellow-500/30 bg-slate-900 px-3 py-2 text-white md:col-span-2" placeholder="Senha do administrador para salvar" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} /> : null}
              <textarea className="min-h-28 rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white md:col-span-2" placeholder="Observações" value={form.observacoes} onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))} />
            </div>
            <div className="mt-6 flex justify-end gap-2"><button onClick={() => { setShowModal(false); setEditingClientId(null); setAdminPassword(''); }} className="rounded-lg border border-white/15 px-4 py-2 text-white">Cancelar</button><button disabled={submitting} onClick={saveClient} className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60">Salvar</button></div>
          </div>
        </div>
      )}

      {confirmDeleteClientId && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-6">
            <h3 className="text-xl font-semibold text-white">Confirmar exclusão</h3>
            <p className="mt-2 text-sm text-slate-400">Digite a senha do administrador para excluir este cliente permanentemente.</p>
            <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="mt-4 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white" placeholder="Senha do administrador" />
            <div className="mt-6 flex justify-end gap-2"><button onClick={() => { setConfirmDeleteClientId(null); setAdminPassword(''); }} className="rounded-lg border border-white/15 px-4 py-2 text-white">Cancelar</button><button disabled={submitting} onClick={deleteClient} className="rounded-lg bg-rose-500 px-4 py-2 font-semibold text-white disabled:opacity-60">Excluir</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
