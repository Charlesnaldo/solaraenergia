import crypto from 'node:crypto';
import { requestItauApiJson } from '@/lib/itau/client';
import type { ItauHttpResponse } from '@/lib/itau/http';

export interface EmitirBolecodeInput {
  seuNumero: string;
  valor: number;
  dataVencimento: string;
  pagador: {
    nome: string;
    cpfCnpj: string;
    email?: string | null;
    cep?: string | null;
    logradouro?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    uf?: string | null;
  };
  mensagem?: string;
  simulacao?: boolean;
}

export interface BolecodeOutput {
  idBoleto: string;
  nossoNumero: string;
  codigoBarras: string;
  linhaDigitavel: string;
  qrCode: string;
  pixUrl: string;
  boletoUrl: string | null;
  raw: unknown;
}

interface ItauBolecodeResponse {
  data?: unknown[] | Record<string, unknown>;
  id_boleto?: string;
  numero_nosso_numero?: string;
  codigo_barras?: string;
  numero_linha_digitavel?: string;
  linha_digitavel?: string;
  url?: string;
  pix?: {
    txid?: string;
    tx_id?: string;
    url?: string;
    qr_code?: string;
  };
  dados_qrcode?: {
    emv?: string;
    location?: string;
    base64?: string;
    txid?: string;
  };
  dado_boleto?: {
    dados_individuais_boleto?: Array<{
      numero_nosso_numero?: string;
      codigo_barras?: string;
      numero_linha_digitavel?: string;
    }>;
  };
}

type ItauDiagnostics = Record<string, unknown>;

function getHeader(headers: Record<string, string | string[] | undefined>, name: string) {
  const target = name.toLowerCase();
  const found = Object.entries(headers).find(([key]) => key.toLowerCase() === target)?.[1];

  return Array.isArray(found) ? found.join(', ') : found;
}

function readStringField(record: Record<string, unknown>, names: string[]) {
  for (const name of names) {
    const value = record[name];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function readItauValidationDetails(data: unknown) {
  if (!data || typeof data !== 'object') {
    return [];
  }

  const details: Array<Record<string, string>> = [];
  const seen = new Set<string>();

  function collect(value: unknown) {
    if (!value || typeof value !== 'object') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }

    const record = value as Record<string, unknown>;
    const campo = readStringField(record, ['campo', 'field', 'parametro', 'parameter', 'path']);
    const mensagem = readStringField(record, ['mensagem', 'message', 'descricao', 'description', 'detail', 'erro', 'error']);

    if (campo || mensagem) {
      const key = `${campo ?? ''}:${mensagem ?? ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        details.push({
          ...(campo ? { campo: campo.slice(0, 180) } : {}),
          ...(mensagem ? { mensagem: mensagem.slice(0, 300) } : {}),
        });
      }
    }

    for (const nested of Object.values(record)) {
      if (nested && typeof nested === 'object') {
        collect(nested);
      }
    }
  }

  collect(data);
  return details.slice(0, 20);
}

function readItauErrorMessage(data: unknown, text: string) {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const candidates = [
      record.mensagem,
      record.message,
      record.descricao,
      record.detail,
      record.title,
      record.error_description,
      record.error,
    ];
    const message = candidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0);

    if (message) {
      return message.trim().slice(0, 500);
    }

    if (Array.isArray(record.campos)) {
      const fieldMessages = record.campos
        .map((field) => {
          if (!field || typeof field !== 'object') {
            return null;
          }

          const item = field as Record<string, unknown>;
          const campo = typeof item.campo === 'string' ? item.campo : null;
          const mensagem = typeof item.mensagem === 'string' ? item.mensagem : null;

          if (!mensagem) {
            return null;
          }

          return campo ? `${campo}: ${mensagem}` : mensagem;
        })
        .filter((value): value is string => Boolean(value));

      if (fieldMessages.length > 0) {
        return fieldMessages.join('; ').slice(0, 500);
      }
    }
  }

  return text.trim().slice(0, 500) || null;
}

export class ItauBolecodeError extends Error {
  readonly status: number;
  readonly mensagemItau: string | null;
  readonly diagnostics: ItauDiagnostics;

  constructor(response: ItauHttpResponse<ItauBolecodeResponse>) {
    const mensagemItau = readItauErrorMessage(response.data, response.text);
    const validationDetails = readItauValidationDetails(response.data);

    super(`Erro ao emitir Bolecode Itau: HTTP ${response.status}${mensagemItau ? ` - ${mensagemItau}` : ''}.`);
    this.name = 'ItauBolecodeError';
    this.status = response.status;
    this.mensagemItau = mensagemItau;
    this.diagnostics = {
      status: response.status,
      mensagem: mensagemItau,
      endpoint: describeBolecodeEndpoint().maskedUrl,
      endpoint_source: describeBolecodeEndpoint().source,
      payload_shape: shouldWrapBolecodePayload() ? 'data' : 'root',
      validacao_campos: validationDetails,
      x_itau_client_cert_error: getHeader(response.headers, 'x-itau-client-cert-error') ?? null,
      x_itau_correlation_id: getHeader(response.headers, 'x-itau-correlationID') ?? null,
      x_correlation_id: getHeader(response.headers, 'x-correlation-id') ?? null,
    };
  }
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function sanitizeItauText(value: string | null | undefined, maxLength: number) {
  const sanitized = (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 .,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return sanitized.slice(0, maxLength);
}

function formatItauAmount(value: number) {
  return Math.round(value * 100)
    .toString()
    .padStart(17, '0');
}

function todayIsoDate() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function addDaysIsoDate(dateIso: string, days: number) {
  const date = new Date(`${dateIso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Configure ${name}.`);
  }

  return value;
}

function requireItauValue(name: string, value: string | null | undefined) {
  const sanitized = value?.trim();
  if (!sanitized) {
    throw new Error(`Complete os dados do cliente para emitir Bolecode: ${name}.`);
  }

  return sanitized;
}

function createMockBolecode(input: EmitirBolecodeInput): BolecodeOutput {
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  const nossoNumero = input.seuNumero.padStart(8, '0');

  return {
    idBoleto: `MOCK-${suffix}`,
    nossoNumero,
    codigoBarras: `34191.09008 ${suffix}`,
    linhaDigitavel: `34191.09008 00000.000000 ${suffix}`,
    qrCode: `MOCK-TXID-${suffix}`,
    pixUrl: `https://solaraenergia.com.br/boletos/${suffix}`,
    boletoUrl: `https://solaraenergia.com.br/boletos/${suffix}`,
    raw: { mocked: true, input },
  };
}

function maskEndpointUrl(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
  } catch {
    return 'invalid_url';
  }
}

export function describeBolecodeEndpoint() {
  const boletoUrl = process.env.ITAU_BOLETO_URL?.trim();
  if (boletoUrl) {
    return {
      source: 'ITAU_BOLETO_URL',
      maskedUrl: maskEndpointUrl(boletoUrl),
    };
  }

  const apiUrl = process.env.ITAU_API_URL?.trim();
  if (apiUrl) {
    return {
      source: 'ITAU_API_URL_FALLBACK',
      maskedUrl: maskEndpointUrl(`${apiUrl.replace(/\/$/, '')}/boletos/v3/boletos`),
    };
  }

  return {
    source: 'missing',
    maskedUrl: '',
  };
}

function getBolecodeUrl() {
  const boletoUrl = process.env.ITAU_BOLETO_URL?.trim();
  if (boletoUrl) {
    return boletoUrl;
  }

  const apiUrl = process.env.ITAU_API_URL?.trim();
  if (apiUrl) {
    return `${apiUrl.replace(/\/$/, '')}/boletos/v3/boletos`;
  }

  return requireEnv('ITAU_BOLETO_URL');
}

function shouldWrapBolecodePayload() {
  return process.env.ITAU_BOLECODE_WRAP_DATA === 'true';
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readFirstString(records: Array<Record<string, unknown> | null | undefined>, names: string[]) {
  for (const record of records) {
    if (!record) {
      continue;
    }

    for (const name of names) {
      const value = record[name];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }

  return '';
}

const PIX_EMV_FIELD_NAMES = [
  'pixPayload',
  'pix_payload',
  'pixCopiaCola',
  'pixCopiaECola',
  'pix_copia_cola',
  'pix_copia_e_cola',
  'emv',
  'emv_qrcode',
  'emv_qr_code',
  'qr_code_emv',
  'qrcode_emv',
  'qrCode',
  'QRCode',
  'qr_code',
  'qrcode',
  'qrcode_pix',
  'qr_code_pix',
  'payload',
  'payloadPix',
  'payload_pix',
  'brcode',
  'brCode',
  'BRCode',
  'br_code',
  'copiaECola',
  'copia_cola',
  'copia_e_cola',
  'codigo_pix',
  'codigo_qrcode',
  'codigo_qr_code',
  'texto_qrcode',
  'texto_qr_code',
  'base64',
  'qr_code_base64',
];

const PIX_MIN_PAYLOAD_LENGTH = 40;
const PIX_GUI = 'BR.GOV.BCB.PIX';

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function tryBase64Decode(value: string) {
  try {
    const decoded = Buffer.from(value, 'base64').toString('utf8');
    if (decoded.startsWith('000201')) {
      return decoded;
    }
  } catch {
    // ignore
  }
  return null;
}

export function normalizePixPayload(value?: string | null) {
  if (!value) {
    return null;
  }

  // Se parecer base64, tenta decodificar
  const base64Decoded = tryBase64Decode(value);
  const officialPayload = base64Decoded ?? value;

  return officialPayload
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\r\n\t\f\v]+/g, '')
    .trim();
}

function getPixPayloadCandidates(value: string | null | undefined) {
  const normalized = normalizePixPayload(value);
  return normalized ? [normalized] : [];
}

interface EmvTag {
  id: string;
  length: number;
  value: string;
  start: number;
  end: number;
}

function parseEmvTags(payload: string): EmvTag[] | null {
  const tags: EmvTag[] = [];
  let cursor = 0;

  while (cursor < payload.length) {
    if (cursor + 4 > payload.length) {
      return null;
    }

    const id = payload.slice(cursor, cursor + 2);
    const lengthText = payload.slice(cursor + 2, cursor + 4);
    if (!/^\d{2}$/.test(id) || !/^\d{2}$/.test(lengthText)) {
      return null;
    }

    const length = Number(lengthText);
    const valueStart = cursor + 4;
    const valueEnd = valueStart + length;
    if (valueEnd > payload.length) {
      return null;
    }

    tags.push({
      id,
      length,
      value: payload.slice(valueStart, valueEnd),
      start: cursor,
      end: valueEnd,
    });
    cursor = valueEnd;
  }

  return tags;
}

export function calculateCRC16CCITT(value: string) {
  let crc = 0xffff;

  for (const byte of Buffer.from(value, 'ascii')) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function validatePixCrc(payload: string): boolean {
  const normalized = normalizePixPayload(payload);
  if (!normalized) return false;

  const crcIndex = normalized.lastIndexOf('6304');
  if (crcIndex === -1) return false;

  const payloadWithoutCrcValue = normalized.slice(0, crcIndex + 4);
  const expectedCrc = normalized.slice(crcIndex + 4, crcIndex + 8).toUpperCase();
  if (!/^[0-9A-F]{4}$/.test(expectedCrc)) return false;

  const calculatedCrc = calculateCRC16CCITT(payloadWithoutCrcValue);

  return calculatedCrc === expectedCrc;
}

function hasValidPixCrc(payload: string, tags: EmvTag[]) {
  const crcTag = tags.at(-1);
  if (!crcTag || crcTag.id !== '63' || crcTag.length !== 4 || !/^[0-9A-Fa-f]{4}$/.test(crcTag.value)) {
    return false;
  }

  return validatePixCrc(payload);
}

function hasPixMerchantAccount(tags: EmvTag[]) {
  return tags.some((tag) => {
    const tagId = Number(tag.id);
    if (tagId < 26 || tagId > 51) {
      return false;
    }

    const nestedTags = parseEmvTags(tag.value);
    return nestedTags?.some((nested) => nested.id === '00' && nested.value.toUpperCase() === PIX_GUI) ?? false;
  });
}

function isValidPixPayloadCandidate(payload: string) {
  if (isHttpUrl(payload) || payload.length < PIX_MIN_PAYLOAD_LENGTH || !payload.startsWith('000201')) {
    return false;
  }

  const tags = parseEmvTags(payload);
  if (!tags) {
    return false;
  }

  const payloadFormat = tags.find((tag) => tag.id === '00');
  const countryCode = tags.find((tag) => tag.id === '58');

  return (
    payloadFormat?.value === '01' &&
    countryCode?.value.toUpperCase() === 'BR' &&
    hasPixMerchantAccount(tags) &&
    hasValidPixCrc(payload, tags)
  );
}

function findValidPixPayload(value: string | null | undefined) {
  for (const payload of getPixPayloadCandidates(value)) {
    if (isValidPixPayloadCandidate(payload)) {
      return payload;
    }
  }

  return null;
}

export function validatePixPayload(value: string | null | undefined) {
  return Boolean(findValidPixPayload(value));
}

export const isPixPaymentPayload = validatePixPayload;

export function extractPixPayload(value: unknown, seen = new WeakSet<object>()): string | null {
  if (typeof value === 'string') {
    return findValidPixPayload(value);
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  if (seen.has(value)) {
    return null;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      if (!item || typeof item !== 'object') {
        continue;
      }

      const found = extractPixPayload(item, seen);
      if (found) {
        return found;
      }
    }

    return null;
  }

  const record = value as Record<string, unknown>;
  for (const name of PIX_EMV_FIELD_NAMES) {
    const direct = record[name];
    if (typeof direct === 'string') {
      const payload = extractPixPayload(direct, seen);
      if (payload) {
        return payload;
      }
    }
  }

  for (const nested of Object.values(record)) {
    if (!nested || typeof nested !== 'object') {
      continue;
    }

    const found = extractPixPayload(nested, seen);
    if (found) {
      return found;
    }
  }

  return null;
}

export function getPixPaymentPayload(...values: unknown[]) {
  for (const value of values) {
    const found = extractPixPayload(value);
    if (found) {
      return found;
    }
  }

  return '';
}

function firstRecord(value: unknown) {
  if (Array.isArray(value)) {
    return asRecord(value[0]);
  }

  return asRecord(value);
}

function readBolecodeResponse(payload: ItauBolecodeResponse): BolecodeOutput {
  const payloadRecord = asRecord(payload);
  const dataRecord = firstRecord(payload.data);
  const boletoRecord = asRecord(dataRecord?.dado_boleto) ?? asRecord(payloadRecord?.dado_boleto);
  const boletoIndividual =
    firstRecord(boletoRecord?.dados_individuais_boleto) ??
    firstRecord(dataRecord?.dados_individuais_boleto) ??
    firstRecord(payloadRecord?.dados_individuais_boleto);
  const qrCodeRecord = asRecord(dataRecord?.dados_qrcode) ?? asRecord(payloadRecord?.dados_qrcode);
  const pixRecord = asRecord(dataRecord?.pix) ?? asRecord(payloadRecord?.pix);

  const boletoRecords = [boletoIndividual, boletoRecord, dataRecord, payloadRecord];
  const pixUrlCandidate =
    readFirstString([qrCodeRecord, pixRecord], ['location', 'url_pix', 'pix_url', 'url']) ||
    readFirstString([dataRecord, payloadRecord], ['pix_url', 'url_pix']);
  const pixUrl = pixUrlCandidate && isHttpUrl(pixUrlCandidate) ? pixUrlCandidate : '';
  const genericUrl = readFirstString([dataRecord, payloadRecord], ['url']);
  const boletoUrl =
    readFirstString(boletoRecords, ['url_boleto', 'boleto_url', 'url_pdf', 'url_download', 'url_visualizacao', 'link_boleto']) ||
    (genericUrl && genericUrl !== pixUrl ? genericUrl : '');
  const qrCode = getPixPaymentPayload(qrCodeRecord, pixRecord, dataRecord, payloadRecord, boletoRecord, boletoIndividual);

  return {
    idBoleto: readFirstString(boletoRecords, ['id_boleto', 'id_boleto_pix', 'id', 'numero_boleto']) || crypto.randomUUID(),
    nossoNumero: readFirstString(boletoRecords, ['numero_nosso_numero', 'nosso_numero']),
    codigoBarras: readFirstString(boletoRecords, ['codigo_barras', 'numero_codigo_barras']),
    linhaDigitavel: readFirstString(boletoRecords, ['numero_linha_digitavel', 'linha_digitavel']),
    qrCode,
    pixUrl,
    boletoUrl: boletoUrl || null,
    raw: payload,
  };
}

export function createSeuNumero() {
  return crypto.randomInt(10_000_000, 99_999_999).toString();
}

export async function emitirBolecode(input: EmitirBolecodeInput): Promise<BolecodeOutput> {
  if (process.env.ITAU_MOCK === 'true') {
    return createMockBolecode(input);
  }

  const cpfCnpj = onlyDigits(input.pagador.cpfCnpj);
  const isPessoaFisica = cpfCnpj.length <= 11;
  const valorFormatado = formatItauAmount(input.valor);
  const chavePix = requireEnv('ITAU_CHAVE_PIX');
  const endereco = {
    nome_logradouro: sanitizeItauText(requireItauValue('logradouro', input.pagador.logradouro), 45),
    nome_bairro: sanitizeItauText(requireItauValue('bairro', input.pagador.bairro), 15),
    nome_cidade: sanitizeItauText(requireItauValue('cidade', input.pagador.cidade), 20),
    sigla_UF: sanitizeItauText(requireItauValue('UF', input.pagador.uf), 2).toUpperCase(),
    numero_CEP: onlyDigits(requireItauValue('CEP', input.pagador.cep)).slice(0, 8),
  };
  const textoUsoBeneficiario = sanitizeItauText(input.mensagem ?? input.seuNumero, 25);

  const data = {
    etapa_processo_boleto: input.simulacao ? 'simulacao' : 'efetivacao',
    codigo_canal_operacao: 'API',
    beneficiario: {
      id_beneficiario: requireEnv('ITAU_ID_BENEFICIARIO'),
    },
    dado_boleto: {
      descricao_instrumento_cobranca: 'boleto_pix',
      tipo_boleto: 'a vista',
      codigo_carteira: process.env.ITAU_CODIGO_CARTEIRA?.trim() || '109',
      codigo_tipo_vencimento: 3,
      codigo_especie: process.env.ITAU_CODIGO_ESPECIE?.trim() || '04',
      valor_abatimento: formatItauAmount(0),
      valor_total_titulo: valorFormatado,
      data_emissao: todayIsoDate(),
      pagamento_parcial: false,
      desconto_expresso: false,
      pagador: {
        pessoa: {
          nome_pessoa: sanitizeItauText(input.pagador.nome, 50),
          tipo_pessoa: {
            codigo_tipo_pessoa: isPessoaFisica ? 'F' : 'J',
            numero_cadastro_pessoa_fisica: isPessoaFisica ? cpfCnpj : undefined,
            numero_cadastro_nacional_pessoa_juridica: isPessoaFisica ? undefined : cpfCnpj,
          },
        },
        endereco,
      },
      dados_individuais_boleto: [
        {
          numero_nosso_numero: input.seuNumero.padStart(8, '0'),
          data_vencimento: input.dataVencimento,
          data_limite_pagamento: addDaysIsoDate(input.dataVencimento, 30),
          valor_titulo: valorFormatado,
          texto_seu_numero: input.seuNumero,
          texto_uso_beneficiario: textoUsoBeneficiario || undefined,
        },
      ],
      recebimento_divergente: {
        codigo_tipo_autorizacao: '03',
      },
    },
    dados_qrcode: { chave: chavePix },
  };
  const payload = shouldWrapBolecodePayload() ? { data } : data;

  const response = await requestItauApiJson<ItauBolecodeResponse>(getBolecodeUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  console.log('ITAU RAW RESPONSE', JSON.stringify(response, null, 2));

  if (response.status < 200 || response.status >= 300) {
    throw new ItauBolecodeError(response);
  }

  const output = readBolecodeResponse(response.data);
  if (!output.qrCode) {
    console.warn(
      '[itau-bolecode] Itau nao retornou payload Pix EMV valido. pix_url/location pode existir, mas nao sera usado como QR Pix.',
    );
  }

  return output;
}
