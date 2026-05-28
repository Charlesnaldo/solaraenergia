import { createBoletoPdfBuffer } from '@/lib/billing/pdf';
import { getPixPaymentPayload, normalizePixPayload, validatePixPayload } from '@/lib/itau/bolecode';
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

export async function createFaturamentoPdf(record: FaturamentoPdfRecord) {
  const address = buildAddress(record.clientes);
  const hasItauRawResponse = record.api_response !== null && record.api_response !== undefined;
  const pixPayloadFromItau = getPixPaymentPayload(record.api_response);
  const pixPayloadSaved = normalizePixPayload(record.pix_qr_code);
  const pixPaymentPayload =
    pixPayloadFromItau ||
    (!hasItauRawResponse && pixPayloadSaved && validatePixPayload(pixPayloadSaved) ? pixPayloadSaved : '');

  console.log('PIX PAYLOAD RECEBIDO DO ITAU', pixPayloadFromItau || null);
  console.log('PIX PAYLOAD SALVO NO BANCO', pixPayloadSaved || null);

  if (pixPayloadFromItau && pixPayloadSaved !== pixPayloadFromItau) {
    console.warn('[billing-pdf] Payload Pix salvo diverge do payload oficial do Itaú. Atualizando pix_qr_code.');

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase
      .from('faturamento')
      .update({ pix_qr_code: pixPayloadFromItau })
      .eq('id', record.id);

    if (error) {
      console.error('[billing-pdf] Erro ao atualizar pix_qr_code com payload oficial do Itaú:', error.message);
    }
  }

  return await createBoletoPdfBuffer({
    clientName: record.clientes.nome,
    clientDocument: record.clientes.cpf_cnpj,
    amount: Number(record.valor),
    dueDate: record.data_vencimento,
    status: record.status,
    faturamentoId: record.id,
    issueDate: new Date().toISOString(),
    description: 'Serviços de energia solar / faturamento mensal',
    clientAddress: address,
    installationAddress: address,
    companyCnpj: process.env.SOLARA_CNPJ || process.env.COMPANY_CNPJ || null,
    companyAddress: process.env.SOLARA_ADDRESS || process.env.COMPANY_ADDRESS || null,
    supportEmail: process.env.BILLING_SUPPORT_EMAIL || null,
    supportWhatsapp: process.env.BILLING_SUPPORT_WHATSAPP || process.env.NEXT_PUBLIC_WHATSAPP || null,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
    boletoUrl: record.boleto_url,
    linhaDigitavel: record.linha_digitavel,
    codigoBarras: record.codigo_barras,
    nossoNumero: record.nosso_numero,
    pixUrl: record.pix_url,
    pixPayload: pixPaymentPayload || null,
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
