import crypto from 'node:crypto';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

interface ItauBoletoInput {
  clienteNome: string;
  clienteDocumento: string;
  valor: number;
  dataVencimento: string;
}

interface ItauBoletoOutput {
  idItau: string;
  boletoUrl: string;
}

async function getOAuthToken() {
  const tokenUrl = process.env.ITAU_TOKEN_URL;
  const clientId = process.env.ITAU_CLIENT_ID;
  const clientSecret = process.env.ITAU_CLIENT_SECRET;

  if (!tokenUrl || !clientId || !clientSecret) {
    throw new Error('OAuth2 Itaú não configurado: defina ITAU_TOKEN_URL, ITAU_CLIENT_ID e ITAU_CLIENT_SECRET.');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });

  if (!response.ok) {
    throw new Error(`Falha OAuth2 Itaú: ${response.status}`);
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error('Token OAuth2 Itaú ausente na resposta.');
  }

  return payload.access_token;
}

async function createItauBoleto(input: ItauBoletoInput): Promise<ItauBoletoOutput> {
  const useMock = process.env.ITAU_MOCK === 'true';
  if (useMock) {
    const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    return {
      idItau: `MOCK-${suffix}`,
      boletoUrl: `https://solaraenergia.com.br/boletos/${suffix}`,
    };
  }

  const authMode = process.env.ITAU_AUTH_MODE ?? 'oauth2';
  if (authMode === 'mtls') {
    throw new Error('Modo mTLS selecionado. Configure chamada mTLS via proxy seguro/infra antes de produção.');
  }

  const token = await getOAuthToken();
  const boletoUrl = process.env.ITAU_BOLETO_URL;

  if (!boletoUrl) {
    throw new Error('Defina ITAU_BOLETO_URL para emitir boletos via Itaú.');
  }

  const response = await fetch(boletoUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pagador: {
        nome: input.clienteNome,
        documento: input.clienteDocumento,
      },
      valor: input.valor,
      data_vencimento: input.dataVencimento,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha na emissão do boleto Itaú: ${response.status}`);
  }

  const payload = (await response.json()) as { id?: string; url?: string };

  return {
    idItau: payload.id ?? crypto.randomUUID(),
    boletoUrl: payload.url ?? '',
  };
}

export async function gerarBoletoParaCliente(params: {
  clienteId: string;
  valor: number;
  dataVencimento: string;
}) {
  const supabase = createSupabaseServiceClient();

  const { data: cliente, error: clienteError } = await supabase
    .from('clientes')
    .select('id, nome, cpf_cnpj')
    .eq('id', params.clienteId)
    .single();

  if (clienteError || !cliente) {
    throw new Error('Cliente não encontrado para emissão de boleto.');
  }

  const itau = await createItauBoleto({
    clienteNome: cliente.nome,
    clienteDocumento: cliente.cpf_cnpj,
    valor: params.valor,
    dataVencimento: params.dataVencimento,
  });

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('id')
    .eq('cliente_id', params.clienteId)
    .eq('status', 'ativa')
    .maybeSingle();

  const { data: faturamento, error: faturamentoError } = await supabase
    .from('faturamento')
    .insert({
      cliente_id: params.clienteId,
      assinatura_id: assinatura?.id ?? null,
      id_itau: itau.idItau,
      valor: params.valor,
      data_vencimento: params.dataVencimento,
      status: 'pendente',
      boleto_url: itau.boletoUrl,
    })
    .select('*')
    .single();

  if (faturamentoError) {
    throw new Error(`Erro ao salvar faturamento: ${faturamentoError.message}`);
  }

  return faturamento;
}
