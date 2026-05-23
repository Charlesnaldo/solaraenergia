import { createSupabaseServiceClient } from '@/lib/supabase/service';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface FaturamentoPdfRecord {
  id: string;
  cliente_id: string;
  valor: number | string;
  data_vencimento: string;
  status: string | null;
  boleto_url: string | null;
  linha_digitavel: string | null;
  codigo_barras: string | null;
  pix_qr_code: string | null;
  pix_url: string | null;
  api_response: unknown | null;
  clientes: {
    id: string;
    nome: string;
    cpf_cnpj: string;
    email: string | null;
    endereco_completo: string | null;
    rua: string | null;
    numero: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
    cep: string | null;
    complemento: string | null;
  };
}

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export async function getFaturamentoForPdf(faturamentoId: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('faturamento')
    .select('id, cliente_id, valor, data_vencimento, status, boleto_url, linha_digitavel, codigo_barras, pix_qr_code, pix_url, api_response, clientes!inner(id, nome, cpf_cnpj, email, endereco_completo, rua, numero, bairro, cidade, estado, cep, complemento)')
    .eq('id', faturamentoId)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar faturamento: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const cliente = Array.isArray(data.clientes) ? data.clientes[0] : data.clientes;
  if (!cliente) {
    return null;
  }

  return {
    ...data,
    clientes: cliente,
  } as FaturamentoPdfRecord;
}
