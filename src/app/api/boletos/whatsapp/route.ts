import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { sendWhatsappMessage } from '@/lib/notifications/whatsapp';
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
      return NextResponse.json({ error: 'faturamentoId e obrigatorio.' }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from('faturamento')
      .select('id, valor, data_vencimento, boleto_url, linha_digitavel, pix_url, pix_qr_code, clientes!inner(nome, telefone, whatsapp)')
      .eq('id', faturamentoId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Faturamento nao encontrado.' }, { status: 404 });
    }

    const clienteInfo = Array.isArray(data.clientes) ? data.clientes[0] : data.clientes;
    const phone = clienteInfo?.whatsapp || clienteInfo?.telefone;

    if (!phone || !clienteInfo?.nome) {
      return NextResponse.json({ error: 'Cliente vinculado ao faturamento nao possui WhatsApp/telefone valido.' }, { status: 400 });
    }

    const message = [
      `Ola, ${clienteInfo.nome}. Seu boleto Solara foi gerado.`,
      `Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(data.valor))}`,
      `Vencimento: ${data.data_vencimento}`,
      data.linha_digitavel ? `Linha digitavel: ${data.linha_digitavel}` : null,
      data.pix_url || data.pix_qr_code ? `Pix: ${data.pix_url ?? data.pix_qr_code}` : null,
      data.boleto_url ? `Link: ${data.boleto_url}` : null,
    ].filter(Boolean).join('\n');

    const whatsappResult = await sendWhatsappMessage({
      to: phone,
      message,
    });

    return NextResponse.json({ ok: true, whatsappResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar WhatsApp.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
