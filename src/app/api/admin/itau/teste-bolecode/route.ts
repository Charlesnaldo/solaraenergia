import { NextResponse } from 'next/server';
import { getAuthenticatedAdminUser } from '@/lib/auth/admin';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { getItauCachedTokenDiagnostics } from '@/lib/itau/auth';
import { createSeuNumero, emitirBolecode, ItauBolecodeError } from '@/lib/itau/bolecode';

export const runtime = 'nodejs';

interface ClienteBolecodeTeste {
  id: string;
  nome: string;
  cpf_cnpj: string;
  email: string | null;
  cep: string | null;
  endereco_completo: string | null;
  rua: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function futureDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function maskDocument(value: string) {
  const digits = onlyDigits(value);
  if (digits.length <= 4) {
    return '***';
  }

  return `${digits.slice(0, 3)}***${digits.slice(-2)}`;
}

function maskEmail(value: string | null) {
  if (!value) {
    return null;
  }

  const [user, domain] = value.split('@');
  if (!user || !domain) {
    return '***';
  }

  return `${user.slice(0, 2)}***@${domain}`;
}

function readMensagemItau(raw: unknown) {
  if (!raw || typeof raw !== 'object') {
    return 'Simulacao BoleCode processada pelo Itau.';
  }

  const record = raw as Record<string, unknown>;
  const candidates = [record.mensagem, record.message, record.descricao, record.detail, record.title];
  const message = candidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0);

  return message?.slice(0, 240) ?? 'Simulacao BoleCode processada pelo Itau.';
}

async function readCliente(clienteId: string | undefined) {
  const supabase = createSupabaseServiceClient();

  if (clienteId) {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome, cpf_cnpj, email, cep, endereco_completo, rua, bairro, cidade, estado')
      .eq('id', clienteId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as ClienteBolecodeTeste;
  }

  const { data: activeClient } = await supabase
    .from('clientes')
    .select('id, nome, cpf_cnpj, email, cep, endereco_completo, rua, bairro, cidade, estado')
    .eq('status_assinatura', 'ativa')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (activeClient) {
    return activeClient as ClienteBolecodeTeste;
  }

  const { data } = await supabase
    .from('clientes')
    .select('id, nome, cpf_cnpj, email, cep, endereco_completo, rua, bairro, cidade, estado')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data as ClienteBolecodeTeste | null) ?? null;
}

async function readBody(req: Request) {
  try {
    return (await req.json()) as { clienteId?: string };
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  const adminUser = await getAuthenticatedAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await readBody(req);
  const clienteId = body.clienteId?.trim() || undefined;
  const itauClientId = process.env.ITAU_CLIENT_ID?.trim();

  if (clienteId && itauClientId && clienteId === itauClientId) {
    return NextResponse.json(
      {
        status: 'erro',
        mensagem_itau: null,
        erro: 'clienteId invalido. Use o ID de um cliente do banco, nunca o client_id do Itau.',
      },
      { status: 400 },
    );
  }

  const cliente = await readCliente(clienteId);
  if (!cliente) {
    return NextResponse.json(
      {
        status: 'erro',
        mensagem_itau: null,
        erro: 'Nenhum cliente real encontrado para teste.',
      },
      { status: 404 },
    );
  }

  const dataVencimento = futureDueDate();
  const valor = 1;

  try {
    const itau = await emitirBolecode({
      seuNumero: createSeuNumero(),
      valor,
      dataVencimento,
      simulacao: true,
      pagador: {
        nome: cliente.nome,
        cpfCnpj: cliente.cpf_cnpj,
        email: cliente.email,
        cep: cliente.cep,
        logradouro: cliente.rua ?? cliente.endereco_completo,
        bairro: cliente.bairro,
        cidade: cliente.cidade,
        uf: cliente.estado,
      },
      mensagem: 'Teste seguro de simulacao BoleCode Solara.',
    });

    return NextResponse.json(
      {
        status: 'ok',
        mensagem_itau: readMensagemItau(itau.raw),
        payload_sanitizado: {
          etapa_processo_boleto: 'simulacao',
          simulacao: true,
          valor: valor.toFixed(2),
          data_vencimento: dataVencimento,
          cliente: {
            id: cliente.id,
            nome_presente: Boolean(cliente.nome),
            documento: maskDocument(cliente.cpf_cnpj),
            email: maskEmail(cliente.email),
          },
          resultado_itau: {
            id_boleto_presente: Boolean(itau.idBoleto),
            nosso_numero_presente: Boolean(itau.nossoNumero),
            linha_digitavel_presente: Boolean(itau.linhaDigitavel),
            codigo_barras_presente: Boolean(itau.codigoBarras),
            qr_code_presente: Boolean(itau.qrCode),
            pix_url_presente: Boolean(itau.pixUrl),
            boleto_url_presente: Boolean(itau.boletoUrl),
          },
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const itauError = error instanceof ItauBolecodeError ? error : null;

    return NextResponse.json(
      {
        status: 'erro',
        mensagem_itau: itauError?.mensagemItau ?? null,
        erro: error instanceof Error ? error.message : 'Falha ao testar BoleCode em simulacao.',
        detalhe_itau: itauError?.diagnostics ?? null,
        diagnostico_token: getItauCachedTokenDiagnostics(),
        payload_sanitizado: {
          etapa_processo_boleto: 'simulacao',
          simulacao: true,
          valor: valor.toFixed(2),
          data_vencimento: dataVencimento,
          cliente: {
            id: cliente.id,
            documento: maskDocument(cliente.cpf_cnpj),
          },
        },
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
