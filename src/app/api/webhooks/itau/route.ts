import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { sendPaymentConfirmedEmail } from '@/lib/notifications/email';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

const PAYMENT_CONFIRMED_MARKERS = [
  'pago',
  'paga',
  'paid',
  'liquidado',
  'liquidada',
  'liquidacao',
  'confirmado',
  'confirmada',
  'confirmed',
  'completed',
  'concluido',
  'concluida',
  'efetivado',
  'efetivada',
  'recebido',
  'recebida',
];

const STATUS_FIELD_NAMES = [
  'status',
  'situacao',
  'situacao_boleto',
  'situacaoBoleto',
  'codigo_situacao',
  'evento',
  'event',
  'type',
  'tipo_evento',
  'tipoEvento',
  'ocorrencia',
  'tipo_ocorrencia',
  'descricao',
  'mensagem',
];

const ID_ITAU_FIELD_NAMES = ['id_boleto', 'idBoleto', 'id_boleto_pix', 'idBoletoPix', 'numero_boleto', 'numeroBoleto'];
const NOSSO_NUMERO_FIELD_NAMES = ['nosso_numero', 'nossoNumero', 'numero_nosso_numero', 'numeroNossoNumero'];
const LINHA_DIGITAVEL_FIELD_NAMES = ['linha_digitavel', 'linhaDigitavel', 'numero_linha_digitavel', 'numeroLinhaDigitavel'];
const CODIGO_BARRAS_FIELD_NAMES = ['codigo_barras', 'codigoBarras', 'numero_codigo_barras', 'numeroCodigoBarras'];

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : null;
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function getConfiguredWebhookSecret() {
  return process.env.ITAU_WEBHOOK_SECRET?.trim() || process.env.ITAU_WEBHOOK_TOKEN?.trim() || '';
}

function getIncomingWebhookSecrets(req: Request) {
  const url = new URL(req.url);
  const authorization = req.headers.get('authorization') ?? '';
  const bearer = authorization.toLowerCase().startsWith('bearer ') ? authorization.slice(7).trim() : '';

  return [
    req.headers.get('x-webhook-secret'),
    req.headers.get('x-itau-webhook-secret'),
    req.headers.get('x-itau-signature'),
    bearer,
    url.searchParams.get('token'),
    url.searchParams.get('secret'),
  ].filter((value): value is string => Boolean(value?.trim()));
}

function verifyWebhookSecret(req: Request) {
  const configured = getConfiguredWebhookSecret();
  if (!configured) {
    console.error('[itau-webhook] Configure ITAU_WEBHOOK_SECRET para habilitar o webhook em producao.');
    return process.env.NODE_ENV !== 'production';
  }

  return getIncomingWebhookSecrets(req).some((incoming) => safeEqual(incoming.trim(), configured));
}

function collectStringsByFieldNames(value: unknown, fieldNames: string[], seen = new WeakSet<object>(), result = new Set<string>()) {
  if (!value || typeof value !== 'object') {
    return result;
  }

  if (seen.has(value)) {
    return result;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach((item) => collectStringsByFieldNames(item, fieldNames, seen, result));
    return result;
  }

  const expected = new Set(fieldNames.map(normalizeKey));
  Object.entries(value as JsonRecord).forEach(([key, nested]) => {
    if (expected.has(normalizeKey(key)) && typeof nested === 'string' && nested.trim()) {
      result.add(nested.trim());
    }

    if (nested && typeof nested === 'object') {
      collectStringsByFieldNames(nested, fieldNames, seen, result);
    }
  });

  return result;
}

function collectIdentifiers(payload: unknown) {
  const idItau = [...collectStringsByFieldNames(payload, ID_ITAU_FIELD_NAMES)];
  const nossoNumero = [...collectStringsByFieldNames(payload, NOSSO_NUMERO_FIELD_NAMES)];
  const linhaDigitavel = [...collectStringsByFieldNames(payload, LINHA_DIGITAVEL_FIELD_NAMES)];
  const codigoBarras = [...collectStringsByFieldNames(payload, CODIGO_BARRAS_FIELD_NAMES)];

  return {
    idItau,
    nossoNumero,
    linhaDigitavel: [...new Set(linhaDigitavel.flatMap((value) => [value, onlyDigits(value)]).filter(Boolean))],
    codigoBarras: [...new Set(codigoBarras.flatMap((value) => [value, onlyDigits(value)]).filter(Boolean))],
  };
}

function isPaymentConfirmed(payload: unknown) {
  const statusValues = [...collectStringsByFieldNames(payload, STATUS_FIELD_NAMES)];
  return statusValues.some((value) => {
    const normalized = normalizeText(value);
    return PAYMENT_CONFIRMED_MARKERS.some((marker) => normalized.includes(marker));
  });
}

async function findFaturamentoByWebhookPayload(payload: unknown) {
  const supabase = createSupabaseServiceClient();
  const identifiers = collectIdentifiers(payload);
  const select = '*, clientes!inner(id, nome, email)';

  const attempts: Array<{ field: string; values: string[] }> = [
    { field: 'id_itau', values: identifiers.idItau },
    { field: 'nosso_numero', values: identifiers.nossoNumero },
    { field: 'linha_digitavel', values: identifiers.linhaDigitavel },
    { field: 'codigo_barras', values: identifiers.codigoBarras },
  ];

  for (const attempt of attempts) {
    const values = [...new Set(attempt.values.map((value) => value.trim()).filter(Boolean))];
    if (!values.length) {
      continue;
    }

    const { data, error } = await supabase
      .from('faturamento')
      .select(select)
      .in(attempt.field, values)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao buscar faturamento por ${attempt.field}: ${error.message}`);
    }

    if (data) {
      return data;
    }
  }

  return null;
}

function getClienteInfo(faturamento: JsonRecord) {
  const cliente = Array.isArray(faturamento.clientes) ? faturamento.clientes[0] : faturamento.clientes;
  return asRecord(cliente);
}

export async function GET() {
  return NextResponse.json({ ok: true, webhook: 'itau' }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  try {
    if (!verifyWebhookSecret(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => null);
    if (!payload) {
      return NextResponse.json({ error: 'Payload invalido.' }, { status: 400 });
    }

    console.log('[itau-webhook] Payload recebido:', JSON.stringify(payload));

    if (!isPaymentConfirmed(payload)) {
      return NextResponse.json({ ok: true, ignored: true, reason: 'Evento nao indica pagamento confirmado.' });
    }

    const supabase = createSupabaseServiceClient();
    const faturamento = await findFaturamentoByWebhookPayload(payload);
    if (!faturamento) {
      console.error('[itau-webhook] Pagamento confirmado sem faturamento correspondente.', collectIdentifiers(payload));
      return NextResponse.json({ ok: false, matched: false, error: 'Faturamento nao encontrado para o webhook.' }, { status: 200 });
    }

    const previousStatus = String(faturamento.status ?? '');
    const paidAt = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from('faturamento')
      .update({ status: 'pago', updated_at: paidAt })
      .eq('id', faturamento.id)
      .select('*, clientes!inner(id, nome, email)')
      .single();

    if (updateError || !updated) {
      throw new Error(updateError?.message ?? 'Erro ao atualizar faturamento como pago.');
    }

    let emailResult: unknown = null;
    const cliente = getClienteInfo(updated);
    const email = typeof cliente?.email === 'string' ? cliente.email.trim() : '';
    const clientName = typeof cliente?.nome === 'string' ? cliente.nome : 'Cliente Solara';

    if (previousStatus !== 'pago' && email) {
      try {
        emailResult = await sendPaymentConfirmedEmail({
          to: email,
          clientName,
          dueDate: String(updated.data_vencimento),
          amount: Number(updated.valor ?? 0),
          paidAt,
          faturamentoId: String(updated.id),
        });
      } catch (emailError) {
        console.error('[itau-webhook] Pagamento marcado como pago, mas falhou ao enviar e-mail.', emailError);
      }
    }

    return NextResponse.json({
      ok: true,
      matched: true,
      faturamento_id: updated.id,
      previous_status: previousStatus,
      status: updated.status,
      emailResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao processar webhook Itau.';
    console.error('[itau-webhook] Erro:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
