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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readStringField(record: Record<string, unknown> | null | undefined, names: string[]) {
  if (!record) return null;

  for (const name of names) {
    const value = record[name];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function collectRecords(value: unknown, path: string[] = [], seen = new WeakSet<object>()) {
  const records: Array<{ path: string[]; record: Record<string, unknown> }> = [];

  if (!value || typeof value !== 'object') {
    return records;
  }

  if (seen.has(value)) {
    return records;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      records.push(...collectRecords(item, [...path, String(index)], seen));
    });
    return records;
  }

  const record = value as Record<string, unknown>;
  records.push({ path, record });

  Object.entries(record).forEach(([key, nested]) => {
    if (nested && typeof nested === 'object') {
      records.push(...collectRecords(nested, [...path, key], seen));
    }
  });

  return records;
}

function isBeneficiaryPath(path: string[]) {
  const text = path
    .join('.')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return (
    /(beneficiario|beneficiary|cedente|favorecido|recebedor)/.test(text) &&
    !/(pagador|sacado|texto_uso_beneficiario)/.test(text)
  );
}

function readAddressFromRecord(record: Record<string, unknown> | null | undefined) {
  if (!record) return null;

  const direct = readStringField(record, [
    'endereco_beneficiario',
    'enderecoBeneficiario',
    'beneficiario_endereco',
    'beneficiary_address',
    'address',
    'endereco',
    'endereco_completo',
    'logradouro',
  ]);
  if (direct && direct.length > 12) return direct;

  const addressRecord =
    asRecord(record.endereco) ||
    asRecord(record.endereco_beneficiario) ||
    asRecord(record.enderecoBeneficiario) ||
    asRecord(record.address) ||
    record;

  if (!addressRecord) return null;

  const street = readStringField(addressRecord, ['nome_logradouro', 'logradouro', 'rua', 'street']);
  const number = readStringField(addressRecord, ['numero', 'numero_logradouro', 'number']);
  const district = readStringField(addressRecord, ['nome_bairro', 'bairro', 'district']);
  const city = readStringField(addressRecord, ['nome_cidade', 'cidade', 'city']);
  const state = readStringField(addressRecord, ['sigla_UF', 'uf', 'estado', 'state']);
  const cep = readStringField(addressRecord, ['numero_CEP', 'cep', 'codigo_cep', 'zip']);
  const streetLine = [street, number].filter(Boolean).join(', ');
  const cityLine = [city, state].filter(Boolean).join(' - ');
  const structured = [streetLine, district, cityLine, cep].filter(Boolean).join(', ');

  return structured || null;
}

function readFromRecordWithAnyField(records: Record<string, unknown>[], names: string[]) {
  const record = records.find((item) => readStringField(item, names));
  return readStringField(record, names);
}

function extractBeneficiaryFromItauResponse(raw: unknown) {
  const records = collectRecords(raw);
  const beneficiaryRecords = records.filter(({ path }) => isBeneficiaryPath(path)).map(({ record }) => record);
  const allRecords = records.map(({ record }) => record);

  const name =
    readFromRecordWithAnyField(beneficiaryRecords, ['nome', 'nome_pessoa', 'razao_social', 'nome_razao_social', 'nome_cobrador']) ||
    readFromRecordWithAnyField(allRecords, ['nome_beneficiario', 'nomeBeneficiario', 'beneficiary_name']);
  const document =
    readFromRecordWithAnyField(beneficiaryRecords, [
      'cnpj',
      'cpf_cnpj',
      'cpfCnpj',
      'documento',
      'numero_cadastro_nacional_pessoa_juridica',
      'numero_inscricao',
    ]) ||
    readFromRecordWithAnyField(allRecords, [
      'cnpj_beneficiario',
      'cpf_cnpj_beneficiario',
      'documento_beneficiario',
      'beneficiary_document',
    ]);
  const address =
    beneficiaryRecords.map(readAddressFromRecord).find((value): value is string => Boolean(value)) ||
    readFromRecordWithAnyField(allRecords, ['endereco_beneficiario', 'enderecoBeneficiario', 'beneficiary_address']);

  return {
    name,
    document,
    address,
  };
}

export async function createFaturamentoPdf(record: FaturamentoPdfRecord) {
  const address = buildAddress(record.clientes);
  const hasItauRawResponse = record.api_response !== null && record.api_response !== undefined;
  const beneficiary = extractBeneficiaryFromItauResponse(record.api_response);
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
    companyName:
      beneficiary.name ||
      process.env.BOLETO_BENEFICIARY_NAME ||
      process.env.SOLARA_RAZAO_SOCIAL ||
      process.env.SOLARA_NAME ||
      process.env.COMPANY_NAME ||
      null,
    companyCnpj: beneficiary.document || process.env.SOLARA_CNPJ || process.env.COMPANY_CNPJ || null,
    companyAddress: beneficiary.address || process.env.SOLARA_ADDRESS || process.env.COMPANY_ADDRESS || null,
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
