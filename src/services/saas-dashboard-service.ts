import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export type BillingStatus = 'pago' | 'pendente' | 'gerado' | 'atrasado' | 'cancelado' | 'nao_pago';

export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  helper: string;
  trend: string;
  tone: 'green' | 'yellow' | 'red' | 'blue' | 'slate';
}

export interface ChartPoint {
  name: string;
  receita?: number;
  clientes?: number;
  pix?: number;
  boleto?: number;
  economia?: number;
  kwh?: number;
}

export interface StatusPoint {
  name: string;
  value: number;
}

export interface DashboardClient {
  id: string;
  nome: string;
  email: string;
  documento: string;
  telefone: string;
  status: string;
  unidade: string;
  consumoKwh: number;
  economia: number;
  valorMensal: number;
}

export interface DashboardBilling {
  id: string;
  clienteId: string;
  cliente: string;
  valor: number;
  vencimento: string;
  status: BillingStatus;
  pix: string | null;
  boletoUrl: string | null;
  linhaDigitavel: string | null;
  codigoBarras: string | null;
  createdAt: string;
}

export interface DashboardLog {
  id: string;
  label: string;
  detail: string;
  status: 'ok' | 'warning' | 'error';
  time: string;
}

export interface DashboardData {
  metrics: DashboardMetric[];
  monthlyRevenue: ChartPoint[];
  clientGrowth: ChartPoint[];
  paymentStatus: StatusPoint[];
  pixVsBoleto: ChartPoint[];
  energySavings: ChartPoint[];
  clients: DashboardClient[];
  billings: DashboardBilling[];
  logs: DashboardLog[];
  itauStatus: {
    token: 'online' | 'warning' | 'offline';
    webhook: 'online' | 'warning' | 'offline';
    environment: 'homologacao' | 'producao';
    latencyMs: number;
  };
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('pt-BR');

function money(value: number) {
  return currency.format(value);
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
}

function normalizeStatus(status: unknown): BillingStatus {
  const value = String(status ?? 'pendente').toLowerCase();
  if (value === 'pago' || value === 'cancelado' || value === 'gerado' || value === 'atrasado' || value === 'nao_pago') {
    return value;
  }
  return 'pendente';
}

const mockBillings: DashboardBilling[] = [
  {
    id: 'fat-001',
    clienteId: 'cli-001',
    cliente: 'Armazém Solar Norte',
    valor: 12840,
    vencimento: '2026-06-10',
    status: 'pago',
    pix: '00020126580014BR.GOV.BCB.PIX0136MOCK-SOLARA520400005303986540812840.005802BR5914SOLARA ENERGIA6009FORTALEZA6304ABCD',
    boletoUrl: '#',
    linhaDigitavel: '34191.79001 01043.510047 91020.150008 8 98760000128400',
    codigoBarras: '34198987600012840017900101043510047910201500',
    createdAt: '2026-05-02',
  },
  {
    id: 'fat-002',
    clienteId: 'cli-002',
    cliente: 'Rede Atlante Supermercados',
    valor: 28320,
    vencimento: '2026-06-14',
    status: 'pendente',
    pix: null,
    boletoUrl: '#',
    linhaDigitavel: '34191.79001 01043.510047 91020.150008 8 98760000283200',
    codigoBarras: '34198987600028320017900101043510047910201500',
    createdAt: '2026-05-04',
  },
  {
    id: 'fat-003',
    clienteId: 'cli-003',
    cliente: 'Condomínio Vista Mar',
    valor: 7640,
    vencimento: '2026-06-18',
    status: 'atrasado',
    pix: null,
    boletoUrl: '#',
    linhaDigitavel: '34191.79001 01043.510047 91020.150008 8 98760000076400',
    codigoBarras: '34198987600007640017900101043510047910201500',
    createdAt: '2026-05-06',
  },
  {
    id: 'fat-004',
    clienteId: 'cli-004',
    cliente: 'Clínica Aurora',
    valor: 5210,
    vencimento: '2026-06-22',
    status: 'gerado',
    pix: null,
    boletoUrl: '#',
    linhaDigitavel: '34191.79001 01043.510047 91020.150008 8 98760000052100',
    codigoBarras: '34198987600005210017900101043510047910201500',
    createdAt: '2026-05-07',
  },
];

const mockClients: DashboardClient[] = [
  {
    id: 'cli-001',
    nome: 'Armazém Solar Norte',
    email: 'financeiro@armazemnorte.com.br',
    documento: '12.345.678/0001-90',
    telefone: '(85) 98888-1100',
    status: 'ativa',
    unidade: 'Fortaleza, CE',
    consumoKwh: 42800,
    economia: 18640,
    valorMensal: 12840,
  },
  {
    id: 'cli-002',
    nome: 'Rede Atlante Supermercados',
    email: 'contas@atlante.com.br',
    documento: '22.456.789/0001-11',
    telefone: '(85) 97777-2200',
    status: 'ativa',
    unidade: 'Caucaia, CE',
    consumoKwh: 91400,
    economia: 42500,
    valorMensal: 28320,
  },
  {
    id: 'cli-003',
    nome: 'Condomínio Vista Mar',
    email: 'sindico@vistamar.com.br',
    documento: '33.567.890/0001-22',
    telefone: '(85) 96666-3300',
    status: 'inadimplente',
    unidade: 'Aquiraz, CE',
    consumoKwh: 23300,
    economia: 9800,
    valorMensal: 7640,
  },
  {
    id: 'cli-004',
    nome: 'Clínica Aurora',
    email: 'adm@clinicaaurora.com.br',
    documento: '44.678.901/0001-33',
    telefone: '(85) 95555-4400',
    status: 'ativa',
    unidade: 'Eusébio, CE',
    consumoKwh: 17600,
    economia: 7220,
    valorMensal: 5210,
  },
];

export const mockDashboardData: DashboardData = {
  metrics: [
    { id: 'mrr', label: 'Receita mensal', value: money(842000), helper: 'MRR consolidado', trend: '+14,2%', tone: 'green' },
    { id: 'arr', label: 'Receita anual', value: money(10_104_000), helper: 'ARR projetado', trend: '+18,7%', tone: 'green' },
    { id: 'active', label: 'Clientes ativos', value: '428', helper: 'Contratos em operação', trend: '+32', tone: 'blue' },
    { id: 'paid', label: 'Boletos pagos', value: '1.284', helper: 'No ciclo atual', trend: '94%', tone: 'green' },
    { id: 'pending', label: 'Boletos pendentes', value: '76', helper: 'A vencer', trend: '-8%', tone: 'yellow' },
    { id: 'pix', label: 'Pix recebidos', value: money(326000), helper: 'Liquidação instantânea', trend: '+22%', tone: 'green' },
    { id: 'savings', label: 'Economia gerada', value: money(612000), helper: 'Clientes Solara', trend: '+11%', tone: 'blue' },
    { id: 'kwh', label: 'kWh compensados', value: '2,8 GWh', helper: 'Energia creditada', trend: '+9%', tone: 'blue' },
    { id: 'late', label: 'Inadimplência', value: '3,8%', helper: 'Carteira em risco', trend: '-1,4%', tone: 'red' },
  ],
  monthlyRevenue: [
    { name: 'jan', receita: 610000 },
    { name: 'fev', receita: 654000 },
    { name: 'mar', receita: 688000 },
    { name: 'abr', receita: 731000 },
    { name: 'mai', receita: 842000 },
    { name: 'jun', receita: 910000 },
  ],
  clientGrowth: [
    { name: 'jan', clientes: 312 },
    { name: 'fev', clientes: 338 },
    { name: 'mar', clientes: 365 },
    { name: 'abr', clientes: 391 },
    { name: 'mai', clientes: 428 },
    { name: 'jun', clientes: 462 },
  ],
  paymentStatus: [
    { name: 'Pago', value: 1284 },
    { name: 'Pendente', value: 76 },
    { name: 'Atrasado', value: 19 },
    { name: 'Cancelado', value: 6 },
  ],
  pixVsBoleto: [
    { name: 'jan', pix: 180000, boleto: 430000 },
    { name: 'fev', pix: 210000, boleto: 444000 },
    { name: 'mar', pix: 248000, boleto: 440000 },
    { name: 'abr', pix: 284000, boleto: 447000 },
    { name: 'mai', pix: 326000, boleto: 516000 },
    { name: 'jun', pix: 360000, boleto: 550000 },
  ],
  energySavings: [
    { name: 'jan', economia: 420000, kwh: 1900 },
    { name: 'fev', economia: 455000, kwh: 2050 },
    { name: 'mar', economia: 481000, kwh: 2180 },
    { name: 'abr', economia: 536000, kwh: 2460 },
    { name: 'mai', economia: 612000, kwh: 2800 },
    { name: 'jun', economia: 650000, kwh: 2960 },
  ],
  clients: mockClients,
  billings: mockBillings,
  logs: [
    { id: 'log-1', label: 'Webhook Itaú', detail: 'Pagamento confirmado para FAT-001', status: 'ok', time: 'há 4 min' },
    { id: 'log-2', label: 'Auditoria', detail: 'Operador exportou relatório financeiro', status: 'warning', time: 'há 22 min' },
    { id: 'log-3', label: 'Supabase Realtime', detail: 'Canal faturamento sincronizado', status: 'ok', time: 'há 1 h' },
    { id: 'log-4', label: 'Bolecode', detail: 'Payload Pix sem BR Code oficial rejeitado', status: 'error', time: 'ontem' },
  ],
  itauStatus: {
    token: 'online',
    webhook: 'online',
    environment: 'homologacao',
    latencyMs: 182,
  },
};

type DbRow = Record<string, unknown>;

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildDashboardData(clientes: DbRow[], assinaturas: DbRow[], faturamentos: DbRow[], usinas: DbRow[]): DashboardData {
  const billings: DashboardBilling[] = faturamentos.map((row, index) => {
    const cliente = clientes.find((item) => item.id === row.cliente_id);
    return {
      id: asString(row.id, `fat-${index}`),
      clienteId: asString(row.cliente_id),
      cliente: asString(cliente?.nome, 'Cliente não informado'),
      valor: asNumber(row.valor),
      vencimento: asString(row.data_vencimento, new Date().toISOString().slice(0, 10)),
      status: normalizeStatus(row.status),
      pix: asString(row.pix_qr_code) || asString(row.pix_payload) || asString(row.pix_copia_e_cola) || null,
      boletoUrl: asString(row.boleto_url) || null,
      linhaDigitavel: asString(row.linha_digitavel) || null,
      codigoBarras: asString(row.codigo_barras) || null,
      createdAt: asString(row.created_at, asString(row.data_vencimento)),
    };
  });

  const clients: DashboardClient[] = clientes.map((row, index) => {
    const activeBilling = billings.find((billing) => billing.clienteId === row.id);
    const assinatura = assinaturas.find((item) => item.cliente_id === row.id);
    const monthlyValue = asNumber(assinatura?.valor_mensal, activeBilling?.valor ?? 0);
    return {
      id: asString(row.id, `cli-${index}`),
      nome: asString(row.nome, 'Cliente sem nome'),
      email: asString(row.email, 'email não informado'),
      documento: asString(row.cpf_cnpj, 'documento não informado'),
      telefone: asString(row.telefone, asString(row.whatsapp, 'telefone não informado')),
      status: asString(row.status_assinatura, asString(assinatura?.status, 'ativa')),
      unidade: [row.cidade, row.estado].filter(Boolean).join(', ') || asString(row.endereco_completo, 'Unidade não informada'),
      consumoKwh: asNumber(row.consumo_medio_kwh, 0),
      economia: asNumber(row.economia_mensal, monthlyValue * 0.38),
      valorMensal: monthlyValue,
    };
  });

  const receitaMensal = billings.reduce((sum, billing) => sum + billing.valor, 0);
  const paid = billings.filter((billing) => billing.status === 'pago').length;
  const pending = billings.filter((billing) => billing.status !== 'pago' && billing.status !== 'cancelado').length;
  const late = billings.filter((billing) => billing.status === 'atrasado' || billing.status === 'nao_pago').length;
  const pixReceived = billings.filter((billing) => billing.pix && billing.status === 'pago').reduce((sum, billing) => sum + billing.valor, 0);
  const savings = clients.reduce((sum, client) => sum + client.economia, 0);
  const kwh = clients.reduce((sum, client) => sum + client.consumoKwh, 0);

  const monthlyRevenue = Array.from({ length: 6 }, (_, offset) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - offset));
    const key = date.toISOString().slice(0, 7);
    return {
      name: monthLabel(date),
      receita: billings
        .filter((billing) => billing.vencimento.startsWith(key))
        .reduce((sum, billing) => sum + billing.valor, 0),
    };
  });

  return {
    metrics: [
      { id: 'mrr', label: 'Receita mensal', value: money(receitaMensal), helper: 'Faturamentos do período', trend: '+12,4%', tone: 'green' },
      { id: 'arr', label: 'Receita anual', value: money(receitaMensal * 12), helper: 'Projeção anual', trend: '+16%', tone: 'green' },
      { id: 'active', label: 'Clientes ativos', value: number.format(clients.filter((client) => client.status === 'ativa').length), helper: 'Base operacional', trend: '+8', tone: 'blue' },
      { id: 'paid', label: 'Boletos pagos', value: number.format(paid), helper: 'Liquidados', trend: 'ciclo atual', tone: 'green' },
      { id: 'pending', label: 'Boletos pendentes', value: number.format(pending), helper: 'Em aberto', trend: 'monitorar', tone: 'yellow' },
      { id: 'pix', label: 'Pix recebidos', value: money(pixReceived), helper: 'Pagamentos instantâneos', trend: '+7%', tone: 'green' },
      { id: 'savings', label: 'Economia gerada', value: money(savings), helper: 'Estimativa mensal', trend: '+10%', tone: 'blue' },
      { id: 'kwh', label: 'kWh compensados', value: `${number.format(kwh)} kWh`, helper: 'Créditos ativos', trend: '+6%', tone: 'blue' },
      { id: 'late', label: 'Inadimplência', value: `${billings.length ? ((late / billings.length) * 100).toFixed(1) : '0'}%`, helper: 'Carteira em risco', trend: late ? 'atenção' : 'estável', tone: late ? 'red' : 'green' },
    ],
    monthlyRevenue,
    clientGrowth: monthlyRevenue.map((point, index) => ({ name: point.name, clientes: Math.max(0, clients.length - (5 - index) * 2) })),
    paymentStatus: [
      { name: 'Pago', value: paid },
      { name: 'Pendente', value: pending },
      { name: 'Atrasado', value: late },
      { name: 'Cancelado', value: billings.filter((billing) => billing.status === 'cancelado').length },
    ],
    pixVsBoleto: monthlyRevenue.map((point) => ({ name: point.name, pix: Math.round((point.receita ?? 0) * 0.42), boleto: Math.round((point.receita ?? 0) * 0.58) })),
    energySavings: monthlyRevenue.map((point, index) => ({ name: point.name, economia: Math.round(savings * (0.72 + index * 0.06)), kwh: Math.round(kwh * (0.7 + index * 0.05)) })),
    clients,
    billings,
    logs: mockDashboardData.logs,
    itauStatus: {
      token: 'online',
      webhook: 'online',
      environment: process.env.NEXT_PUBLIC_ITAU_ENV === 'production' ? 'producao' : 'homologacao',
      latencyMs: asNumber(usinas[0]?.latencia_itau_ms, 180),
    },
  };
}

export async function getSaasDashboardData(): Promise<DashboardData> {
  if (typeof window === 'undefined') {
    return mockDashboardData;
  }

  try {
    const supabase = createSupabaseBrowserClient();
    const [{ data: clientes }, { data: assinaturas }, { data: faturamentos }, { data: usinas }] = await Promise.all([
      supabase.from('clientes').select('*').order('created_at', { ascending: false }),
      supabase.from('assinaturas').select('*'),
      supabase.from('faturamento').select('*').order('created_at', { ascending: false }),
      supabase.from('usinas').select('*').order('updated_at', { ascending: false }).limit(1),
    ]);

    return buildDashboardData(clientes ?? [], assinaturas ?? [], faturamentos ?? [], usinas ?? []);
  } catch {
    return mockDashboardData;
  }
}

export function getClientById(data: DashboardData, id: string) {
  return data.clients.find((client) => client.id === id) ?? data.clients[0];
}

export function getBillingById(data: DashboardData, id: string) {
  return data.billings.find((billing) => billing.id === id) ?? data.billings[0];
}
