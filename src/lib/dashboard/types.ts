export type ClienteStatus = 'ativa' | 'inativa' | 'cancelada';
export type FaturamentoStatus = 'gerado' | 'pago' | 'nao_pago';

export interface Cliente {
  id: string;
  nome: string;
  cpf_cnpj: string;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  endereco_completo: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  complemento: string | null;
  responsavel: string | null;
  cargo_responsavel: string | null;
  observacoes: string | null;
  status_assinatura: ClienteStatus;
}

export interface Assinatura {
  id: string;
  cliente_id: string;
  valor_mensal: number;
  dia_vencimento: number;
  status: 'ativa' | 'pausada' | 'cancelada';
}

export interface Faturamento {
  id: string;
  cliente_id: string;
  assinatura_id: string | null;
  id_itau: string | null;
  nosso_numero: string | null;
  valor: number;
  data_vencimento: string;
  status: FaturamentoStatus;
  boleto_url: string | null;
  codigo_barras: string | null;
  linha_digitavel: string | null;
  pix_qr_code: string | null;
  pix_url: string | null;
}

export interface MonthlyBillingPoint {
  mes: string;
  total: number;
}

export interface DashboardOverview {
  mrr: number;
  clientesAtivos: number;
  inadimplenciaPercentual: number;
  saudeUsinaPercentual: number;
  geracaoTempoRealKw: number;
  monthlyBilling: MonthlyBillingPoint[];
  clientes: Array<
    Cliente & {
      assinatura?: Assinatura | null;
      ultimoFaturamento?: Faturamento | null;
    }
  >;
}
