import { createBoletoPdfBuffer } from '@/lib/billing/pdf';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import type { FaturamentoPdfRecord } from '@/services/faturamentoService';

export function createFaturamentoPdf(record: FaturamentoPdfRecord) {
  return createBoletoPdfBuffer({
    clientName: record.clientes.nome,
    clientDocument: record.clientes.cpf_cnpj,
    amount: Number(record.valor),
    dueDate: record.data_vencimento,
    boletoUrl: record.boleto_url,
    linhaDigitavel: record.linha_digitavel,
    codigoBarras: record.codigo_barras,
    pixUrl: record.pix_url,
    pixQrCode: record.pix_qr_code,
  });
}

export async function logPdfGeneration(input: {
  usuarioId: string;
  clienteId: string;
  faturamentoId: string;
  ip: string | null;
  userAgent: string | null;
}) {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from('pdf_logs').insert({
    usuario_id: input.usuarioId,
    cliente_id: input.clienteId,
    faturamento_id: input.faturamentoId,
    acao: 'gerar_pdf_boleto',
    ip: input.ip,
    user_agent: input.userAgent,
  });

  if (error) {
    console.error('Erro ao registrar log de PDF:', error.message);
  }
}
