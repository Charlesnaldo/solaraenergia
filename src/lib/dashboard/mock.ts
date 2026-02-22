import type { DashboardOverview } from '@/lib/dashboard/types';

export const mockOverview: DashboardOverview = {
  mrr: 48750,
  clientesAtivos: 42,
  inadimplenciaPercentual: 7.2,
  saudeUsinaPercentual: 96.4,
  geracaoTempoRealKw: 812.5,
  monthlyBilling: [
    { mes: 'Set', total: 38100 },
    { mes: 'Out', total: 40210 },
    { mes: 'Nov', total: 41590 },
    { mes: 'Dez', total: 43870 },
    { mes: 'Jan', total: 46220 },
    { mes: 'Fev', total: 48750 },
  ],
  clientes: [
    {
      id: 'mock-1',
      nome: 'Mercadinho Fortaleza',
      cpf_cnpj: '12.345.678/0001-90',
      email: 'financeiro@mercadinhofortaleza.com',
      telefone: '(85) 99999-1000',
      endereco_completo: 'Fortaleza/CE',
      status_assinatura: 'ativa',
      assinatura: {
        id: 'as-1',
        cliente_id: 'mock-1',
        valor_mensal: 1350,
        dia_vencimento: 15,
        status: 'ativa',
      },
      ultimoFaturamento: {
        id: 'fat-1',
        cliente_id: 'mock-1',
        assinatura_id: 'as-1',
        id_itau: 'SIM-001',
        valor: 1350,
        data_vencimento: '2026-03-15',
        status: 'pendente',
        boleto_url: 'https://example.com/boleto/sim-001',
      },
    },
  ],
};
