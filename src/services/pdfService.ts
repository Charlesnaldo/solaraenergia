import { createBoletoPdfBuffer } from '@/lib/billing/pdf';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import type { FaturamentoPdfRecord } from '@/services/faturamentoService';

function buildAddress(cliente: FaturamentoPdfRecord['clientes']) {
  const structured = [
    [cliente.rua, cliente.numero].filter(Boolean).join(', '),
    cliente.complemento,
    cliente.bairro,
    [cliente.cidade, cliente.estado].filter(Boolean).join(' - '),
    cliente.cep,
  ]
    .filter(Boolean)
    .join(', ');

  return structured || cliente.endereco_completo || null;
}

export function createFaturamentoPdf(record: FaturamentoPdfRecord) {
  const address = buildAddress(record.clientes);

  return createBoletoPdfBuffer({
    clientName: record.clientes.nome,
    clientDocument: record.clientes.cpf_cnpj,
    amount: Number(record.valor),
    dueDate: record.data_vencimento,
    status: record.status,
    faturamentoId: record.id,
    issueDate: new Date().toISOString(),
    description: 'Servicos de energia solar / faturamento mensal',
    clientAddress: address,
    installationAddress: address,
    companyCnpj: process.env.SOLARA_CNPJ || process.env.COMPANY_CNPJ || null,
    supportEmail: process.env.BILLING_SUPPORT_EMAIL || null,
    supportWhatsapp: process.env.BILLING_SUPPORT_WHATSAPP || process.env.NEXT_PUBLIC_WHATSAPP || null,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
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
