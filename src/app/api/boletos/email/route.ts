import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { createBoletoPdfBuffer } from '@/lib/billing/pdf';
import { getPixPaymentPayload, normalizePixPayload, validatePixPayload } from '@/lib/itau/bolecode';
import { sendBoletoEmail, sendBoletoPdfEmail } from '@/lib/notifications/email';
import { getAuthenticatedAdminUser } from '@/lib/auth/admin';

export async function POST(req: Request) {
  try {
    const adminUser = await getAuthenticatedAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as { faturamentoId?: string };
    const faturamentoId = body.faturamentoId?.trim();

    if (!faturamentoId) {
      return NextResponse.json({ error: 'faturamentoId é obrigatório.' }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from('faturamento')
      .select('id, valor, data_vencimento, boleto_url, linha_digitavel, codigo_barras, pix_qr_code, pix_url, api_response, clientes!inner(nome, cpf_cnpj, email)')
      .eq('id', faturamentoId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Faturamento não encontrado.' }, { status: 404 });
    }

    const clienteInfo = Array.isArray(data.clientes) ? data.clientes[0] : data.clientes;
    if (!clienteInfo?.email || !clienteInfo?.nome || !clienteInfo?.cpf_cnpj) {
      return NextResponse.json({ error: 'Cliente vinculado ao faturamento não possui e-mail válido.' }, { status: 400 });
    }

    if (!data.boleto_url && !data.linha_digitavel && !data.codigo_barras && !data.pix_url && !data.pix_qr_code) {
      return NextResponse.json({ error: 'Este faturamento nao possui dados do Itau suficientes para envio.' }, { status: 400 });
    }

    const amount = Number(data.valor);
    const hasItauRawResponse = data.api_response !== null && data.api_response !== undefined;
    const pixPayloadFromItau = getPixPaymentPayload(data.api_response);
    const pixPayloadSaved = normalizePixPayload(data.pix_qr_code);
    const pixPaymentPayload =
      pixPayloadFromItau ||
      (!hasItauRawResponse && pixPayloadSaved && validatePixPayload(pixPayloadSaved) ? pixPayloadSaved : '');

    console.log('PIX PAYLOAD RECEBIDO DO ITAU', pixPayloadFromItau || null);
    console.log('PIX PAYLOAD SALVO NO BANCO', pixPayloadSaved || null);

    if (pixPayloadFromItau && pixPayloadSaved !== pixPayloadFromItau) {
      console.warn('[billing-pdf] Payload Pix salvo diverge do payload oficial do Itaú. Atualizando pix_qr_code.');
      const { error: updatePixError } = await supabase
        .from('faturamento')
        .update({ pix_qr_code: pixPayloadFromItau })
        .eq('id', data.id);

      if (updatePixError) {
        console.error('[billing-pdf] Erro ao atualizar pix_qr_code com payload oficial do Itaú:', updatePixError.message);
      }
    }
    const emailResult = data.boleto_url
      ? await sendBoletoEmail({
          to: clienteInfo.email,
          clientName: clienteInfo.nome,
          boletoUrl: data.boleto_url,
          dueDate: data.data_vencimento,
          amount,
        })
      : await sendBoletoPdfEmail({
          to: clienteInfo.email,
          clientName: clienteInfo.nome,
          dueDate: data.data_vencimento,
          amount,
          pdfBuffer: await createBoletoPdfBuffer({
            clientName: clienteInfo.nome,
            clientDocument: clienteInfo.cpf_cnpj,
            amount,
            dueDate: data.data_vencimento,
            boletoUrl: null,
            linhaDigitavel: data.linha_digitavel,
            codigoBarras: data.codigo_barras,
            pixUrl: data.pix_url,
            pixPayload: pixPaymentPayload || null,
            pixQrCode: data.pix_qr_code,
          }),
        });

    return NextResponse.json({ ok: true, emailResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar e-mail.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
