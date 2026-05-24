'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardOverview, Faturamento, FaturamentoStatus } from '@/lib/dashboard/types';

type BoletoRow = Faturamento & {
  clienteNome: string;
  clienteDocumento: string;
};

const statusLabels: Record<FaturamentoStatus, string> = {
  gerado: 'Em aberto',
  pago: 'Pago',
  nao_pago: 'Não pago',
};

const statusColors: Record<FaturamentoStatus, string> = {
  gerado: '#facc15',
  pago: '#22c55e',
  nao_pago: '#ef4444',
};

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const compactCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

function money(value: number) {
  return currency.format(value);
}

function formatDateBR(value: string | null | undefined) {
  if (!value) return '-';

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('pt-BR').format(date);
}

function monthLabel(key: string) {
  const date = new Date(`${key}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return key;

  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
}

function getClientBillings(cliente: DashboardOverview['clientes'][number]) {
  if (cliente.historicoFaturamentos?.length) return cliente.historicoFaturamentos;
  return cliente.ultimoFaturamento ? [cliente.ultimoFaturamento] : [];
}

function tooltipStyle() {
  return {
    background: 'var(--dash-surface-strong)',
    border: '1px solid var(--dash-border)',
    borderRadius: 8,
    color: 'var(--dash-fg)',
  };
}

function axisStyle() {
  return { fill: 'var(--dash-muted)', fontSize: 11, fontWeight: 700 };
}

export default function AdminPagamentosPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FaturamentoStatus | 'todos'>('todos');

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
        })),
      )
      .sort((a, b) => String(b.data_vencimento ?? '').localeCompare(String(a.data_vencimento ?? '')));
  }, [overview]);

  const filteredBoletos = useMemo(
    () => boletos.filter((boleto) => statusFilter === 'todos' || boleto.status === statusFilter),
    [boletos, statusFilter],
  );

  const totals = useMemo(() => {
    const paid = boletos.filter((boleto) => boleto.status === 'pago');
    const unpaid = boletos.filter((boleto) => boleto.status !== 'pago');

    return {
      totalValue: boletos.reduce((sum, boleto) => sum + Number(boleto.valor ?? 0), 0),
      paidValue: paid.reduce((sum, boleto) => sum + Number(boleto.valor ?? 0), 0),
      unpaidValue: unpaid.reduce((sum, boleto) => sum + Number(boleto.valor ?? 0), 0),
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      totalCount: boletos.length,
    };
  }, [boletos]);

  const statusChart = useMemo(
    () =>
      (['pago', 'gerado', 'nao_pago'] as FaturamentoStatus[]).map((status) => ({
        name: statusLabels[status],
        status,
        quantidade: boletos.filter((boleto) => boleto.status === status).length,
        valor: boletos.filter((boleto) => boleto.status === status).reduce((sum, boleto) => sum + Number(boleto.valor ?? 0), 0),
      })),
    [boletos],
  );

  const monthlyChart = useMemo(() => {
    const map = new Map<string, { mes: string; pago: number; naoPago: number; total: number }>();

    boletos.forEach((boleto) => {
      const key = String(boleto.data_vencimento ?? '').slice(0, 7) || 'sem-data';
      const current = map.get(key) ?? { mes: monthLabel(key), pago: 0, naoPago: 0, total: 0 };
      const value = Number(boleto.valor ?? 0);

      current.total += value;
      if (boleto.status === 'pago') {
        current.pago += value;
      } else {
        current.naoPago += value;
      }

      map.set(key, current);
    });

    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([, value]) => value);
  }, [boletos]);

  const pixChart = useMemo(() => {
    const withPix = boletos.filter((boleto) => boleto.pix_qr_code || boleto.pix_url);
    const withoutPix = boletos.filter((boleto) => !boleto.pix_qr_code && !boleto.pix_url);

    return [
      { name: 'Com Pix', value: withPix.length, valor: withPix.reduce((sum, boleto) => sum + Number(boleto.valor ?? 0), 0), color: '#38bdf8' },
      { name: 'Somente boleto', value: withoutPix.length, valor: withoutPix.reduce((sum, boleto) => sum + Number(boleto.valor ?? 0), 0), color: '#facc15' },
    ];
  }, [boletos]);

  if (loading || !overview) {
    return <div className="text-[color:var(--dash-muted)]">Carregando pagamentos...</div>;
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-300">Pagamentos</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[color:var(--dash-fg)] md:text-4xl">Recebíveis por boleto</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--dash-muted)]">
            Status financeiro calculado diretamente dos boletos gerados.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as FaturamentoStatus | 'todos')}
            className="h-10 rounded-md border border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] px-3 text-sm font-semibold text-[color:var(--dash-fg)] outline-none"
          >
            <option value="todos">Todos</option>
            <option value="pago">Pagos</option>
            <option value="gerado">Em aberto</option>
            <option value="nao_pago">Não pagos</option>
          </select>
          <button
            type="button"
            onClick={() => void loadOverview()}
            className="h-10 rounded-md border border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] px-4 text-sm font-bold text-[color:var(--dash-fg)] transition hover:border-yellow-400/50"
          >
            Recarregar
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--dash-muted)]">Total emitido</p>
          <p className="mt-2 text-3xl font-black">{money(totals.totalValue)}</p>
          <p className="mt-1 text-sm text-[color:var(--dash-muted)]">{totals.totalCount} boletos</p>
        </div>
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">Pago</p>
          <p className="mt-2 text-3xl font-black text-emerald-100">{money(totals.paidValue)}</p>
          <p className="mt-1 text-sm text-emerald-200/80">{totals.paidCount} boletos</p>
        </div>
        <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-yellow-200">Não pago</p>
          <p className="mt-2 text-3xl font-black text-yellow-100">{money(totals.unpaidValue)}</p>
          <p className="mt-1 text-sm text-yellow-200/80">{totals.unpaidCount} boletos</p>
        </div>
        <div className="rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--dash-muted)]">Filtro atual</p>
          <p className="mt-2 text-3xl font-black">{filteredBoletos.length}</p>
          <p className="mt-1 text-sm text-[color:var(--dash-muted)]">boletos exibidos</p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] p-5">
          <div className="mb-4">
            <h2 className="text-sm font-black uppercase tracking-[0.18em]">Pagos vs não pagos</h2>
            <p className="mt-1 text-sm text-[color:var(--dash-muted)]">Valores por vencimento dos boletos emitidos.</p>
          </div>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChart} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
                <CartesianGrid stroke="var(--dash-border)" vertical={false} />
                <XAxis dataKey="mes" tick={axisStyle()} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle()} axisLine={false} tickLine={false} tickFormatter={(value) => compactCurrency.format(Number(value)).replace('R$', 'R$ ')} />
                <Tooltip contentStyle={tooltipStyle()} formatter={(value, name) => [money(Number(value)), name === 'pago' ? 'Pago' : 'Não pago']} />
                <Legend wrapperStyle={{ color: 'var(--dash-muted)', fontSize: 12, fontWeight: 700 }} />
                <Bar dataKey="pago" stackId="pagamentos" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="naoPago" stackId="pagamentos" fill="#facc15" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] p-5">
          <div className="mb-4">
            <h2 className="text-sm font-black uppercase tracking-[0.18em]">Status dos boletos</h2>
            <p className="mt-1 text-sm text-[color:var(--dash-muted)]">Quantidade por status financeiro.</p>
          </div>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusChart} dataKey="quantidade" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4}>
                  {statusChart.map((entry) => (
                    <Cell key={entry.status} fill={statusColors[entry.status]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle()} formatter={(value, name, item) => [`${value} boletos`, item.payload.name]} />
                <Legend iconType="circle" wrapperStyle={{ color: 'var(--dash-muted)', fontSize: 12, fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] p-5">
          <div className="mb-4">
            <h2 className="text-sm font-black uppercase tracking-[0.18em]">Pix nos boletos</h2>
            <p className="mt-1 text-sm text-[color:var(--dash-muted)]">Boletos com payload Pix disponível.</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pixChart} dataKey="value" nameKey="name" outerRadius={96} paddingAngle={5}>
                  {pixChart.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle()} formatter={(value, name, item) => [`${value} boletos - ${money(item.payload.valor)}`, item.payload.name]} />
                <Legend iconType="circle" wrapperStyle={{ color: 'var(--dash-muted)', fontSize: 12, fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] p-5">
          <div className="mb-4">
            <h2 className="text-sm font-black uppercase tracking-[0.18em]">Boletos do filtro</h2>
            <p className="mt-1 text-sm text-[color:var(--dash-muted)]">Mesma base usada nos gráficos acima.</p>
          </div>
          <div className="max-h-[360px] overflow-auto rounded-lg border border-[color:var(--dash-border)]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--dash-border)] text-left text-[color:var(--dash-muted)]">
                  <th className="px-3 py-3">Cliente</th>
                  <th className="px-3 py-3">Vencimento</th>
                  <th className="px-3 py-3">Valor</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBoletos.map((boleto) => (
                  <tr key={boleto.id} className="border-b border-[color:var(--dash-border)]">
                    <td className="px-3 py-3">
                      <p className="font-bold">{boleto.clienteNome}</p>
                      <p className="mt-1 text-xs text-[color:var(--dash-muted)]">{boleto.clienteDocumento}</p>
                    </td>
                    <td className="px-3 py-3">{formatDateBR(boleto.data_vencimento)}</td>
                    <td className="px-3 py-3 font-black">{money(Number(boleto.valor ?? 0))}</td>
                    <td className="px-3 py-3">
                      <span
                        className="rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em]"
                        style={{ borderColor: statusColors[boleto.status], color: statusColors[boleto.status] }}
                      >
                        {statusLabels[boleto.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
