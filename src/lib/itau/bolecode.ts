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
  return new Date().toISOString().slice(0, 10);
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

function readBolecodeResponse(payload: ItauBolecodeResponse): BolecodeOutput {
  const data = Array.isArray(payload.data) ? payload.data[0] : payload.data;
  const boleto = ((data ?? payload) || {}) as ItauBolecodeResponse;
  const boletoIndividual = boleto.dado_boleto?.dados_individuais_boleto?.[0];

  return {
    idBoleto: boleto.id_boleto ?? crypto.randomUUID(),
    nossoNumero:
      boleto.numero_nosso_numero ??
      boletoIndividual?.numero_nosso_numero ??
      '',
    codigoBarras: boleto.codigo_barras ?? boletoIndividual?.codigo_barras ?? '',
    linhaDigitavel: boleto.numero_linha_digitavel ?? boleto.linha_digitavel ?? boletoIndividual?.numero_linha_digitavel ?? '',
    qrCode: boleto.dados_qrcode?.emv ?? boleto.pix?.qr_code ?? boleto.pix?.tx_id ?? boleto.pix?.txid ?? '',
    pixUrl: boleto.dados_qrcode?.location ?? boleto.pix?.url ?? '',
    boletoUrl: boleto.url ?? boleto.dados_qrcode?.location ?? boleto.pix?.url ?? null,
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
      quantidade_maximo_parcial: '0',
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

  if (response.status < 200 || response.status >= 300) {
    throw new ItauBolecodeError(response);
  }

  return readBolecodeResponse(response.data);
}
