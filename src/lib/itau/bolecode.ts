import crypto from 'node:crypto';
import { getItauAccessToken } from '@/lib/itau/auth';
import { requestItauJson } from '@/lib/itau/http';

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
  data?: unknown[];
  id_boleto?: string;
  numero_nosso_numero?: string;
  codigo_barras?: string;
  numero_linha_digitavel?: string;
  linha_digitavel?: string;
  url?: string;
  pix?: {
    tx_id?: string;
    url?: string;
    qr_code?: string;
  };
  dado_boleto?: {
    dados_individuais_boleto?: Array<{
      numero_nosso_numero?: string;
    }>;
  };
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Configure ${name}.`);
  }

  return value;
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

function getBolecodeUrl() {
  const apiUrl = process.env.ITAU_API_URL?.trim();
  if (apiUrl) {
    return `${apiUrl.replace(/\/$/, '')}/boletos/v3/boletos`;
  }

  return requireEnv('ITAU_BOLETO_URL');
}

function readBolecodeResponse(payload: ItauBolecodeResponse): BolecodeOutput {
  const boleto = ((payload.data?.[0] ?? payload) || {}) as ItauBolecodeResponse;

  return {
    idBoleto: boleto.id_boleto ?? crypto.randomUUID(),
    nossoNumero:
      boleto.numero_nosso_numero ??
      boleto.dado_boleto?.dados_individuais_boleto?.[0]?.numero_nosso_numero ??
      '',
    codigoBarras: boleto.codigo_barras ?? '',
    linhaDigitavel: boleto.numero_linha_digitavel ?? boleto.linha_digitavel ?? '',
    qrCode: boleto.pix?.tx_id ?? boleto.pix?.qr_code ?? '',
    pixUrl: boleto.pix?.url ?? '',
    boletoUrl: boleto.url ?? boleto.pix?.url ?? null,
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

  const token = await getItauAccessToken();
  const cpfCnpj = onlyDigits(input.pagador.cpfCnpj);
  const isPessoaFisica = cpfCnpj.length <= 11;

  const payload = {
    etapa_processo_boleto: input.simulacao ? 'Simulacao' : 'efetivacao',
    codigo_canal_operacao: 'API',
    beneficiario: {
      id_beneficiario: requireEnv('ITAU_ID_BENEFICIARIO'),
    },
    dado_boleto: {
      tipo_boleto: 'COBRANCA',
      codigo_carteira: process.env.ITAU_CODIGO_CARTEIRA?.trim() || '109',
      valor_total_titulo: input.valor.toFixed(2),
      data_vencimento: input.dataVencimento,
      seu_numero: input.seuNumero,
      chave_pix: process.env.ITAU_CHAVE_PIX?.trim() || undefined,
      dados_individuais_boleto: [
        {
          numero_nosso_numero: input.seuNumero.padStart(8, '0'),
          data_vencimento: input.dataVencimento,
          valor_titulo: input.valor.toFixed(2),
          texto_seu_numero: input.seuNumero,
        },
      ],
      sacado_avalista: {
        nome_pessoa: input.pagador.nome,
        tipo_pessoa: isPessoaFisica ? 'FISICA' : 'JURIDICA',
        numero_cadastro_pessoa_fisica: isPessoaFisica ? cpfCnpj : undefined,
        numero_cadastro_nacional_pessoa_juridica: isPessoaFisica ? undefined : cpfCnpj,
        endereco: input.pagador.logradouro
          ? {
              nome_logradouro: input.pagador.logradouro,
              nome_cidade: input.pagador.cidade ?? undefined,
              sigla_UF: input.pagador.uf ?? undefined,
              numero_CEP: input.pagador.cep ? onlyDigits(input.pagador.cep) : undefined,
            }
          : undefined,
      },
      mensagem: input.mensagem ? { linha_1: input.mensagem } : undefined,
    },
  };

  const response = await requestItauJson<ItauBolecodeResponse>(getBolecodeUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Erro ao emitir Bolecode Itau: ${response.status} ${response.text}`);
  }

  return readBolecodeResponse(response.data);
}
